'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters } from 'moleculer-db';
import { dbTransactionMixin, eventsTransactionMixin, generateCode } from '../../mixins/dbMixins';
import * as _ from 'lodash';
import { Types } from 'mongoose';
import {
    actionTransaction,
    CurencyType,
    MoleculerDBService,
    ParamGetBalance,
    ParamResendVerifyTransactionCode,
    ParamResendVerifyTransactionCodeValidator,
    ParamTransactionDeposit,
    ParamTransactionExchange,
    ParamTransactionExchangeValidator,
    ParamTransactionWithdraw,
    ParamTransactionWithdrawValidator,
    ParamVerifyTransactionWithdraw,
    ParamVerifyTransactionWithdrawValidator,
    paymentMethod,
    RestOptions,
    SettingTypes,
    statusTransaction,
    SystemCommissionType,
    TotalEarnedHarvestCustomerParams,
    TransactionServiceOptions,
    TransactionServiceSettingsOptions
} from '../../types';

import { IBlockChain, ICurrency, ICurrencyAttr, ITransaction, TransactionEntity } from '../../entities';
import { CustomValidator } from '../../validators';
import { Otplib, Web3Token, BotTelegram } from '../../libraries';
import { JsonConvert } from 'json2typescript';
import moment from 'moment';
import { convertNonDecimal, convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
import { Config } from '../../common';
import { log } from 'console';

@Service<TransactionServiceOptions>({
    name: 'transaction',
    version: 1,
    mixins: [dbTransactionMixin, eventsTransactionMixin],
    settings: {
        idField: '_id',
        pageSize: 10,
        rest: '/v1/transaction',
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
            'txhash',
            'from',
            'to',
            'order',
            'note',
            'balanceBefore',
            'createdAt',
            'updatedAt',
        ]
    },
})
export default class TransactionService extends MoleculerDBService<TransactionServiceSettingsOptions, ITransaction> {
    /**
     *  @swagger
     *
     *  /v1/transaction/list:
     *    get:
     *      tags:
     *      - "Transaction"
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
     *        - name: currency
     *          description: code currency
     *          in: query
     *          required: false
     *          type: string
     *          example : ZUKI
     *        - name: chain_code
     *          description: code chain
     *          in: query
     *          required: false
     *          type: string
     *          example : BEP20
     *        - name: txhash
     *          description: txhash
     *          in: query
     *          required: false
     *          type: string
     *          example : txhash
     *        - name: type
     *          description: type transaction (DEPOSIT/WITHDRAW)
     *          in: query
     *          required: false
     *          type: string
     *          example : DEPOSIT
     *        - name: from_date
     *          description: from_date
     *          in: query
     *          required: false
     *          type: integer
     *          example : 1667981524 
     *        - name: to_date
     *          description: to_date
     *          in: query
     *          required: false
     *          type: integer
     *          example : 1668196037 
     *        - name: is_exchange
     *          description: filter list exchange
     *          in: query
     *          required: false
     *          type: string
     *          example : false
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
        middleware: ['auth'],
        cache: false,
    })
    async list(ctx: Context<DbContextParameters>) {
        try {
            const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }
            let params: any = this.sanitizeParams(ctx, ctx.params);
            let query: any = {
                customer: convertObjectId(customer._id.toString())
            }

            if (params.currency != undefined) {
                query.currency = params.currency;
            }

            if (params.txhash != undefined) {
                query.txhash = params.txhash;
            }

            if (params.chain_code != undefined) {
                query.chain = params.chain_code;
            }

            let action: any = [];
            if (params.type != undefined && params.type != "") {
                action.push(params.type)
            }

            if (params.is_exchange != undefined && params.is_exchange != "" && params.is_exchange == "true") {
                _.merge(action, [actionTransaction.EXCHANGE_IN, actionTransaction.EXCHANGE_OUT])
            }

            if (action.length > 0) {
                query.action = { $in: action };
            }

            if (params.from_date != undefined && params.to_date != undefined) {
                query.createdAt = { $gte: +params.from_date, $lt: +params.to_date };
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
     *  /v1/transaction/detail:
     *    get:
     *      tags:
     *      - "Transaction"
     *      summary: get detail Transaction
     *      description: get detail Transaction
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
     *          example : 63357ea08fc19d0012e1ae7a
     *          default : 63357ea08fc19d0012e1ae7a
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: get detail Transaction
     *        403:
     *          description: Server error
     */
    @Get<RestOptions>('/detail', {
        name: 'detail',
        middleware: ['auth'],
        cache: false,
    })
    async detail(ctx: Context) {
        try {
            const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }
            let params: any = ctx.params;
            if (params.transaction_id == undefined || params.transaction_id == null || params.transaction_id == "") {
                return this.responseError('err_not_found', 'Transaction not found');
            }

            let transaction: any = await this.adapter.findById(params.transaction_id);
            if (!transaction) {
                return this.responseError('err_not_found', 'Transaction not found');
            }

            if (transaction.customer.toString() != customer._id.toString()) {
                return this.responseError('err_not_found', 'Transaction not found');
            }
            const currency: any = await ctx.call('v1.currency.findByCode', { code: transaction.currency });
            const blockchain: IBlockChain = await ctx.call('v1.blockchain.findByCode', { code: transaction.chain });
            transaction.blockchain = blockchain
            transaction.currencyData = currency
            return this.responseSuccess(transaction);
        } catch (error) {
            this.logger.error("TransactionService - detail", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/transaction/withdraw:
     *    post:
     *      tags:
     *      - "Transaction"
     *      summary: Transaction withdraw
     *      description: Transaction withdraw
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      security:
     *        - Bearer: [] 
     *      parameters:
     *        - in: body
     *          name: params
     *          schema:
     *            type: object
     *            required:
     *              - currency_code
     *              - chain_code
     *              - amount
     *              - address
     *            properties:
     *              currency_code:
     *                type: string
     *                default: ZUKI
     *              chain_code:
     *                type: string
     *                default: BEP20
     *              address:
     *                type: string
     *                default: address
     *              addressTag:
     *                type: string
     *                default: addressTag
     *              amount:
     *                type: number
     *                default: 1000000000000000000
     *      responses:
     *        200:
     *          description: Transaction withdraw
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/withdraw', {
        name: 'withdraw',
        middleware: ['auth', 'captcha', 'FORBIDDEN_WITHDRAW', 'FORBIDDEN_ALL'],
        cache: false,
    })
    async withdraw(ctx: Context<ParamTransactionWithdraw>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, ParamTransactionWithdrawValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }
            let hasFeeChain: boolean = false;
            let currencyNative: any = null;
            let balanceNative: number = 0;
            let amount = +entity.amount;
            let amountFeeChain: number = 0;

