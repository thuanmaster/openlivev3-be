'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Post, Get, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { RestOptions, MoleculerDBService, ParamSyncAddress } from '../../types';
import { DbContextParameters } from 'moleculer-db';
import { BotTelegram } from '../../libraries';
import axios from 'axios';
import { convertDecimal, convertNonDecimal } from '../../mixins/dbMixins/helpers.mixin';
@Service({
    name: 'hook.tts',
    version: 1,
    settings: {
        rest: '/v1/hook/tts'
    },
})
export default class HookDepositTTSService extends MoleculerDBService<any, any> {

    @Post<RestOptions>('/deposit', {
        name: 'deposit',
        cache: false,
    })
    async deposit(ctx: Context<DbContextParameters>) {
        try {
            let params: any = ctx.params
            const chainCode = params.chainCode;
            const blockchain: any = await ctx.call('v1.blockchain.findByCode', { code: chainCode });
            if (blockchain) {
                const tokenAddress = params.tokenAddress;
                const from = params.from;
                const to = params.to;
                const value = +params.value;
                const transactionHash = params.transactionHash;
                const blockNumber = params.blockNumber;
                if (tokenAddress != "" && tokenAddress != null && value > 0) {
                    const currencyAttr: any = await this.broker.call('v1.currencyAttr.findByContract', { contract: tokenAddress });
                    if (currencyAttr) {
                        let amount = convertNonDecimal(value, currencyAttr.decimal);
                        const checkHash = await this.broker.call('v1.TransactionTemp.checkExistTxHash', { txhash: transactionHash });
                        const wallet = await this.broker.call('v1.wallet.findByAddress', { address: to });
                        if (wallet && !checkHash && blockchain && amount > 0) {
                            amount = convertDecimal(amount, 18)
                            const dataDeposit = {
                                from: from,
                                to: to,
                                transactionHash,
                                blockNumber,
                                amount,
                                currency_id: currencyAttr.currency_id,
                                chain_id: blockchain._id.toString()
                            }
                            await ctx.call('v1.transaction.deposit', dataDeposit);
                        }
                    }
                } else {
                    const currency: any = await this.broker.call('v1.currency.findByCode', { code: blockchain.native_token });
                    const checkHash = await this.broker.call('v1.TransactionTemp.checkExistTxHash', { txhash: transactionHash });
                    const wallet = await this.broker.call('v1.wallet.findByAddress', { address: to });
                    const currencyAttr: any = await this.broker.call('v1.currencyAttr.find', { currency_id: currency._id, chain_id: blockchain._id });
                    if (wallet && !checkHash && currency && blockchain && value > 0 && currencyAttr) {
                        let amount = convertNonDecimal(value, currencyAttr.decimal);
                        amount = convertDecimal(amount, 18)
                        const dataDeposit = {
                            from: from,
                            to: to,
                            transactionHash,
                            blockNumber,
                            amount,
                            currency_id: currency._id.toString(),
                            chain_id: blockchain._id.toString()
                        }
                        await ctx.call('v1.transaction.deposit', dataDeposit);
                    }
                }
                return this.responseSuccessMessage("Hook success");
            } else {
                this.logger.error("HookDepositTTSService - deposit: blockchain not found:", params.chainCode);
                BotTelegram.sendMessageError(`HookDepositTTSService - deposit: blockchain not found:${params}`)
                return this.responseUnkownError();
            }
        } catch (error) {
            this.logger.error("HookDepositTTSService - deposit", error);
            BotTelegram.sendMessageError(`HookDepositTTSService - deposit: ${error}`)
            return this.responseUnkownError();
        }
    }

    @Get<RestOptions>('/getAllWallet', {
        name: 'getAllWallet',
        cache: false
    })
    async getAllWallet(ctx: Context<DbContextParameters>) {
        try {
            const wallets: any = await ctx.call("v1.wallet.getAllWallet");
            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i]
                await ctx.call('v1.hook.tts.syncAddress', { chainCode: wallet.chain, address: wallet.address });
            }

            return true
        } catch (error) {
            this.logger.error("HookDepositTTSService - getAllWallet", error);
            BotTelegram.sendMessageError(`HookDepositTTSService - getAllWallet: ${error}`)
            return this.responseUnkownError();
        }
    }

    @Action({
        name: 'syncAddress',
        cache: false
    })
    async syncAddress(ctx: Context<ParamSyncAddress>) {
        try {
            const params = ctx.params;
            const apiUrl: string = await this.broker.call("v1.setting.getByKey", { key: "HOOK_BSC_TTS_URL" })
            const apiKey: string = await this.broker.call("v1.setting.getByKey", { key: "HOOK_BSC_TTS_API_KEY" })
            const key: string = await this.broker.call("v1.setting.getByKey", { key: "HOOK_BSC_TTS_USER_ID" })
            if (apiUrl != null && apiKey != null && key != null) {
                await axios({
                    method: 'post',
                    url: apiUrl,
                    headers: {
                        'Content-Type': 'application/json',
                        token: apiKey
                    },
                    data: {
                        key,
                        address: [{ value: params.address, type: "to" }],
                        chainCode: [params.chainCode]
                    }
                });
            }

            return true;
        } catch (error) {
            this.logger.error("HookDepositTTSService - syncAddress:", error)
            BotTelegram.sendMessageError(`HookDepositTTSService - syncAddress: ${error}`);
            return false;
        }
    }
}