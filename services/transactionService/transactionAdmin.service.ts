'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters } from 'moleculer-db';
import { dbTransactionMixin, eventsTransactionMixin, generateCode } from '../../mixins/dbMixins';
import Moralis from 'moralis/node';
import * as _ from 'lodash';
import {
    actionTransaction,
    CheckHashDepositParams,
    CheckHashDepositParamsValidator,
    CompletedDepositParams,
    CompletedDepositParamsValidator,
    CrawlDepositParams,
    CrawlDepositParamsValidator,
    MoleculerDBService,
    ParamTransactionDepositByTxHash,
    ParamTransactionDepositByTxHashValidator,
    paymentMethod,
    RestOptions,
    statusTransaction,
    TransactionAdminServiceOptions,
    TransactionAdminServiceSettingsOptions,
} from '../../types';

import { IBlockChain, IChainWallet, ICurrency, ICurrencyAttr, ITransaction, TransactionEntity } from '../../entities';
import moment from 'moment';
import { CustomValidator } from '../../validators';
import { Web3Deposit, Web3Token } from '../../libraries';
import axios from 'axios';
import { convertObjectId, decodeString, delay } from '../../mixins/dbMixins/helpers.mixin';

@Service<TransactionAdminServiceOptions>({
    name: 'admin.transaction',
    version: 1,
    mixins: [dbTransactionMixin, eventsTransactionMixin],
    settings: {
        idField: '_id',
        pageSize: 10,
        rest: '/v1/admin/transaction',
        fields: [
            '_id',
            'customer',
            'currency',
            'chain',
            'fee',
            'amount',
            'action',
            'payment_method',
            'status',
            'balance',
            'note',
            'txhash',
            'balanceBefore',
            'createdAt',
            'updatedAt',
        ]
    },
})
export default class TransactionAdminService extends MoleculerDBService<TransactionAdminServiceSettingsOptions, ITransaction> {
    /**
     *  @swagger
     *
     *  /v1/admin/transaction/list:
     *    get:
     *      tags:
     *      - "Admin Transaction"
     *      summary: get list Transaction
     *      description: get list Transaction
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - name: page
     *          description: page
     *          in: query
     *          required: true
     *          type: number
     *          example : 1
     *          default : 1
     *        - name: pageSize
     *          description: pageSize
     *          in: query
     *          required: true
     *          type: number
     *          example : 10
     *          default : 10
     *        - name: txhash
     *          description: txhash transaction
     *          in: query
     *          required: false
     *          type: string
     *          example : 1234567890
     *        - name: currency
     *          description: code currency
     *          in: query
     *          required: false
     *          type: string
     *          example : ZUKI
     *        - name: chain
     *          description: code chain
     *          in: query
     *          required: false
     *          type: string
     *          example : BEP20
     *        - name: type
     *          description: type transaction (DEPOSIT/WITHDRAW)
     *          in: query
     *          required: false
     *          type: string
     *          example : DEPOSIT
     *        - name: customer_id
     *          description: customer_id
     *          in: query
     *          required: false
     *          type: string
     *          example : 12345123
     *        - name: status
     *          description: status
     *          in: query
     *          required: false
     *          type: string
     *          example : COMPLETED
     *        - name: from_date
     *          description: from_date - timestamp
     *          in: query
     *          required: false
     *          type: number
     *          example : 1651853180
     *        - name: to_date
     *          description: to_date - timestamp
     *          in: query
     *          required: false
     *          type: number
     *          example : 1651853180
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: get list Transaction
     *        403:
     *          description: Server error
     */
    @Get<RestOptions>('/list', {
        name: 'list',
        middleware: ['authAdmin'],
        cache: false,
    })
    async list(ctx: Context<DbContextParameters>) {
        try {

            let params: any = this.sanitizeParams(ctx, ctx.params);
            let query: any = {}

            if (params.currency != undefined && params.currency != "") {
                query.currency = params.currency;
            }
            if (params.customer_id != undefined && params.customer_id != "") {
                query.customer = convertObjectId(params.customer_id);
            }
            if (params.chain != undefined && params.chain != "") {
                query.chain = params.chain;
            }
            if (params.txhash != undefined && params.txhash != "") {
                query.txhash = params.txhash;
            }
            if (params.status != undefined && params.status != "") {
                query.status = params.status;
            }
            if (params.type != undefined && params.type != "") {
                query.action = params.type;
            }
            if (params.from_date != undefined && params.from_date != "" && params.to_date != undefined && params.to_date != "") {
                query.createdAt = {
                    $gte: params.from_date,
                    $lt: params.to_date
                };
            }

            params.query = query
            const data = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
            return this.responseSuccess(data);
        } catch (error) {
            this.logger.error("TransactionService - list", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/transaction/cancelWithdraw:
     *    post:
     *      tags:
     *      - "Admin Transaction"
     *      summary: cancel Transaction withdraw
     *      description: cancel Transaction withdraw
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - name: transaction_id
     *          description: transaction_id
     *          in: query
     *          required: true
     *          type: number
     *          example : 1
     *          default : 1
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: cancel Transaction -withdraw
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/cancelWithdraw', {
        name: 'cancelWithdraw',
        middleware: ['authAdmin'],
        cache: false,
    })
    async cancelWithdraw(ctx: Context<DbContextParameters>) {
        try {
            const user: any = await ctx.call('v1.admin.user.resolveTokenHeader');
            if (!user) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }
            let params: any = ctx.params;
            const transaction: any = await this.adapter.findById(params.transaction_id);
            if (transaction) {
                if (transaction.action != actionTransaction.WITHDRAW) {
                    return this.responseError('err_not_found', "Transaction not found");
                }

                if (transaction.status == statusTransaction.COMPLETED) {
                    return this.responseError('err_not_found', "Transaction completed");
                }

                if (transaction.status == statusTransaction.CANCELED) {
                    return this.responseError('err_not_found', "Transaction canceled");
                }

                if (transaction.status == statusTransaction.PROCESSING) {
                    return this.responseError('err_not_found', "Transaction processing");
                }
                
                await ctx.call('v1.transaction.updateStatus', { transactionId: transaction._id, status: statusTransaction.CANCELED });
                const balance: number = await ctx.call('v1.transaction.getBalance', { currency_code: transaction.currency, customer_id: transaction.customer })
                const code = generateCode(20);
                let entityReverse = {
                    customer: transaction.customer,
                    currency: transaction.currency,
                    chain: transaction.chain,
                    action: actionTransaction.REVERSE,
                    amount: transaction.amount,
                    amount_usd: transaction.amount_usd,
                    fee: 0,
                    balance: balance + +transaction.amount,
                    balanceBefore: balance,
                    payment_method: paymentMethod.CRYPTO,
                    txhash: code,
                    order: null,
                    note: `REVERSE transaction withdraw : ${transaction._id.toString()}`,
                    status: statusTransaction.COMPLETED,
                    admin_id:user._id.toString()
                }
                await ctx.call('v1.transaction.create', entityReverse);
                
                const transactionFee: any = await this.adapter.findOne({ action: actionTransaction.FEE, order: transaction._id.toString() });
                if (transactionFee) {
                    const balanceFee: number = await ctx.call('v1.transaction.getBalance', { currency_code: transactionFee.currency, customer_id: transaction.customer })
                    const codeFee = generateCode(20);
                    let entityFee = {
                        customer: transaction.customer,
                        currency: transactionFee.currency,
                        chain: transactionFee.chain,
                        action: actionTransaction.REVERSE,
                        amount: transactionFee.amount,
                        amount_usd: transactionFee.amount_usd,
                        fee: 0,
                        balance: balanceFee + +transactionFee.amount,
                        balanceBefore: balanceFee,
                        payment_method: paymentMethod.CRYPTO,
                        txhash: codeFee,
                        order: null,
                        note: `REVERSE transaction fee : ${transactionFee._id.toString()}`,
                        status: statusTransaction.COMPLETED
                    }
                    await ctx.call('v1.transaction.create', entityFee);
                    await ctx.call('v1.transaction.updateStatus', { transactionId: transactionFee._id, status: statusTransaction.CANCELED });
                }
                await ctx.call('v1.transaction.update', { id: transaction._id, entity: { admin_id: user._id } });
                return this.responseSuccessMessage("Cancel transaction withdraw success");
            } else {
                return this.responseError('err_not_found', "Transaction not found");
            }
        } catch (error) {
            this.logger.error("TransactionService - cancel", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/transaction/approveWithdraw:
     *    post:
     *      tags:
     *      - "Admin Transaction"
     *      summary: approve Transaction withdraw
     *      description: approve Transaction withdraw
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - name: transaction_id
     *          description: transaction_id
     *          in: query
     *          required: true
     *          type: string
     *          example : 1
     *          default : 1
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: approve Transaction -withdraw
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/approveWithdraw', {
        name: 'approveWithdraw',
        middleware: ['authAdmin'],
        cache: false,
    })
    async approveWithdraw(ctx: Context<DbContextParameters>) {
        try {
            const user: any = await ctx.call('v1.admin.user.resolveTokenHeader');
            if (!user) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }

            let params: any = ctx.params;
            const transaction: any = await this.adapter.findById(params.transaction_id);
            if (transaction) {
                if (transaction.action != actionTransaction.WITHDRAW) {
                    return this.responseError('err_not_found', "Transaction not found");
                }

                if (transaction.status == statusTransaction.COMPLETED) {
                    return this.responseError('err_not_found', "Transaction completed");
                }

                if (transaction.status == statusTransaction.CANCELED) {
                    return this.responseError('err_not_found', "Transaction canceled");
                }
               
                if (transaction.status == statusTransaction.PROCESSING) {
                    return this.responseError('err_not_found', "Transaction processing");
                }
                await ctx.call('v1.transaction.accepted', { transactionId: transaction._id });
                await ctx.call('v1.transaction.update', { id: transaction._id, entity: { admin_id: user._id } });

                return this.responseSuccessMessage("resend transaction withdraw success");
            } else {
                return this.responseError('err_not_found', "Transaction not found");
            }
        } catch (error) {
            this.logger.error("TransactionService - Retry", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/transaction/retryWithdraw:
     *    post:
     *      tags:
     *      - "Admin Transaction"
     *      summary: retry Transaction withdraw
     *      description: retry Transaction withdraw
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - name: transaction_id
     *          description: transaction_id
     *          in: query
     *          required: true
     *          type: number
     *          example : 1
     *          default : 1
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: retry Transaction -withdraw
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/retryWithdraw', {
        name: 'retryWithdraw',
        middleware: ['authAdmin'],
        cache: false,
    })
    async retryWithdraw(ctx: Context<DbContextParameters>) {
        try {
            let params: any = ctx.params;
            const transaction: any = await this.adapter.findById(params.transaction_id);
            if (transaction) {
                if (transaction.action != actionTransaction.WITHDRAW) {
                    return this.responseError('err_not_found', "Transaction not found");
                }

                if (transaction.status == statusTransaction.COMPLETED) {
                    return this.responseError('err_not_found', "Transaction completed");
                }

                if (transaction.status == statusTransaction.CANCELED) {
                    return this.responseError('err_not_found', "Transaction canceled");
                }

                if (transaction.status == statusTransaction.PROCESSING) {
                    return this.responseError('err_not_found', "Transaction processing");
                }

                await ctx.call('v1.transaction.updateStatus', { transactionId: transaction._id, status: statusTransaction.CREATED });

                return this.responseSuccessMessage("Retry transaction withdraw success");
            } else {
                return this.responseError('err_not_found', "Transaction not found");
            }
        } catch (error) {
            this.logger.error("TransactionService - Retry", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/transaction/checkHashDeposit:
     *    post:
     *      tags:
     *      - "Admin Transaction"
     *      summary: check Hash Deposit Transaction
     *      description: check Hash Deposit Transaction
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - in: body
     *          name: params
     *          schema:
     *            type: object
     *            required:
     *              - tx_hash
     *              - chain_code
     *            properties:
     *              tx_hash:
     *                type: string
     *                default: tx_hash
     *              chain_code:
     *                type: string
     *                default: BEP20
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: check Hash Deposit Transaction
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/checkHashDeposit', {
        name: 'checkHashDeposit',
        middleware: ['authAdmin'],
        cache: false,
    })
    async checkHashDeposit(ctx: Context<CheckHashDepositParams>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, CheckHashDepositParamsValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const blockchain: any = await ctx.call('v1.blockchain.findByCode', { code: entity.chain_code });
            const apiUrl: string = await this.broker.call("v1.setting.getByKey", { key: "HOOK_BSC_TTS_API_CHECK_HASH" })
            if (blockchain) {
                const dataApi = await axios({
                    method: 'post',
                    url: apiUrl,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    data: {
                        hash: entity.tx_hash,
                        chainCode: entity.chain_code
                    }
                });
                if (dataApi && dataApi.data != undefined) {
                    const data = dataApi.data;
                    if (data.result.length > 0) {
                        const result = data.result[0];
                        const tokenAddress = result.tokenAddress;
                        const from = result.from;
                        const to = result.to;
                        const value = +result.value;
                        const transactionHash = result.transactionHash;
                        const blockNumber = result.blockNumber;

                        if (tokenAddress != "" && tokenAddress != null && value > 0) {
                            const currencyAttr: any = await this.broker.call('v1.currencyAttr.findByContract', { contract: tokenAddress });
                            if (currencyAttr) {
                                let amount = value / 10 ** currencyAttr.decimal;
                                const checkHash = await this.broker.call('v1.TransactionTemp.checkExistTxHash', { txhash: transactionHash });
                                const wallet = await this.broker.call('v1.wallet.findByAddress', { address: to });
                                if (wallet && !checkHash && blockchain && amount > 0) {
                                    amount = amount * 10 ** 18
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
                                } else {
                                    return this.responseError('err_not_found', "Data hash not found");
                                }
                            } else {
                                return this.responseError('err_not_found', "Data hash not found");
                            }
                        } else {
                            const currency: any = await this.broker.call('v1.currency.findByCode', { code: blockchain.native_token });
                            const checkHash = await this.broker.call('v1.TransactionTemp.checkExistTxHash', { txhash: transactionHash });
                            const wallet = await this.broker.call('v1.wallet.findByAddress', { address: to });
                            const currencyAttr: any = await this.broker.call('v1.currencyAttr.find', { currency_id: currency._id, chain_id: blockchain._id });
                            if (wallet && !checkHash && currency && blockchain && value > 0 && currencyAttr) {
                                let amount = value / 10 ** currencyAttr.decimal;
                                amount = amount * 10 ** 18
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
                            } else {
                                return this.responseError('err_not_found', "Data hash not found");
                            }
                        }
                        return this.responseSuccessMessage("Get transaction deposit success");
                    } else {
                        return this.responseError('err_not_found', "Data hash not found");
                    }
                } else {
                    return this.responseError('err_not_found', "Data hash not found");
                }
            } else {
                return this.responseError('err_not_found', "Blockchain not found");
            }
        } catch (error) {
            this.logger.error("TransactionService - Retry", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/transaction/completedDeposit:
     *    post:
     *      tags:
     *      - "Admin Transaction"
     *      summary: completedDeposit Transaction
     *      description: completedDeposit Transaction
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - in: body
     *          name: params
     *          schema:
     *            type: object
     *            required:
     *              - transaction_id
     *            properties:
     *              transaction_id:
     *                type: string
     *                default: tx_hash
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: completedDeposit Transaction
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/completedDeposit', {
        name: 'completedDeposit',
        middleware: ['authAdmin'],
        cache: false,
    })
    async completedDeposit(ctx: Context<CompletedDepositParams>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, CompletedDepositParamsValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const transaction: any = await ctx.call('v1.transaction.findById', { _id: entity.transaction_id })
            if (transaction) {
                await this.adapter.updateById(entity.transaction_id, { $set: { status: statusTransaction.COMPLETED } });
                return this.responseSuccessMessage("Completed deposit transaction success");
            } else {
                return this.responseError('err_not_found', "Transaction not found");
            }
        } catch (error) {
            this.logger.error("TransactionService - Retry", error);
            return this.responseUnkownError();
        }
    }

    @Post<RestOptions>('/depositByHash', {
        name: 'depositByHash',
        middleware: ['authAdmin'],
        cache: false,
    })
    async depositByHash(ctx: Context<ParamTransactionDepositByTxHash>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, ParamTransactionDepositByTxHashValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }
            const checkHash = await this.broker.call('v1.TransactionTemp.checkExistTxHash', { txhash: entity.txHash });
            if (checkHash) {
                return this.responseError('err_not_found', "txHash exist");
            }
            const currency: any = await ctx.call('v1.currency.findByCode', { code: entity.currency_code });
            if (!currency) {
                return this.responseError('err_not_found', "currency not found");
            }

            const blockChain: any = await ctx.call('v1.blockchain.findByCode', { code: entity.chain_code });
            if (blockChain) {
                const web3Token = new Web3Token(blockChain.rpc);
                const detailTransaction = await web3Token.getTransactionReceipt(entity.txHash);
                if (detailTransaction) {
                    const addressTo = entity.addressTo;
                    const addressFrom = detailTransaction.from;
                    const blockNumber = detailTransaction.blockNumber;

                    const wallet = await this.broker.call('v1.wallet.findByAddress', { address: addressTo });
                    if (wallet) {
                        const amount = +entity.amount;
                        const dataDeposit = {
                            from: addressFrom,
                            to: addressTo,
                            transactionHash: entity.txHash,
                            blockNumber,
                            amount,
                            currency_id: currency._id.toString(),
                            chain_id: blockChain._id.toString()
                        }

                        await ctx.call('v1.transaction.deposit', dataDeposit);
                        return this.responseSuccess({ messsage: "Get deposit success" })
                    } else {
                        return this.responseError('err_not_found', "Wallet not found");
                    }
                } else {
                    return this.responseError('err_not_found', "Check hash fail");
                }
            } else {
                return this.responseError('err_not_found', "Blockchain not found");
            }
        } catch (error) {
            this.logger.error('transactionSerrvice - depositByHash:', error);
            return this.responseUnkownError();
        }
    }
}
