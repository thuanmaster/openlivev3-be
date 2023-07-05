'use strict';
import moleculer, { Context } from 'moleculer';
import { Method, Service } from '@ourparentcenter/moleculer-decorators-extended';
const CronJob = require("moleculer-cronjob");
import { actionTransaction } from '../../types';
import { BotTelegram } from '../../libraries';
@Service({
    name: 'handleDepositCron',
    version: 1,
    mixins: [CronJob],
    settings: {
        cronTime: '*/10 * * * * *',
        withoutOverlapping: true
    }
})
export default class CronHandleTransactionTempService extends moleculer.Service {
    @Method
    async onTick() {
        try {
            const transactionTemps: any = await this.broker.call('v1.TransactionTemp.getTransactionProcess');
            if (transactionTemps != false) {
                for (let i = 0; i < transactionTemps.length; i++) {
                    const transactionTemp = transactionTemps[i];
                    if (transactionTemp.action == actionTransaction.DEPOSIT) {
                        await this.broker.call('v1.transaction.handleDeposit', transactionTemp);
                    }
                }
            }
        } catch (error) {
            this.logger.error("CronHandleTransactionTempService - onTick:", error)
            BotTelegram.sendMessageError(`CronHandleTransactionTempService - onTick: ${error}`);
        }
    }
}
