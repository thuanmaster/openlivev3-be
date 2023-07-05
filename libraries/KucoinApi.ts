const api = require('kucoin-node-api')
import { BotTelegram } from './BotTelegram';
import { ParamWithdraw } from '../types';
export class KucoinApi {
    constructor(apiKey: string, secretKey: string, passphrase: string) {
        const config = {
            apiKey,
            secretKey,
            passphrase,
            environment: 'live'
        }
        api.init(config)
    }

    async withdraw(params: ParamWithdraw) {
        try {
            let dataParams: any = {
                currency: params.currency,
                address: params.address,
                amount: params.amount,
                chain: params.chain,
            }
            if (params.memo != "" && params.memo != null) {
                dataParams.memo = params.memo
            }

            if (params.isInner != null) {
                dataParams.memo = params.memo
            }

            if (params.remark != "" && params.remark != null) {
                dataParams.remark = params.remark
            }

            const result = await api.applyForWithdrawal(dataParams)
            if (result.code == '200000') {
                return { status: true, data: result.data };
            } else {
                BotTelegram.sendMessageError(`KucoinApi - withdraw: ${result.msg}`);
                return { status: false, msg: result.msg };
            }
        } catch (e) {
            BotTelegram.sendMessageError(`KucoinApi - withdraw: ${e}`);
            return { status: false, msg: 'unknown' };
        }
    }

    async withdrawHistory() {
        try {
            const result = await api.getWithdrawalsList();
            if (result.code == '200000') {
                return { status: true, data: result.data };
            } else {
                BotTelegram.sendMessageError(`KucoinApi - withdrawHistory: ${result.msg}`);
                return { status: false, msg: result.msg };
            }
        } catch (e) {
            BotTelegram.sendMessageError(`KucoinApi - withdrawHistory: ${e}`);
            return { status: false, msg: "unknown" };
        }
    }
}