'use strict';
import moleculer, { Context } from 'moleculer';
const BullMqMixin = require('moleculer-bullmq')
import { Action, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { Config } from '../../common';
import { BotTelegram } from '../../libraries';
import { delay } from '../../mixins/dbMixins/helpers.mixin';

@Service({
    name: 'investmentQueue',
    version: 1,
    mixins: [BullMqMixin],
    settings: {
        bullmq: {
            worker: { concurrency: 5000 },
            client: {
                username: Config.REDIS_INFO.username,
                password: Config.REDIS_INFO.password,
                host: Config.REDIS_INFO.host,
                port: Config.REDIS_INFO.port,
                db: Config.REDIS_INFO.db,
                tls: Config.REDIS_INFO.tls
            }
        }
    }
})
export default class InvesmentQueueService extends moleculer.Service {

    @Action({
        name: 'directCommission'
    })
    async checkTxHash(ctx: Context) {
        try {
            const params: any = ctx.params
            return await this.localQueue(ctx, 'handleDirectCommission', { investment_id: params.investment_id })
        } catch (e) {
            BotTelegram.sendMessageError(`InvesmentQueueService - checkHash: ${e}`);
            return false;
        }
    }

    @Action({
        name: 'handleDirectCommission',
        queue: true
    })
    async handleCreateDirectCommission(ctx: Context) {
        try {
            const params: any = ctx.params
            await delay(3000)
            await ctx.call('v1.directCommission.commissionInvest', { investment_id: params.investment_id })
            ctx.locals.job.updateProgress(100)
            return true;
        } catch (e) {
            BotTelegram.sendMessageError(`InvesmentQueueService - handleDirectCommission: ${e}`);
            return false;
        }
    }

    @Action({
        name: 'mintNft'
    })
    async mintNft(ctx: Context) {
        try {
            const params: any = ctx.params
            return await this.localQueue(ctx, 'handleMintNft', { investment_id: params.investment_id })
        } catch (e) {
            BotTelegram.sendMessageError(`InvesmentQueueService - mintNft: ${e}`);
            return false;
        }
    }

    @Action({
        name: 'handleMintNft',
        queue: true
    })
    async handleMintNft(ctx: Context) {
        try {
            const params: any = ctx.params
            await delay(3000)
            await ctx.call('v1.investment.mintNft', { investment_id: params.investment_id })
            ctx.locals.job.updateProgress(100)
            return true;
        } catch (e) {
            BotTelegram.sendMessageError(`InvesmentQueueService - handleMintNft: ${e}`);
            return false;
        }
    }
}
