'use strict';
import moleculer, { Context } from 'moleculer';
const BullMqMixin = require('moleculer-bullmq')
import { Action, Method, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { Config } from '../../common';
import { Web3Token, Web3Withdraw, BotTelegram, KucoinApi } from '../../libraries';
import { Types } from 'mongoose';
import { statusTransaction } from '../../types';

@Service({
    name: 'withdrawQueue',
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
export default class WithdrawQueueService extends moleculer.Service {

    @Action({
        name: 'withdraw',
        cache: false
    })
    async withdraw(ctx: Context) {
        try {
            const params: any = ctx.params
            return await this.localQueue(ctx, 'handleWithdraw', { transactionId: params.transactionId }, { priority: 10 })
        } catch (e) {
            BotTelegram.sendMessageError(`WithdrawQueueService - withdraw: ${e}`);
            return false;
        }
    }

    @Action({
        name: 'checkWithdraw'
    })
    async checkWithdraw(ctx: Context) {
        try {
            const params: any = ctx.params
            return await this.localQueue(ctx, 'handleCheckWithdraw', params, { priority: 10, delay: 10000 })
        } catch (e) {
            BotTelegram.sendMessageError(`WithdrawQueueService - checkWithdraw: ${e}`);
            return false;
        }
    }

    @Action({
        name: 'handleCheckWithdraw',
        queue: true
    })
    async handleCheckWithdraw(ctx: Context) {
        try {
            const params: any = ctx.params
            const transactionId = params.transactionId
            const transaction: any = await ctx.call('v1.transaction.findById', { _id: transactionId });
            if (transaction && transaction.status == statusTransaction.PROCESSING) {
                const blockchain: any = await ctx.call('v1.blockchain.findByCode', { code: transaction.chain });
                if (blockchain) {
                    const web3Token = new Web3Token(blockchain.rpc);
                    const check = await web3Token.checkStatusTransaction(params.txhash);
                    if (check) {
                        await ctx.call('v1.transaction.completeWithdraw', { transactionId: transactionId, txhash: params.txhash, link_scan: blockchain.scan })
                    } else {
                        await this.localQueue(ctx, 'handleCheckWithdraw', { transactionId: transactionId, txhash: params.txhash }, { delay: 60000 })
                    }
                }
            }
            await ctx.locals.job.updateProgress(100)
            return true;
        } catch (e) {
            BotTelegram.sendMessageError(`WithdrawQueueService - handleCheckWithdraw: ${e}`);
            return false;
        }
    }



    @Action({
        name: 'handleWithdraw',
        cache: false,
        queue: true
    })
    async handleWithdraw(ctx: Context) {
        try {
            const params: any = ctx.params
            const transactionId = Types.ObjectId(params.transactionId)
            const transaction: any = await ctx.call('v1.transaction.findById', { _id: transactionId.toString() });
            if (transaction && (transaction.status == statusTransaction.ACCEPTED || params.retry == true)) {
                const currency: any = await ctx.call('v1.currency.findByCode', { code: transaction.currency });
                const blockchain: any = await ctx.call('v1.blockchain.findByCode', { code: transaction.chain });
                if (blockchain && currency) {
                    const currencyAttr: any = await ctx.call('v1.currencyAttr.find', { currency_id: currency._id, chain_id: blockchain._id })
                    if (currencyAttr) {
                        let amount: number = +transaction.amount - +transaction.fee;
                        if (currencyAttr.type_withdraw == "ONCHAIN") {
                            const wallet: any = await ctx.call('v1.chainWallet.getWalletAvaliable', { chainId: blockchain._id.toString() });
                            await ctx.call('v1.transaction.updateStatus', { transactionId: transactionId, status: statusTransaction.PROCESSING });
                            if (wallet) {
                                const web3Token = new Web3Withdraw(blockchain.rpc, currencyAttr.contract, JSON.parse(currencyAttr.abi), wallet.address, wallet.privateKey);
                                if (transaction.currency == 'ZUKI' && transaction.chain == 'BEP20') {
                                    amount = amount / 0.99;
                                }
                                amount = amount / 1e18;
                                const check = await web3Token.sendWithdraw(transaction.to, amount)
                                if (check) {
                                    await ctx.call('v1.chainWallet.updateNotUse', { walletId: wallet._id.toString() });
                                    await ctx.call('v1.withdrawQueue.checkWithdraw', { transactionId: transactionId, txhash: check.transactionHash })
                                } else {
                                    await this.localQueue(ctx, 'handleWithdraw', { transactionId: params.transactionId, retry: true }, { priority: 10, delay: 60000 })
                                    BotTelegram.sendMessageWithdraw(`Handle Withdraw transactionId:${transactionId} has error when send on network, please check balance of address: ${wallet.address}`);
                                }
                            } else {
                                await this.localQueue(ctx, 'handleWithdraw', { transactionId: params.transactionId, retry: true }, { priority: 10, delay: 60000 })
                                BotTelegram.sendMessageWithdraw(`Handle Withdraw transactionId:${transactionId} all wallet send busy, please check admin manager`);
                            }
                        } else {
                            await this.handleWithdrawKucoin(currencyAttr.type_withdraw, amount, transaction._id.toString(), transaction.to, transaction.tag);
                        }
                    } else {
                        BotTelegram.sendMessageError(`handleWithdraw ${transactionId} currencyAttr not found`);
                    }
                } else {
                    BotTelegram.sendMessageError(`handleWithdraw ${transactionId} blockchain not found or currency`);
                }
            } else {
                BotTelegram.sendMessageError(`handleWithdraw ${transactionId} transaction not found`);
            }
            await ctx.locals.job.updateProgress(100)
            return true;
        } catch (e) {
            BotTelegram.sendMessageError(`WithdrawQueueService - handleWithdraw: ${e}`);
            return false;
        }
    }

    @Method
    async handleWithdrawKucoin(type_withdraw: string, amount: number, transactionId: string, address: string, tag: string) {
        try {
            const apiKey: string = await this.broker.call("v1.setting.getByKey", { key: "KUCOIN_API_KEY" })
            const secretKey: string = await this.broker.call("v1.setting.getByKey", { key: "KUCOIN_SECRET_KEY" })
            const passphrase: string = await this.broker.call("v1.setting.getByKey", { key: "KUCOIN_PASSPHRASE" })
            const kucoinApi = new KucoinApi(apiKey, secretKey, passphrase);
            const dataTypeWithdraw = type_withdraw.split("_");
            const data = await kucoinApi.withdraw(
                {
                    currency: dataTypeWithdraw[0],
                    address: address,
                    amount: amount / 1e18,
                    chain: dataTypeWithdraw[1],
                    remark: transactionId,
                    memo: tag,
                    isInner: false
                }
            )
            if (data.status == true) {
                await this.broker.call('v1.transaction.update', {
                    id: transactionId,
                    entity: {
                        status: statusTransaction.PROCESSING,
                        order: data.data.withdrawalId
                    }
                });
            } else {
                BotTelegram.sendMessageError(`withdraw kucoin has error - transactionId: ${transactionId}`);
            }
            return true;
        } catch (e) {
            BotTelegram.sendMessageError(`WithdrawQueueService - handleWithdrawKucoin: ${e}`);
            return false;
        }
    }
}
