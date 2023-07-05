'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from '@ourparentcenter/moleculer-decorators-extended';
const CronJob = require("moleculer-cronjob");
import { BotTelegram } from '../../libraries';

@Service({
    name: 'CronjobBonusInvest',
    version: 1,
    mixins: [CronJob],
    settings: {
        cronTime: '59 59 01 * * *',
        withoutOverlapping: true
    }
})
export default class CronjobBonusInvestService extends moleculer.Service {
    @Method
    async onTick() {
        this.$cronjob.stop()
    }

    @Method
    async onComplete() {
        try {
            BotTelegram.sendMessageError(`CronjobBonusInvestService - running`);
            await this.broker.call('v1.investment.bonusInvest')
            this.$cronjob.start()
        } catch (error) {
            BotTelegram.sendMessageError(`CronjobBonusInvestService - onComplete: ${error}`);
            this.$cronjob.start()
        }

    }
}
