'use strict';
import moleculer, { Context } from 'moleculer';
const BullMqMixin = require('moleculer-bullmq')
import { Action, Method, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { Config } from '../../common';
import { Web3Token, Web3Withdraw, BotTelegram, KucoinApi, Web3Deposit } from '../../libraries';
import { convertNonDecimal, decodeString, delay } from '../../mixins/dbMixins/helpers.mixin';
import { ParamClaimDepositQueue, ParamSendFeeDepositQueue, statusTransaction } from '../../types';
import { IBlockChain, IChainWallet, ICurrency, ICurrencyAttr } from 'entities';
@Service({
    name: 'claimDepositQueue',
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
export default class ClaimDepositQueueService extends moleculer.Service {
    @Action({
        name: 'claimDeposit',
        cache: false
    })
    async claimDeposit(ctx: Context<ParamClaimDepositQueue>) {
        try {
            const params = ctx.params
            return await this.localQueue(ctx, 'handleClaimDeposit', { blockchain_id: params.blockchain_id, currency_id: params.currency_id, user_id: params.user_id }, { priority: 10, delay: 2000 })
        } catch (e) {
            BotTelegram.sendMessageError(`ClaimDepositQueueService - claimDeposit: ${e}`);
            return false;
        }
    }

    @Action({
        name: 'handleClaimDeposit',
        queue: true
    })
    async handleClaimDeposit(ctx: Context<ParamClaimDepositQueue>) {
        try {
            const params = ctx.params
            const blockchain: IBlockChain = await ctx.call('v1.blockchain.id', { id: params.blockchain_id });
            if (!blockchain) {
                BotTelegram.sendMessageError(`ClaimDepositQueueService - handleClaimDeposit: Blockchain not found`);
                await ctx.locals.job.updateProgress(100)
                return false;
            }

            const currency: ICurrency = await ctx.call('v1.currency.find', { currency_id: params.currency_id });
            if (!currency) {
                BotTelegram.sendMessageError(`ClaimDepositQueueService - handleClaimDeposit: Currency not found`);
                await ctx.locals.job.updateProgress(100)
                return false;
            }

            const currencyAttr: ICurrencyAttr = await ctx.call('v1.currencyAttr.find', { currency_id: currency._id, chain_id: blockchain._id })
            if (!currencyAttr) {
                BotTelegram.sendMessageError(`ClaimDepositQueueService - handleClaimDeposit: Currency not found`);
                await ctx.locals.job.updateProgress(100)
                return false;
            }

            const addressRecevie: string = await this.broker.call("v1.setting.getByKey", { key: "WALLET_RECEVIE_DEPOSIT" })
            if (addressRecevie == null) {
                BotTelegram.sendMessageError(`ClaimDepositQueueService - handleClaimDeposit: Wallet recevie not found`);
                await ctx.locals.job.updateProgress(100)
                return false;
            }

            let dataCreate: any = {
                'currency': currency.code,
                'chain': blockchain.code,
                'total_amount': 0,
                'admin_claim': params.user_id,
                list_crawl: []
            }
            const wallets: any = await ctx.call('v1.wallet.getWalletClaimDeposit', { chain: blockchain.code, currency: currency.code });
            if (wallets.length > 0) {
                const web3Deposit = new Web3Deposit(blockchain.rpc, currencyAttr.contract, JSON.parse(currencyAttr.abi))
                let walletCrawls = []
                const walletChain: IChainWallet = await ctx.call('v1.chainWallet.getWalletChain', { chainId: blockchain._id?.toString() });
                if (!walletChain) {
                    BotTelegram.sendMessageError(`ClaimDepositQueueService - handleClaimDeposit: Chain wallet not found`);
                    await ctx.locals.job.updateProgress(100)
                    return false;
                }

                for (let i = 0; i < wallets.length; i++) {
                    let wallet = wallets[i]
                    if (wallet.onhold >= currency.min_crawl) {
                        wallet.balance = wallet.onhold;
                        walletCrawls.push(wallet)
                    }
                }

                if (walletCrawls.length > 0) {
                    let total_amount = 0;
                    let list_crawl: any = []
                    for (let i = 0; i < walletCrawls.length; i++) {
                        const walletCrawl = walletCrawls[i]
                        const address = walletCrawl.address;
                        const private_key = decodeString(walletCrawl.private_key);
                        const crawDeposit = await web3Deposit.crawDeposit(private_key, address, addressRecevie, walletCrawl.balance)
                        if (crawDeposit != false) {
                            total_amount += walletCrawl.balance;
                            list_crawl.push({ address, value: walletCrawl.balance, txHash: crawDeposit.transactionHash })
                            await ctx.call('v1.wallet.updateOnholdZero', { id: walletCrawl._id.toString() });
                        }
                        await delay(1000);
                    }
                    dataCreate.total_amount = total_amount;
                    dataCreate.list_crawl = list_crawl;
                }
                const decimals = await web3Deposit.getDecimals()
                BotTelegram.sendMessageDeposit(`Claim Deposit success total_amount: ${convertNonDecimal(dataCreate.total_amount, decimals) + currency.code} admin_claim: ${dataCreate.admin_claim}`)
            }
            await ctx.call('v1.admin.ClaimDeposit.create', dataCreate)
            await ctx.locals.job.updateProgress(100)
            return true;
        } catch (e) {
            BotTelegram.sendMessageError(`ClaimDepositQueueService - handleClaimDeposit: ${e}`);
            await ctx.locals.job.updateProgress(100)
            return false;
        }
    }

    @Action({
        name: 'sendFeeDeposit',
        cache: false
    })
    async sendFeeDeposit(ctx: Context<ParamSendFeeDepositQueue>) {
        try {
            const params = ctx.params
            return await this.localQueue(ctx, 'handleSendFeeDeposit', {
                chain: params.chain,
                currency: params.currency,
                address: params.address
            }, { priority: 10, delay: 2000 })
        } catch (e) {
            BotTelegram.sendMessageError(`ClaimDepositQueueService - sendFeeDeposit: ${e}`);
            return false;
        }
    }

    @Action({
        name: 'handleSendFeeDeposit',
        queue: true
    })
    async handleSendFeeDeposit(ctx: Context<ParamSendFeeDepositQueue>) {
        try {
            const params = ctx.params
            const blockchain: IBlockChain = await ctx.call('v1.blockchain.findByCode', { code: params.chain });
            if (!blockchain) {
                BotTelegram.sendMessageError(`ClaimDepositQueueService - handleClaimDeposit: Blockchain not found`);
                await ctx.locals.job.updateProgress(100)
                return false;
            }

            const currency: ICurrency = await ctx.call('v1.currency.findByCode', { code: params.currency });
            if (!currency) {
                BotTelegram.sendMessageError(`ClaimDepositQueueService - handleClaimDeposit: Currency not found`);
                await ctx.locals.job.updateProgress(100)
                return false;
            }

            const currencyAttr: ICurrencyAttr = await ctx.call('v1.currencyAttr.find', { currency_id: currency._id, chain_id: blockchain._id })
            if (!currencyAttr) {
                BotTelegram.sendMessageError(`ClaimDepositQueueService - handleClaimDeposit: Currency not found`);
                await ctx.locals.job.updateProgress(100)
                return false;
            }

            const walletChain: IChainWallet = await ctx.call('v1.chainWallet.getWalletChain', { chainId: blockchain._id?.toString() });
            if (!walletChain) {
                BotTelegram.sendMessageError(`ClaimDepositQueueService - handleClaimDeposit: Chain wallet not found`);
                await ctx.locals.job.updateProgress(100)
                return false;
            }

            if (blockchain.type == "ETHEREUM") {
                const web3Deposit = new Web3Deposit(blockchain.rpc, currencyAttr.contract, JSON.parse(currencyAttr.abi))
                const balance: number = await web3Deposit.getBalance(params.address)
                const balanceD: number = +convertNonDecimal(balance, 18);
                if (balanceD <= 0.005) {
                    const checkSend = await web3Deposit.sendAmountFeeChain(params.address, 0.005, walletChain.privateKey)
                    if (checkSend == false) {
                        await ctx.call('v1.claimDepositQueue.sendFeeDeposit', {
                            currency: params.currency,
                            chain: params.chain,
                            address: params.address
                        });
                        BotTelegram.sendMessageError(`ClaimDepositQueueService - handleSendFeeDeposit: send fee error retry `);
                        await ctx.locals.job.updateProgress(100)
                        return true;
                    }
                    BotTelegram.sendMessageError(`ClaimDepositQueueService - handleSendFeeDeposit: send success `);
                } else {
                    BotTelegram.sendMessageError(`ClaimDepositQueueService - handleSendFeeDeposit: balanceD :${balanceD}`);
                }
            } else {
                BotTelegram.sendMessageError(`ClaimDepositQueueService - handleSendFeeDeposit: `);
            }
            await ctx.locals.job.updateProgress(100)
            return true;
        } catch (e) {
            BotTelegram.sendMessageError(`ClaimDepositQueueService - handleSendFeeDeposit: ${e}`);
            await ctx.locals.job.updateProgress(100)
            return false;
        }
    }
}
