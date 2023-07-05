'use strict';
import moleculer, { Context } from 'moleculer';
const BullMqMixin = require('moleculer-bullmq')
import { Action, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { Config } from '../../common';
import { Web3Token, BotTelegram } from '../../libraries';

@Service({
    name: 'transactionQueue',
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
export default class TransactionQueueService extends moleculer.Service {

    @Action({
        name: 'checkTxHash'
    })
    async checkTxHash(ctx: Context) {
        try {
            const params: any = ctx.params
            return await this.localQueue(ctx, 'handleCheckTxHash', { txhash: params.txhash, transactionId: params.transactionId })
        } catch (e) {
            BotTelegram.sendMessageError(`TransactionQueueService - checkHash: ${e}`);
            return false;
        }
    }

    @Action({
        name: 'createTransaction'
    })
    async createTransaction(ctx: Context) {
        try {
            const params: any = ctx.params
            return await this.localQueue(ctx, 'handleCreateTransaction', params, { priority: 10, delay: 2000 })
        } catch (e) {
            BotTelegram.sendMessageError(`TransactionQueueService - createTransaction: ${e}`);
            return false;
        }
    }

    @Action({
        name: 'handleCheckTxHash',
        queue: true
    })
    async handleCheckTxHash(ctx: Context) {
        try {
            const params: any = ctx.params
            const transaction: any = await ctx.call('v1.transaction.checkExistTxHash', { txhash: params.txhash });
            if (transaction) {
                const blockchain: any = await ctx.call('v1.blockchain.findByCode', { code: transaction.chain });
                if (blockchain) {
                    const web3Token = new Web3Token(blockchain.rpc);
                    const check = await web3Token.checkStatusTransaction(params.txhash);
                    if (check) {
                        await ctx.call('v1.transaction.complete', { transactionId: transaction._id })
                        await ctx.locals.job.updateProgress(100)
                    } else {
                        BotTelegram.sendMessageError(`TransactionQueueService - handleCheckTxHash: ${check}`);
                        return await this.localQueue(ctx, 'handleCheckTxHash', params)
                    }
                } else {
                    BotTelegram.sendMessageError(`TransactionQueueService - handleCheckTxHash transaction not found: ${params}`);
                }
            } else {
                BotTelegram.sendMessageError(`TransactionQueueService - handleCheckTxHash transaction not found: ${params}`);
            }
            return true;
        } catch (e) {
            BotTelegram.sendMessageError(`TransactionQueueService - handleCheckTxHash: ${e}`);
            return false;
        }
    }

    @Action({
        name: 'handleCreateTransaction',
        queue: true
    })
    async handleCreateTransaction(ctx: Context) {
        try {
            const params: any = ctx.params
            await ctx.call('v1.transaction.createTransaction', params);
            ctx.locals.job.updateProgress(100)
            return true;
        } catch (e) {
            BotTelegram.sendMessageError(`TransactionQueueService - handleCreateTransaction: ${e}`);
            return false;
        }
    }
}
