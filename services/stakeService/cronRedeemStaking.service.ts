'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from '@ourparentcenter/moleculer-decorators-extended';
const CronJob = require("moleculer-cronjob");
import moment from 'moment';
import { BotTelegram } from '../../libraries';
@Service({
    name: 'CronRedeemStaking',
    version: 1,
    mixins: [CronJob],
    settings: {
        cronTime: '*/30 * * * *',
        withoutOverlapping: true
    }
})
export default class CronRedeemStakingService extends moleculer.Service {
    @Method
    async onTick() {
        this.$cronjob.stop()
    }

    @Method
    async onComplete() {
        await this.getRedeemStake();
        this.$cronjob.start()
    }

    @Method
    async getRedeemStake() {
        try {
            const orders: any = await this.broker.call('v1.order.getOrderRedeem');
            if (orders.length > 0) {
                const now = moment().unix()
                for (let i = 0; i < orders.length; i++) {
                    const order = orders[i]
                    if (order.redemption_date <= now) {
                        await this.broker.call('v1.order.redeemtion', { order_id: order._id });
                    }
                }
            }
        } catch (error) {
            this.logger.error("CronRedeemStakingService - getRedeemStake:", error)
            BotTelegram.sendMessageError(`CronRedeemStakingService - getRedeemStake: ${error}`);
        }
    }
}
