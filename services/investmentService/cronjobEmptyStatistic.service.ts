'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from '@ourparentcenter/moleculer-decorators-extended';
const CronJob = require("moleculer-cronjob");
import { BotTelegram } from '../../libraries';

@Service({
    name: 'CronjobEmptyStatistic',
    version: 1,
    mixins: [CronJob],
    settings: {
        cronTime: '01 01 01 1 * *',
        withoutOverlapping: true
    }
})
export default class CronjobEmptyStatisticService extends moleculer.Service {
    @Method
    async onTick() {
        this.$cronjob.stop()
    }

    @Method
    async onComplete() {
        try {
            const customers: any = await this.broker.call('v1.customer.getAll')
            for (let i = 0; i < customers.length; i++) {
                const customer = customers[i]
                await this.broker.call('v1.investmentStatistic.createDataEmpty', { customer_id: customer._id.toString() })
            }
            this.$cronjob.start()
        } catch (error) {
            BotTelegram.sendMessageError(`cronjobEmptyStatisticService - onComplete: ${error}`);
            this.$cronjob.start()
        }

    }
}