            const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }

            if (customer.status_2fa != 1) {
                return this.responseError('err_require_2fa', 'Transaction requires 2FA.');
            }

            const checkKycWithdraw: any = await ctx.call("v1.setting.getByKey", { key: SettingTypes.CHECK_KYC_WITHDRAW })
            if (checkKycWithdraw != null) {
                if (customer.status_kyc != 2) {
                    return this.responseError('err_require_kyc', 'Transaction requires KYC.');
                }
            }

            const currency: ICurrency = await ctx.call('v1.currency.findByCode', { code: entity.currency_code });
            const blockchain: IBlockChain = await ctx.call('v1.blockchain.findByCode', { code: entity.chain_code });

            if (!currency) {
                return this.responseError('err_not_found', 'Currency maintenance');
            }

            if (!blockchain) {
                return this.responseError('err_not_found', 'Chain maintenance');
            }

            if (blockchain.type == 'ETHEREUM') {
                const web3Token = new Web3Token(blockchain.rpc);
                const checkAddress = await web3Token.isAddress(entity.address)
                if (checkAddress == false) {
                    return this.responseError('err_not_found', 'Address wrong format');
                }
            }

            const currencyAttr: ICurrencyAttr = await ctx.call('v1.currencyAttr.find', { currency_id: currency._id, chain_id: blockchain._id })
            if (!currencyAttr) {
                return this.responseError('err_not_found', 'Chain or Currency maintenance');
            }

            if (currencyAttr.type_withdraw == "") {
                return this.responseError('err_not_found', `${currency.title} can't withdraw.`);
            }

            const maxWithdraw: any = this.getMaxAmountWithdraw(customer);
            const amount_usd = amount * currency.usd_rate;
            if (maxWithdraw.amountInTransaction < amount_usd) {
                return this.responseError('err_amount_invalid', `The amount cannot exceed  ${convertNonDecimal(maxWithdraw.amountInTransaction, 18)} USD`);
            }

            const transactionToday: any = await ctx.call("v1.transaction.getTransactionWithdrawToday", { customerId: customer._id });
            const sum = _.sumBy(transactionToday, 'amount_usd');

            const max_amount_withdraw_daily: number = currencyAttr.max_amount_withdraw_daily
            const max_amount_withdraw_daily_currency: string = currencyAttr.max_amount_withdraw_daily_currency

            const withdraw_daily_currency: ICurrency = await ctx.call('v1.currency.find', { currency_id: max_amount_withdraw_daily_currency });
            if (withdraw_daily_currency && max_amount_withdraw_daily > 0) {
                const maxAmountDaily = max_amount_withdraw_daily * withdraw_daily_currency.usd_rate;
                if (+sum + amount_usd >= maxAmountDaily) {
                    return this.responseError('err_amount_invalid', `Maximum withdrawal limit per day is  ${convertNonDecimal(max_amount_withdraw_daily, 18) + withdraw_daily_currency.code}`);
                }
            }


            if (amount < currencyAttr.min_withdraw || amount > currencyAttr.max_withdraw) {
                let min_withdraw = convertNonDecimal(currencyAttr.min_withdraw, 18);
                let max_withdraw = convertNonDecimal(currencyAttr.max_withdraw, 18);
                return this.responseError('err_amount_invalid', `Amount withdraw must be greater than  ${min_withdraw} ${currency.code} and less than  ${max_withdraw} ${currency.code}`);
            }

            const checkWallet: any = await ctx.call('v1.wallet.findWallet', { currency: currency.code, chain: blockchain.code, address: entity.address, customer_id: customer._id });
            if (checkWallet) {
                return this.responseError('err_data_existed', `You can't withdraw to yourself`);
            }

            const wallet: any = await ctx.call('v1.wallet.findWallet', { currency: currency.code, chain: blockchain.code, customer_id: customer._id });
            if (!wallet) {
                return this.responseError('err_amount_invalid', `Your ${entity.currency_code} is not enough to withdraw!`);
            }

            const balance: number = await ctx.call('v1.transaction.getBalance', { currency_code: currency.code, customer_id: customer._id })
            if (balance > 0 && balance >= amount) {
                if (currencyAttr) {
                    if (currencyAttr.withdraw_fee_chain > 0) {
                        currencyNative = await ctx.call('v1.currency.findByCode', { code: currencyAttr.native_token });
                        if (currencyNative) {
                            balanceNative = await ctx.call('v1.transaction.getBalance', {
                                currency_code: currencyNative.code,
                                customer_id: customer._id
                            })

                            if (balanceNative <= 0) {
                                return this.responseError('err_balance_not_enough', 'The balance in the native wallets is not enough');
                            }
                            if (currencyAttr.withdraw_fee_chain > balanceNative) {
                                return this.responseError('err_balance_not_enough', 'The balance in the native wallets is not enough');
                            }
                            hasFeeChain = true;
                            amountFeeChain = currencyAttr.withdraw_fee_chain;
                        } else {
                            return this.responseError('err_not_found', 'Currency native not found');
                        }
                    }

                    const code = generateCode(20);

                    let fee: number = 0;
                    const percentFee = currencyAttr.withdraw_fee_token;
                    const feeType = currencyAttr.withdraw_fee_token_type;

                    if (percentFee > 0) {
                        if (feeType == 0) {
                            fee = amount * (percentFee / 100);
                        } else {
                            fee = percentFee;
                        }
                    }

                    if (hasFeeChain) {
                        if (currency._id == currencyNative._id) {
                            if (balance < (amount + amountFeeChain)) {
                                return this.responseError('err_balance_not_enough', 'The balance in the wallets is not enough');
                            }
                        }
                    }
                    let entityCreate = {
                        customer: convertObjectId(customer._id.toString()),
                        currency: currency.code,
                        chain: blockchain.code,
                        action: actionTransaction.WITHDRAW,
                        amount: amount,
                        amount_usd: amount * currency.usd_rate,
                        fee,
                        balance: balance - amount,
                        balanceBefore: balance,
                        payment_method: paymentMethod.CRYPTO,
                        txhash: code,
                        from: wallet.address,
                        to: entity.address,
                        tag: entity.addressTag,
                        order: null,
                        status: statusTransaction.CREATED
                    }
                    const transaction: any = await ctx.call('v1.transaction.create', entityCreate);
                    if (hasFeeChain) {
                        if (currency._id == currencyNative._id) {
                            balanceNative = balanceNative - amount;
                        }

                        let entityFeeChain = {
                            customer: convertObjectId(customer._id.toString()),
                            currency: currencyAttr.native_token,
                            chain: blockchain.code,
                            action: actionTransaction.FEE,
                            amount: currencyAttr.withdraw_fee_chain,
                            fee: 0,
                            balance: balanceNative - currencyAttr.withdraw_fee_chain,
                            balanceBefore: balanceNative,
                            payment_method: paymentMethod.CRYPTO,
                            txhash: code,
                            from: wallet.address,
                            to: entity.address,
                            order: transaction._id.toString(),
                            status: statusTransaction.COMPLETED
                        }
                        await ctx.call('v1.transaction.create', entityFeeChain);
                    }
                    await ctx.call('v1.TransactionCode.createCode', {
                        transaction_id: transaction._id.toString(),
                        email: customer.email,
                        fullname: customer.profile.fistname,
                        typeCode: actionTransaction.WITHDRAW,
                        subject: "Confirm Your Withdrawal",
                        currency: currency.code,
                        chain_title: blockchain.title,
                        amount: amount / 1e18,
                        to: entity.address,
                    });
                    return this.responseSuccess({ message: 'Create request withdrawal success', transaction: entityCreate, TransactionCode: transaction._id.toString() });
                } else {
                    return this.responseError('err_currency_not_support', 'Currency does not support withdrawal on chain');
                }

            } else {
                return this.responseError('err_balance_not_enough', 'The balance in the wallets is not enough');
            }
        } catch (error) {
            this.logger.error('transactionSerrvice - withdraw:', error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *  /v1/transaction/verify-withdraw:
     *    post:
     *      tags:
     *      - "Transaction"
     *      summary: verify Transaction withdraw
     *      description: verify Transaction withdraw
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      security:
     *        - Bearer: [] 
     *      parameters:
     *        - in: body
     *          name: params
     *          schema:
     *            type: object
     *            required:
     *              - TransactionCode
     *              - auth_code
     *              - email_code
     *            properties:
     *              TransactionCode:
     *                type: string
     *                default: 62439f6fe9bcb14dfee7ce7d
     *              auth_code:
     *                type: string
     *                default: 123456
     *              email_code:
     *                type: string
     *                default: 123456
     *      responses:
     *        200:
     *          description: verify Transaction withdraw
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/verify-withdraw', {
        name: 'verify-withdraw',
        middleware: ['auth', 'captcha', 'FORBIDDEN_WITHDRAW', 'FORBIDDEN_ALL'],
        cache: false,
    })
    async verifyWithdraw(ctx: Context<ParamVerifyTransactionWithdraw>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, ParamVerifyTransactionWithdrawValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }
            const transactionId = entity.TransactionCode
            const transaction: any = await this.adapter.findById(transactionId)
            if (transaction && customer._id.toString() == transaction.customer.toString() && transaction.status == statusTransaction.CREATED) {
                const currency: any = await ctx.call('v1.currency.findByCode', { code: transaction.currency });
                const blockchain: any = await ctx.call('v1.blockchain.findByCode', { code: transaction.chain });

                if (!currency) {
                    return this.responseError('err_not_found', 'Currency maintenance');
                }

                if (!blockchain) {
                    return this.responseError('err_not_found', 'Chain maintenance');
                }

                const currencyAttr: ICurrencyAttr = await ctx.call('v1.currencyAttr.find', { currency_id: currency._id, chain_id: blockchain._id })
                if (!currencyAttr) {
                    return this.responseError('err_not_found', 'Chain or Currency maintenance');
                }

                const otpLib = new Otplib();
                const verifyAuth = otpLib.verifyToken(customer.gg2fa, entity.auth_code);
                if (!verifyAuth) {
                    return this.responseError('err_code_expired', 'Verify code expire.');
                }

                const verifyEmail: any = await ctx.call('v1.TransactionCode.checkCode', {
                    transaction_id: transaction._id.toString(),
                    code: entity.email_code,
                    typeCode: transaction.action
                });
                if (verifyEmail.status == 'error') {
                    return verifyEmail;
                }
                let adminApprove: boolean = await this.checkTransactionAdminApprove(transaction.amount_usd, transaction.customer.toString(),
                    currencyAttr.max_times_withdraw, currencyAttr.value_need_approve, currencyAttr.value_need_approve_currency);
                if (adminApprove) {
                    await ctx.call('v1.transaction.updateStatus', { transactionId: transaction._id, status: statusTransaction.ACCEPTED })
                    BotTelegram.sendMessageWithdraw(`Withdraw waiting admin approve --transaction id:${transaction._id} --chain:${transaction.chain} --Amount: ${transaction.amount / 1e18} ${transaction.currency} --customer id: ${transaction.customer}`)
                    return this.responseSuccessMessage('Withdraw waiting admin approve.');
                } else {
                    await ctx.call('v1.transaction.accepted', { transactionId: transaction._id })
                    BotTelegram.sendMessageWithdraw(`Withdraw accepted --transaction id:${transaction._id} --chain:${transaction.chain} --Amount: ${transaction.amount / 1e18} ${transaction.currency} --customer id: ${transaction.customer}`)
                    return this.responseSuccessMessage('Verify withdraw transaction success');
                }

            } else {
                return this.responseError('err_not_found', "Transaction not found");
            }
        } catch (error) {
            this.logger.error('transactionSerrvice - verifyWithdraw:', error);
            return this.responseUnkownError();
        }
    }

    /**
    *  @swagger
    *  /v1/transaction/resend-verify-code:
    *    post:
    *      tags:
    *      - "Transaction"
    *      summary: resend verify code
    *      description: resend verify code
    *      produces:
    *        - application/json
    *      consumes:
    *        - application/json
    *      security:
    *        - Bearer: [] 
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
    *                default: 62439f6fe9bcb14dfee7ce7d
    *      responses:
    *        200:
    *          description: resend verify code success
    *        403:
    *          description: Server error
    */
    @Post<RestOptions>('/resend-verify-code', {
        name: 'resend-verify-code',
        middleware: ['auth', 'captcha', , 'FORBIDDEN_WITHDRAW', 'FORBIDDEN_ALL'],
        cache: false,
    })
    async resendVerifyCode(ctx: Context<ParamResendVerifyTransactionCode>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, ParamResendVerifyTransactionCodeValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }
            const transaction_id = Types.ObjectId(entity.transaction_id)
            const transaction: any = await this.adapter.findById(transaction_id)
            if (transaction && customer._id.toString() == transaction.customer.toString() && transaction.status == statusTransaction.CREATED) {
                const currency: any = await ctx.call('v1.currency.findByCode', { code: transaction.currency });
                const blockchain: any = await ctx.call('v1.blockchain.findByCode', { code: transaction.chain });
                if (!currency) {
                    return this.responseError('err_not_found', 'Currency not found');
                }
                if (!blockchain) {
                    return this.responseError('err_not_found', 'Chain not found');
                }

                const checkCreateCode: any = await ctx.call('v1.TransactionCode.createCode', {
                    transaction_id: transaction._id.toString(),
                    email: customer.email,
                    fullname: customer.profile.fistname,
                    typeCode: actionTransaction.WITHDRAW,
                    subject: "Confirm Your Withdrawal",
                    currency: currency.code,
                    chain_title: blockchain.title,
                    amount: +transaction.amount / 1e18,
                    to: transaction.to,
                });
                if (checkCreateCode.status == 'success') {
                    return this.responseSuccessMessage('Resend code success');
                } else {
                    return checkCreateCode;
                }
            } else {
                return this.responseError('err_not_found', "Transaction not found");
            }
        } catch (error) {
            this.logger.error('transactionSerrvice - resendVerifyCode:', error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/transaction/exchange:
     *    post:
     *      tags:
     *      - "Transaction"
     *      summary: Transaction exchange
     *      description: Transaction exchange
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      security:
     *        - Bearer: [] 
     *      parameters:
     *        - in: body
     *          name: params
     *          schema:
     *            type: object
     *            required:
     *              - currency_from_code
     *              - currency_to_code
     *              - amount
     *            properties:
     *              currency_from_code:
     *                type: string
     *                default: ZUKI
     *              currency_to_code:
     *                type: string
     *                default: USDT
     *              amount:
     *                type: number
     *                default: 1000000000000000000
     *      responses:
     *        200:
     *          description: Transaction exchange
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/exchange', {
        name: 'exchange',
        middleware: ['auth', 'captcha','FORBIDDEN_ALL'],
        cache: false,
    })
    async exchange(ctx: Context<ParamTransactionExchange>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, ParamTransactionExchangeValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const amount = +entity.amount;

            const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }

            const currencyFrom: ICurrency = await ctx.call('v1.currency.findByCode', { code: entity.currency_from_code });
            const currencyTo: ICurrency = await ctx.call('v1.currency.findByCode', { code: entity.currency_to_code });

            if (!currencyFrom) {
                return this.responseError('err_not_found', 'Currency maintenance');
            }
            if (!currencyTo) {
                return this.responseError('err_not_found', 'Currency maintenance');
            }
            const swap_enable = currencyFrom.swap_enable;

            if (!Array.isArray(swap_enable)) {
                return this.responseError('err_currency_not_support', 'Currency does not support exchange');
            }

            if (swap_enable.includes(currencyTo.code) === false) {
                return this.responseError('err_currency_not_support', 'Currency does not support exchange');
            }

            if (!amount) {
                return this.responseError('err_amount_illegal', 'Amount illegal');
            }

            if (+amount < 0) {
                return this.responseError('err_amount_illegal', 'Amount illegal');
            }

            const amount_usd = amount * currencyFrom.usd_rate;

            if (+amount_usd < 0) {
                return this.responseError('err_amount_illegal', 'Amount illegal');
            }
            const balanceFrom: number = await ctx.call('v1.transaction.getBalance', { currency_code: currencyFrom.code, customer_id: customer._id })

            if (balanceFrom > 0 && balanceFrom >= entity.amount) {

                const code = generateCode(30);
                let fee: number = 0;
                const percentFee = currencyFrom.swap_fee;
                if (percentFee > 0) {
                    const feeType = currencyFrom.swap_fee_type;
                    if (feeType === 0) {
                        fee = percentFee;
                    } else {
                        fee = amount * (percentFee / 100);
                    }
                }

                let entityCreate = {
                    customer: customer._id.toString(),
                    currency: currencyFrom.code,
                    chain: "",
                    action: actionTransaction.EXCHANGE_OUT,
                    amount: amount,
                    amount_usd: amount * currencyFrom.usd_rate,
                    fee,
                    balance: balanceFrom - amount,
                    balanceBefore: balanceFrom,
                    payment_method: paymentMethod.CRYPTO,
                    txhash: code,
                    from: "",
                    to: "",
                    order: null,
                    status: statusTransaction.COMPLETED
                }
                const transaction: any = await ctx.call('v1.transaction.create', entityCreate);
                const balanceTo: number = await ctx.call('v1.transaction.getBalance', { currency_code: currencyTo.code, customer_id: customer._id })
                const amountFee = amount - fee;
                const amountFeeUsd = amountFee * currencyFrom.usd_rate;
                const amountTo = amountFeeUsd / currencyTo.usd_rate;
                let entityTo = {
                    customer: customer._id.toString(),
                    currency: currencyTo.code,
                    chain: "",
                    action: actionTransaction.EXCHANGE_IN,
                    amount: amountTo,
                    amount_usd: amountFeeUsd,
                    fee: 0,
                    balance: balanceTo + amountTo,
                    balanceBefore: balanceTo,
                    payment_method: paymentMethod.CRYPTO,
                    txhash: transaction._id.toString(),
                    from: "",
                    to: "",
                    order: transaction._id.toString(),
                    status: statusTransaction.COMPLETED
                }
                await ctx.call('v1.transaction.create', entityTo)
                return this.responseSuccess({ message: 'Exchange transaction success' });

            } else {
                return this.responseError('err_balance_not_enough', 'The balance in the wallets is not enough');
            }
        } catch (error) {
            this.logger.error('transactionSerrvice - Exchange:', error);
            return this.responseUnkownError();
        }
    }

    @Action({
        name: 'getBalance',
        cache: false,
    })
    async getBalance(ctx: Context<ParamGetBalance>) {
        try {
            const params: any = ctx.params
            const customer_id = convertObjectId(params.customer_id.toString())
            const transaction: any = await this.adapter.find({ query: { currency: params.currency_code, customer: customer_id }, sort: { createdAt: -1 }, limit: 1 });
            if (transaction.length > 0) {
                let balance = transaction[0].balance;
                return +balance
            } else {
                return 0;
            }
        } catch (e) {
            this.logger.error('TransactionService - getBalance', e);
            return 0;
        }
    }

    @Action({
        name: 'deposit',
        cache: false,
    })
    async deposit(ctx: Context<ParamTransactionDeposit>) {
        try {
            const params = ctx.params;
            const currency: any = await ctx.call('v1.currency.find', { currency_id: params.currency_id });
            const blockchain: any = await ctx.call('v1.blockchain.id', { id: params.chain_id });
            if (currency && blockchain) {
                const wallet: any = await ctx.call('v1.wallet.findByAddress', { address: params.to, currency: currency.code });
                if (wallet) {
                    const checkExistTxHash = await ctx.call('v1.transaction.checkExistTxHash', { txhash: params.transactionHash, action: actionTransaction.DEPOSIT });
                    if (!checkExistTxHash) {
                        const balance: number = await ctx.call('v1.transaction.getBalance', { currency_code: currency.code, customer_id: wallet.customer_id });
                        let amount = +params.amount;
                        if (blockchain.code == 'BEP20' && currency.code == 'ZUKI') {
                            amount = amount / 0.99;
                        }

                        let entityCreate: any = {
                            customer: convertObjectId(wallet.customer_id.toString()),
                            currency: currency.code,
                            chain: blockchain.code,
                            action: actionTransaction.DEPOSIT,
                            amount: amount,
                            amount_usd: amount * currency.usd_rate,
                            fee: 0,
                            balance: balance + amount,
                            balanceBefore: balance,
                            payment_method: paymentMethod.CRYPTO,
                            txhash: params.transactionHash,
                            from: params.from,
                            to: params.to,
                            order: null,
                            status: statusTransaction.CREATED
                        }
                        await ctx.call('v1.TransactionTemp.create', entityCreate);
                    }
                } else {
                    BotTelegram.sendMessageDeposit(`Deposit fail To: ${params.to} -- Hash transaction: ${params.transactionHash} --reason: customer has not been created wallet.`)
                }
            }
            return true;
        } catch (error) {
            this.logger.error("transactionService - deposit")
            return false;
        }
    }

    @Action({
        name: "handleDeposit",
        cache: false,
    })
    async handleDeposit(ctx: Context) {
        try {
            const params: any = ctx.params;
            const temp: any = await ctx.call('v1.TransactionTemp.find', { id: params._id })
            if (temp != false) {
                const checkPending = await ctx.call('v1.transaction.findTransactionPending', {
                    currency_code: temp.currency,
                    customer_id: temp.customer
                })
                const checkExistTxHash = await ctx.call('v1.transaction.checkExistTxHash', { txhash: temp.txhash, action: actionTransaction.DEPOSIT });
                if (checkExistTxHash) {
                    return this.responseError('err_create', 'Transaction exsited');
                }

                if (checkPending == false) {
                    const balance: number = await ctx.call('v1.transaction.getBalance', { currency_code: temp.currency, customer_id: temp.customer });

                    let entityCreate: any = {
                        customer: convertObjectId(temp.customer.toString()),
                        currency: temp.currency,
                        chain: temp.chain,
                        action: temp.action,
                        amount: temp.amount,
                        amount_usd: temp.amount_usd,
                        fee: temp.fee,
                        balance: balance + (temp.amount - temp.fee),
                        balanceBefore: balance,
                        payment_method: temp.payment_method,
                        txhash: temp.txhash,
                        from: temp.from,
                        to: temp.to,
                        status: statusTransaction.COMPLETED,
                        order: null,
                    }
                    const parsedTransactionEntity = new JsonConvert().deserializeObject(entityCreate, TransactionEntity).getMongoEntity()
                    const transaction = await this._create(ctx, parsedTransactionEntity);
                    BotTelegram.sendMessageDeposit(`Deposit success --chain:${temp.chain}  --Amount: ${temp.amount / 1e18} ${temp.currency} --customer id: ${temp.customer}  From: ${temp.from} To: ${temp.to} -- Hash transaction: ${temp.txhash}`)
                    await ctx.call('v1.TransactionTemp.complete', { transactionId: temp._id })

                    const customer: any = await ctx.call('v1.customer.findById', { customer_id: transaction.customer });
                    const blockchain: any = await ctx.call('v1.blockchain.findByCode', { code: temp.chain });
                    const countDeposit: number = await this._count(ctx, { query: { customer: convertObjectId(customer._id.toString()), action: actionTransaction.DEPOSIT } });
                    if (countDeposit == 1) {
                        await ctx.call('v1.systemCommission.commission', { customer_id: customer._id.toString(), type: SystemCommissionType.BONUS_FIRST_DEPOSIT })
                    }

                    await ctx.call('v1.wallet.updateOnhold', {
                        customerId: transaction.customer,
                        currency_code: temp.currency,
                        chain_code: temp.chain,
                        amount: temp.amount
                    })
                    await ctx.call('v1.mail.depositComplete', {
                        fullname: customer.profile.fistname,
                        email: customer.email,
                        currency: temp.currency,
                        amount: temp.amount / 1e18,
                        subject: "Deposit completed",
                        link_scan: blockchain.scan + "/tx/" + temp.txhash.toString(),
                        txhash: temp.txhash
                    })
                    if (Config.NODE_ENV == 'production' && blockchain.native_token != temp.currency) {
                        await ctx.call('v1.claimDepositQueue.sendFeeDeposit', {
                            currency: temp.currency,
                            chain: temp.chain,
                            address: temp.to
                        });
                    }
                }
            }
            return true;
        } catch (error) {
            this.logger.error("handleDeposit:", error)
            return true;
        }
    }

    @Action({
        name: "forceDeposit",
        cache: false,
    })
    async forceDeposit(ctx: Context) {
        try {
            const params: any = ctx.params;
            const balance: number = await ctx.call('v1.transaction.getBalance', { currency_code: params.currency_code, customer_id: params.customer_id });

            let entityCreate: any = {
                customer: convertObjectId(params.customer_id.toString()),
                currency: params.currency_code,
                chain: params.chain_code,
                action: actionTransaction.DEPOSIT,
                amount: params.amount,
                fee: 0,
                balance: balance + +params.amount,
                balanceBefore: balance,
                payment_method: "",
                txhash: "FORCE_DEPOSIT_" + moment().unix().toString(),
                from: "ADMIN",
                to: params.to,
                status: statusTransaction.COMPLETED,
                order: null,
            }

            await ctx.call('v1.transaction.create', entityCreate)
            return true;
        } catch (error) {
            this.logger.error("forceDeposit:", error)
            return true;
        }
    }

    @Action({
        name: 'create',
        cache: false
    })
    async create(ctx: Context) {
        try {
            let entityCreate: any = ctx.params;
            entityCreate.customer = convertObjectId(entityCreate.customer.toString())
            const parsedTransactionEntity = new JsonConvert().deserializeObject(entityCreate, TransactionEntity).getMongoEntity()
            return await this._create(ctx, parsedTransactionEntity);
        } catch (error) {
            this.logger.error("transactionService - create", error)
            return false;
        }
    }

    @Action({
        name: 'findByQuery',
        cache: false
    })
    async findByQuery(ctx: Context) {
        try {
            const params: any = ctx.params;
            let query: any = {}

            if (params.currency != undefined && params.currency != null) {
                query.currency = params.currency
            }

            if (params.chain != undefined && params.chain != null) {
                query.chain = params.chain
            }

            if (params.action != undefined && params.action != null) {
                query.action = params.action
            }

            if (params.order != undefined && params.order != null) {
                query.order = params.order
            }

            if (params.customer_id != undefined && params.customer_id != null) {
                query.customer = convertObjectId(params.customer_id)
            }


            if (params.from_date != undefined && params.from_date != "" && params.to_date != undefined && params.to_date != "") {
                query.createdAt = {
                    $gte: +params.from_date,
                    $lt: +params.to_date
                };
            }
            return await this.adapter.findOne(query)
        } catch (error) {
            this.logger.error("transactionService - findByQuery:", error)
            return false;
        }
    }

    @Action({
        name: 'findById',
        cache: false
    })
    async findById(ctx: Context) {
        try {
            let params: any = ctx.params;
            return await this.adapter.findById(params._id)
        } catch (error) {
            this.logger.error("transactionService - findById:", error)
            return false;
        }
    }


    @Action({
        name: 'findTransactionPending',
        cache: false
    })
    async findTransactionPending(ctx: Context) {
        try {
            const params: any = ctx.params;
            const transaction = await this.adapter.findOne({
                status: { $nin: [statusTransaction.COMPLETED, statusTransaction.FAIL, statusTransaction.CANCELED] },
                currency: params.currency_code,
                customer: convertObjectId(params.customer_id.toString())
            });
            if (transaction) {
                return transaction;
            } else {
                return false;
            }
        } catch (error) {
            this.logger.error("transactionService - findTransactionPending:", error)
            return false;
        }
    }

    @Action({
        name: 'checkExistTxHash',
        cache: false
    })
    async checkExistTxHash(ctx: Context) {
        try {
            const params: any = ctx.params;
            let query: any = { txhash: params.txhash }
            if (params.action != null && params.action != undefined) {
                query.action = params.action;
            }
            const transaction = await this.adapter.findOne(query);
            if (transaction) {
                return transaction;
            } else {
                return false;
            }
        } catch (error) {
            this.logger.error("transactionService - checkExistTxHash", error)
            return false;
        }
    }

    @Action({
        name: 'complete',
        cache: false
    })
    async complete(ctx: Context) {
        try {
            const params: any = ctx.params;
            const transaction: any = await this._get(ctx, { id: params.transactionId });
            if (transaction) {
                return await this._update(ctx, { _id: transaction._id, status: statusTransaction.COMPLETED, updatedAt: moment().unix() });
            } else {
                this.logger.error("transactionService - complete - transaction not found", params)
                return false;
            }
        } catch (error) {
            this.logger.error("transactionService - complete", error)
            return false;
        }
    }


    @Action({
        name: 'accepted',
        cache: false
    })
    async accepted(ctx: Context) {
        try {
            const params: any = ctx.params;
            const transaction: any = await this.adapter.findById(params.transactionId);
            if (transaction) {
                await this.adapter.updateById(transaction._id, { $set: { status: statusTransaction.ACCEPTED, updatedAt: moment().unix() } });
                await ctx.call('v1.withdrawQueue.withdraw', { transactionId: transaction._id.toString() })
                return true;
            } else {
                this.logger.error("transactionService - complete - transaction not found", params)
                return false;
            }
        } catch (error) {
            this.logger.error("transactionService - complete", error)
            return false;
        }
    }

    @Action({
        name: 'update',
        cache: false
    })
    async update(ctx: Context) {
        try {
            const params: any = ctx.params;
            let entity = params.entity;
            entity.updatedAt = moment().unix()
            return await this.adapter.updateById(params.id, { $set: entity });
        } catch (error) {
            this.logger.error("transactionService - update", error)
            return false;
        }
    }

    @Action({
        name: 'updateStatus',
        cache: false
    })
    async updateStatus(ctx: Context) {
        try {
            const params: any = ctx.params;
            const transaction: any = await this._get(ctx, { id: params.transactionId });
            if (transaction) {
                return await this.adapter.updateById(transaction._id, { $set: { status: params.status, updatedAt: moment().unix() } });
            } else {
                this.logger.error("transactionService - updateStatus - transaction not found", params)
                return false;
            }
        } catch (error) {
            this.logger.error("transactionService - updateStatus", error)
            return false;
        }
    }

    @Action({
        name: 'getTransactionWithdrawToday',
        cache: false
    })
    async getTransactionWithdrawToday(ctx: Context) {
        try {
            const params: any = ctx.params;
            const startDay = moment().startOf('day').unix()
            const endDay = moment().endOf('day').unix()
            const transactions = await this.adapter.find({
                query: {
                    customer: convertObjectId(params.customerId.toString()),
                    action: actionTransaction.WITHDRAW,
                    createdAt: {
                        $gte: startDay,
                        $lt: endDay
                    }
                }
            })
            return transactions;
        } catch (error) {
            this.logger.error("transactionService - getTransactionWithdrawToday", error)
            return false;
        }
    }

    @Action({
        name: 'reportTotal',
        cache: false
    })
    async reportTotal(ctx: Context) {
        try {
            const params: any = ctx.params;
            let match: any = {}

            if (params.currency != undefined && params.currency != null) {
                match.currency = params.currency
            }

            if (params.chain != undefined && params.chain != null) {
                match.chain = params.chain
            }

            if (params.action != undefined && params.action != null) {
                match.action = params.action
            }

            if (params.order != undefined && params.order != null) {
                match.order = params.order
            }

            if (params.customer_id != undefined && params.customer_id != null) {
                match.customer = convertObjectId(params.customer_id)
            }

            if (params.from_date != undefined && params.from_date != "" && params.to_date != undefined && params.to_date != "") {
                match.createdAt = {
                    $gte: +params.from_date,
                    $lt: +params.to_date
                };
            }
            const transactions = await this.adapter.collection.aggregate([
                {
                    $match: match
                }, {
                    $group: {
                        _id: "$action",
                        sumAmount: {
                            $sum: "$amount",
                        },
                    },
                }
            ]);
            return await transactions.toArray();
        } catch (error) {
            this.logger.error("transactionService - reportTotal", error)
            return false;
        }
    }

    @Action({
        name: 'completeWithdraw',
        cache: false
    })
    async completeWithdraw(ctx: Context) {
        try {
            const params: any = ctx.params;
            const transaction: any = await this.adapter.findById(params.transactionId);
            if (transaction) {
                const customer: any = await ctx.call('v1.customer.findById', { customer_id: transaction.customer });
                const txhash = params.txhash
                await ctx.call('v1.mail.sendWithdrawComplete', {
                    fullname: customer.profile.fistname,
                    email: customer.email,
                    subject: "Withdrawal order completed",
                    link_scan: params.link_scan + "/tx/" + txhash.toString(),
                    txhash: txhash.toString()
                })
                BotTelegram.sendMessageWithdraw(`Withdraw success --chain:${transaction.chain} --Amount: ${transaction.amount / 1e18} ${transaction.currency} --customer id: ${transaction.customer} -- Hash transaction: ${params.txhash}`)
                return await this.adapter.updateById(transaction._id, { $set: { status: statusTransaction.COMPLETED, txhash: params.txhash, updatedAt: moment().unix() } });
            } else {
                this.logger.error("transactionService - completeWithdraw - transaction not found", params)
                return false;
            }
        } catch (error) {
            this.logger.error("transactionService - completeWithdraw", error)
            return false;
        }
    }

    @Action({
        name: 'checkTransactionInDay',
        cache: false
    })
    async checkTransactionInDay(ctx: Context) {
        try {
            const params: any = ctx.params;
            const startTime = moment().startOf('day').unix()
            const endTime = moment().endOf('day').unix()
            return await this.adapter.findOne({ customer: convertObjectId(params.customer_id), action: params.action, createdAt: { $gte: startTime, $lt: endTime } })
        } catch (error) {
            this.logger.error("transactionService - checkTransactionInDay", error)
            return false;
        }
    }

    @Action({
        name: 'totalEarnedHarvestCustomer',
        cache: {
            keys: ['customer_id'],
            ttl: 300 * 60
        }
    })
    async totalEarnedHarvestCustomer(ctx: Context<TotalEarnedHarvestCustomerParams>): Promise<Number | Boolean> {
        try {
            const params = ctx.params;
            let match: any = { customer: params.customer_id, action: actionTransaction.INTEREST }
            const transactions = await this.adapter.collection.aggregate([
                {
                    $match: match
                }, {
                    $group: {
                        _id: "$customer_id",
                        sumAmount: {
                            $sum: "$amount_usd",
                        },
                    },
                }
            ]);
            let sumAmount = 0;
            const dataTransaction = await transactions.toArray();
            if (dataTransaction.length > 0) {
                sumAmount = dataTransaction[0].sumAmount
            }
            return sumAmount;
        } catch (error) {
            this.logger.error('TransactionService - totalEarnedHarvestCustomer:', error)
            return false
        }
    }

    @Action({
        name: 'updateCreateAt',
        cache: false
    })
    async updateCreateAt(ctx: Context) {
        try {
            const transactions: any = await this.adapter.find({ query: { customer: { $ne: null } } });
            for (let i = 0; i < transactions.length; i++) {
                const transaction = transactions[i];
                await this.adapter.updateById(transaction._id, { $set: { createdAt: +transaction.createdAt, updatedAt: +transaction.updatedAt } })
            }
            return true;
        } catch (error) {
            this.logger.error("transactionService - completeWithdraw", error)
            return false;
        }
    }

    @Action({
        name: 'findTransactionLastest',
        cache: false,
    })
    async findTransactionLastest(ctx: Context) {
        try {
            const params: any = ctx.params
            const customer_id = convertObjectId(params.customer_id.toString())
            let query: any = {
                customer: customer_id
            }

            if (params.action != "" && params.action != null && params.action != undefined) {
                query.action = params.action;
            }

            if (params.order != "" && params.order != null && params.order != undefined) {
                query.order = params.order;
            }

            const transaction: any = await this.adapter.find({ query, sort: { createdAt: -1 }, limit: 1 });
            if (transaction.length > 0) {
                return transaction[0];
            } else {
                return null;
            }
        } catch (e) {
            this.logger.error('TransactionService - findTransactionLastest', e);
            return false;
        }
    }

    @Action({
        name: 'countTransaction',
        cache: false
    })
    async countTransaction(ctx: Context) {
        try {
            const params: any = ctx.params;
            let query: any = {}

            if (params.currency != undefined && params.currency != null) {
                query.currency = params.currency
            }

            if (params.chain != undefined && params.chain != null) {
                query.chain = params.chain
            }

            if (params.action != undefined && params.action != null) {
                query.action = { $in: params.action }
            }

            if (params.order != undefined && params.order != null) {
                query.order = params.order
            }

            if (params.customer_id != undefined && params.customer_id != null) {
                query.customer = convertObjectId(params.customer_id)
            }

            if (params.from_date != undefined && params.from_date != "" && params.to_date != undefined && params.to_date != "") {
                query.createdAt = {
                    $gte: +params.from_date,
                    $lt: +params.to_date
                };
            }
            return await this._count(ctx, { query });
        } catch (error) {
            this.logger.error("transactionService - countTransaction", error)
            return false;
        }
    }

    @Method
    async checkTransactionAdminApprove(amount_usd: number, customer_id: string,
        max_times_withdraw: number,
        value_need_approve: number, value_need_approve_currency: string) {
        if (value_need_approve != null && value_need_approve_currency != null && max_times_withdraw != null) {
            const currency: any = await this.broker.call('v1.currency.find', { currency_id: value_need_approve_currency })
            const amountUsd = +value_need_approve * currency.usd_rate;
            if (amount_usd > amountUsd) {
                return true;
            }
            const startTime = moment().startOf('days').unix()
            const endTime = moment().endOf('days').unix()
            const countTransaction: number = await this.broker.call('v1.transaction.countTransaction', { customer_id, action: [actionTransaction.WITHDRAW], from_date: startTime, end_date: endTime })
            if (countTransaction >= +max_times_withdraw) {
                return true;
            }
        }
        return false
    }

    @Action({
        name: 'countAddressDeposit',
        cache: false
    })
    async countAddressDeposit(ctx: Context) {
        try {
            let match: any = { action: actionTransaction.DEPOSIT }
            const transactions = await this.adapter.collection.aggregate([
                {
                    $match: match
                }, {
                    $group: {
                        _id: "$to"
                    },
                }
            ]);
            const dataTransaction = await transactions.toArray();
            return true
        } catch (error) {
            this.logger.error('TransactionService - totalEarnedHarvestCustomer:', error)
            return false
        }
    }

    @Method
    getMaxAmountWithdraw(customer: any) {
        try {
            let amountInTransaction = 0;
            if (customer.status_2fa == 1) {
                amountInTransaction = 10000 * 10 ** 18;
            }

            if (customer.status_kyc == 2) {
                amountInTransaction = 100000 * 10 ** 18;
            }
            return { amountInTransaction }
        } catch (error) {
            this.logger.error("transactionService - getMaxAmountWithdraw", error)
            return 0;
        }

    }
}
