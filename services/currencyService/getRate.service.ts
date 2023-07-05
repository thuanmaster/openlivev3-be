'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Service } from '@ourparentcenter/moleculer-decorators-extended';
const CronJob = require("moleculer-cronjob");
import axios from 'axios';
import { SettingTypes } from '../../types';

@Service({
    name: 'cronGetRate',
    version: 1,
    mixins: [CronJob],
    settings: {
        cronTime: '*/40 * * * * *',
        withoutOverlapping: true
    }
})
export default class CronGetRateService extends moleculer.Service {
    @Method
    async onTick() {
        try {
            const currencies: any = await this.broker.call('v1.currency.getCurrencyRate');
            if (currencies != false) {
                for (let i = 0; i < currencies.length; i++) {
                    const currency = currencies[i];
                    const arrayLink = currency.link_rate;
                    const dataLink: any = arrayLink[Math.floor(Math.random() * arrayLink.length)];
                    if (dataLink && dataLink.type !== undefined) {
                        if (dataLink.type == "MEXC") {
                            this.getRateMexc(currency._id.toString(), dataLink.link);
                        }
                        if (dataLink.type == "BINANCE") {
                            this.getRateBinance(currency._id.toString(), dataLink.link);
                        }
                        if (dataLink.type == "PANCAKE") {
                            this.getRatePancake(currency._id.toString(), dataLink.link);
                        }
                        if (dataLink.type == "DEXSCREENER") {
                            this.getRateDexScreener(currency._id.toString(), dataLink.link);
                        }
                        if (dataLink.type == "COINMARKETCAP") {
                            this.getRateCoinMarketcap(currency._id.toString(), dataLink.link);
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error("CronGetRateService:", error);
        }
    }

    @Method
    async getRateDexScreener(currencyId: string, link: string) {
        try {
            const price = await axios({
                method: "GET",
                url: link
            })

            if (price.data != undefined && price.data.pair != undefined && price.data.pair.priceUsd != undefined) {
                const rate = price.data.pair.priceUsd;
                if (rate != null) {
                    this.broker.call('v1.currency.updateRate', { id: currencyId, rate });
                }
            }
        } catch (error) {
            this.logger.error("CronGetRateService getRateDexScreener:", error);
        }
    }

    @Method
    async getRateCoinMarketcap(currencyId: string, link: string) {
        try {
            const marketCapProKey: any = await this.broker.call("v1.setting.getByKey", { key: SettingTypes.MARKETCAP_PRO_KEY });
            if (marketCapProKey != null) {
                const price = await axios.get(link, {
                    headers: {
                        'X-CMC_PRO_API_KEY': marketCapProKey,
                    },
                })
                if (Object.values(price?.data?.data)?.[0] != undefined) {
                    const dataPrice:any = Object.values(price?.data?.data)?.[0]
                    const rate = dataPrice.quote.USD.price;
                    if (rate != null && rate != undefined) {
                        this.broker.call('v1.currency.updateRate', { id: currencyId, rate });
                    }
                }
            }
        } catch (error) {
            this.logger.error("CronGetRateService getRateCoinMarketcap:", error);
        }
    }

    @Method
    async getRateMexc(currencyId: string, link: string) {
        try {
            const price = await axios({
                method: "GET",
                url: link
            })
            if (price.data != undefined) {
                const dataRate = price.data.data[0]
                const rate = dataRate.last;
                if (rate != null) {
                    this.broker.call('v1.currency.updateRate', { id: currencyId, rate });
                }
            }
        } catch (error) {
            this.logger.error("CronGetRateService getRateMexc:", error);
        }
    }

    @Method
    async getRatePancake(currencyId: string, link: string) {
        try {
            const price = await axios({
                method: "GET",
                url: link
            })
            if (price.data != undefined) {
                const dataRate = price.data
                const rate = dataRate.data.price;
                if (rate != null) {
                    this.broker.call('v1.currency.updateRate', { id: currencyId, rate });
                }
            }
        } catch (error) {
            this.logger.error("CronGetRateService getRatePancake:", error);
        }
    }

    @Method
    async getRateBinance(currencyId: string, link: string) {
        try {
            const price = await axios({
                method: "GET",
                url: link
            })
            if (price.data != undefined) {
                const dataRate = price.data
                const rate = dataRate.price;
                if (rate != null) {
                    this.broker.call('v1.currency.updateRate', { id: currencyId, rate });
                }
            }
        } catch (error) {
            this.logger.error("CronGetRateService getRateBinance:", error);
        }
    }

}
