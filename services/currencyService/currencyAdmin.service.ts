'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { JsonConvert } from 'json2typescript';
import { DbContextParameters } from 'moleculer-db';
import { dbCurrencyMixin, eventsCurrencyMixin } from '../../mixins/dbMixins';
import {
    MoleculerDBService,
    RestOptions,
    CurrenciesAdminServiceOptions,
    CurrenciesAdminServiceSettingsOptions,
    CurrencyCreateParams,
    ParamsCurrencyCreateValidator,
    CurrencyUpdateParams,
    ParamsCurrencyUpdateValidator,
    TypeCheckRate,
    TypeDeposit,
    TypeWithdraw,
    ParamsCurrencyAttrCreateValidator,
    CurrencyAttrCreateParams,
    CurrencyAttrUpdateParams,
    ParamsCurrencyAttrUpdateValidator,
    TypeTransfer
} from '../../types';
import { CurrencyEntity, ICurrency } from '../../entities';
import { CustomValidator } from '../../validators';
import _ from 'lodash';
import moment from 'moment';
import { checkFieldExist } from '../../mixins/dbMixins/helpers.mixin';
@Service<CurrenciesAdminServiceOptions>({
    name: 'admin.currency',
    version: 1,
    mixins: [dbCurrencyMixin, eventsCurrencyMixin],
    settings: {
        idField: '_id',
        pageSize: 10,
        rest: '/v1/admin/currency',
        fields: [
            '_id',
            'code',
            'title',
            'type',
            'usd_rate',
            'icon',
            'swap_enable',
            'swap_fee',
            'swap_fee_type',
            'transfer_fee',
            'factor_rate',
            'min_swap',
            'max_swap',
        ]
    },
})
export default class CurrencyAdminService extends MoleculerDBService<CurrenciesAdminServiceSettingsOptions, ICurrency> {
    /**
     *  @swagger
     *
     *  /v1/admin/currency/list:
     *    get:
     *      tags:
     *      - "Admin Currency"
     *      summary: get list currency
     *      description: get list currency
     *      security:
     *        - Bearer: []
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - name: code
     *          description: code currency
     *          in: query
     *          required: false
     *          type: string
     *          example : ZUKI
     *      responses:
     *        200:
     *          description: get list currency
     *        403:
     *          description: Server error
     */
    @Get<RestOptions>('/list', {
        name: 'list',
        middleware: ['authAdmin'],
        cache: false
    })
    async list(ctx: Context<DbContextParameters>) {
        try {
            let params: any = this.sanitizeParams(ctx, ctx.params);
            let query: any = {
                active: true,
                deletedAt: null,
            }
            if (params.code != undefined) {
                query.code = params.code
            }
            params.query = query
            const data = await this._list(ctx, params);
            return this.responseSuccess(data);
        } catch (error) {
            this.logger.error("CurrencyAdminService --list ", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/currency/create:
     *    post:
     *      tags:
     *      - "Admin Currency"
     *      summary: create
     *      description: create
     *      security:
     *        - Bearer: []
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
     *              - title
     *              - code
     *              - min_crawl
     *              - icon
     *            properties:
     *              title:
     *                type: string
     *                default: zuki
     *              code:
     *                type: string
     *                default: zuki
     *              min_crawl:
     *                type: integer
     *                default: 1
     *              icon:
     *                type: string
     *                default: 62a641cf936a6b7c6ccee1db
     *              usd_rate:
     *                type: integer
     *                default: 1
     *              factor_rate:
     *                type: integer
     *                default: 1
     *              check_rates:
     *                type: array
     *                items:
     *                  type: object
     *                  properties:
     *                    type:
     *                      type: string
     *                      default: "PANCAKE"
     *                    link:
     *                      type: string
     *                      default: "https://api.pancakeswap.info/api/v2/tokens/0xe81257d932280ae440b17afc5f07c8a110d21432"
     *              swap_enable:
     *                type: array
     *                default: ["OPV","USDT"]
     *              swap_fee:
     *                type: integer
     *                default: 1
     *              swap_fee_type:
     *                type: integer
     *                default: 1
     *                summary: "select: 0: percent,1:token amount"
     *              transfer_fee:
     *                type: integer
     *                default: 1
     *              transfer_fee_type:
     *                type: integer
     *                default: 1
     *                summary: "select: 0: percent,1:token amount"
     *              min_swap:
     *                type: integer
     *                default: 1
     *              max_swap:
     *                type: integer
     *                default: 1
     *              currency_attrs:
     *                type: array
     *                items:
     *                  type: object
     *                  properties:
     *                    blockchain_id:
     *                      type: string
     *                      default: 62a641cf936a6b7c6ccee1db
     *                      summary: select blockchain id
     *                    contract:
     *                      type: string
     *                      default: 62a641cf936a6b7c6ccee1db
     *                    abi:
     *                      type: string
     *                      default: 62a641cf936a6b7c6ccee1db
     *                    native_token:
     *                      type: string
     *                      default: BNB
     *                      summary: select currency CODE
     *                    withdraw_fee_token:
     *                      type: integer
     *                      default: 1
     *                    withdraw_fee_token_type:
     *                      type: integer
     *                      default: 1
     *                      summary: "select: 0: percent,1:token amount"
     *                    withdraw_fee_chain:
     *                      type: integer
     *                      default: 1
     *                    decimal:
     *                      type: integer
     *                      default: 18
     *                    min_withdraw:
     *                      type: integer
     *                      default: 1
     *                    max_withdraw:
     *                      type: integer
     *                      default: 1
     *                    value_need_approve:
     *                      type: integer
     *                      default: 1
     *                    value_need_approve_currency:
     *                      type: string
     *                      default: 62a641cf936a6b7c6ccee1db
     *                      summary: select currency id
     *                    max_amount_withdraw_daily:
     *                      type: integer
     *                      default: 1
     *                    max_amount_withdraw_daily_currency:
     *                      type: string
     *                      default: 62a641cf936a6b7c6ccee1db
     *                      summary: select currency id
     *                    max_times_withdraw:
     *                      type: integer
     *                      default: 1
     *                    type_withdraw:
     *                      type: string
     *                      default: ONCHAIN
     *                      summary: select type withdraw
     *                    type_deposit:
     *                      type: string
     *                      default: ONCHAIN
     *                      summary: select type deposit
     *                    type_transfer:
     *                      type: string
     *                      default: ALL
     *                      summary: select type transfer
     *              active:
     *                type: boolean
     *                default: true
     *      responses:
     *        200:
     *          description: stake Package
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/create', {
        name: 'create',
        middleware: ['authAdmin'],
        cache: false
    })
    async create(ctx: Context<CurrencyCreateParams>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, ParamsCurrencyCreateValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const checkCurrencyCode = await this.adapter.findOne({ code: entity.code });
            if (checkCurrencyCode) {
                return this.responseError('err_not_found', "Currency Code exists in system");
            }

            let entityAttrCurrency: any = [];

            let entityCurrency: any = {
                code: entity.code,
                title: entity.title,
                min_crawl: entity.min_crawl,
                swap_fee: entity.swap_fee,
                transfer_fee: entity.transfer_fee,
                transfer_fee_type: entity.transfer_fee_type,
                swap_fee_type: entity.swap_fee_type,
                min_swap: entity.min_swap,
                max_swap: entity.max_swap,
                active: entity.active,
                usd_rate: entity.usd_rate,
                factor_rate: entity.factor_rate,
            }

            if (checkFieldExist(entity.swap_enable) && Array.isArray(entity.swap_enable)) {
                const swap_enables = entity.swap_enable
                for (let i = 0; i < swap_enables.length; i++) {
                    const swap_enable = swap_enables[i];
                    const checkCode = await this.adapter.findOne({ code: swap_enable });
                    if (!checkCode) {
                        return this.responseError('err_not_found', 'Currency not found');
                    }
                }
                entityCurrency.swap_enable = swap_enables
            }

            const icon: any = await ctx.call('v1.files.find', { id: entity.icon });
            if (icon.status == "error") {
                return icon;
            } else {
                entityCurrency.icon = icon.data.full_link;
            }

            const typeWithdraw: any = TypeWithdraw;
            const typeDeposit: any = TypeDeposit;
            const typeTransfer: any = TypeTransfer;
            if (entity.check_rates != null && entity.check_rates != null && Array.isArray(entity.check_rates)) {
                const check_rates = entity.check_rates
                const typeCheckRate: any = TypeCheckRate
                for (let i = 0; i < check_rates.length; i++) {
                    const check_rate = check_rates[i];
                    if (typeCheckRate[check_rate.type] == undefined) {
                        return this.responseError('err_not_found', 'Type check rate not exist');
                    }
                }
                entityCurrency.link_rate = check_rates
            } else {
                entityCurrency.link_rate = []
            }

            if (checkFieldExist(entity.currency_attrs) && Array.isArray(entity.currency_attrs)) {
                const currency_attrs = entity.currency_attrs
                for (let i = 0; i < currency_attrs.length; i++) {
                    const currency_attr: CurrencyAttrCreateParams = currency_attrs[i];
                    const validate = customValidator.validate(currency_attr, ParamsCurrencyAttrCreateValidator)
                    if (validate !== true) {
                        return this.responseErrorData('err_validate', validate.message, validate.data);
                    }
                    if (typeWithdraw[currency_attr.type_withdraw] == undefined) {
                        return this.responseError('err_not_found', 'Type withdraw not exist');
                    }

                    if (typeDeposit[currency_attr.type_deposit] == undefined) {
                        return this.responseError('err_not_found', 'Type deposit not exist');
                    }

                    if (typeTransfer[currency_attr.type_transfer] == undefined) {
                        return this.responseError('err_not_found', 'Type transfer not exist');
                    }

                    const blockchain = await ctx.call('v1.blockchain.id', { id: currency_attr.blockchain_id })
                    if (!blockchain) {
                        return this.responseError('err_not_found', "Blockchain not found");
                    }

                    const checkBlockchain = _.findIndex(entityAttrCurrency, { blockchain: currency_attr.blockchain_id });
                    if (checkBlockchain != -1) {
                        return this.responseError('err_exists', "Blockchain already exists.");
                    }

                    const max_amount_withdraw_daily_currency = await ctx.call('v1.currency.find', { currency_id: currency_attr.max_amount_withdraw_daily_currency });
                    if (max_amount_withdraw_daily_currency == false) {
                        return this.responseError('err_not_found', 'Currency not found');
                    }

                    const value_need_approve_currency = await ctx.call('v1.currency.find', { currency_id: currency_attr.value_need_approve_currency });
                    if (value_need_approve_currency == false) {
                        return this.responseError('err_not_found', 'Currency not found');
                    }

                    if (checkFieldExist(currency_attr.native_token)) {
                        const native_token = await ctx.call('v1.currency.findByCode', { code: currency_attr.native_token });
                        if (native_token == false) {
                            return this.responseError('err_not_found', 'Currency not found');
                        }
                    }

                    let entityAttr: any = {
                        blockchain: currency_attr.blockchain_id,
                        contract: currency_attr.contract,
                        abi: currency_attr.abi,
                        native_token: currency_attr.native_token,
                        withdraw_fee_token: currency_attr.withdraw_fee_token,
                        withdraw_fee_token_type: currency_attr.withdraw_fee_token_type,
                        withdraw_fee_chain: currency_attr.withdraw_fee_chain,
                        min_withdraw: currency_attr.min_withdraw,
                        decimal: currency_attr.decimal,
                        max_withdraw: currency_attr.max_withdraw,
                        type_withdraw: currency_attr.type_withdraw,
                        type_deposit: currency_attr.type_deposit,
                        type_transfer: currency_attr.type_transfer,
                        max_amount_withdraw_daily: currency_attr.max_amount_withdraw_daily,
                        max_amount_withdraw_daily_currency: currency_attr.max_amount_withdraw_daily_currency,
                        max_times_withdraw: currency_attr.max_times_withdraw,
                        value_need_approve: currency_attr.value_need_approve,
                        value_need_approve_currency: currency_attr.value_need_approve_currency
                    }
                    entityAttrCurrency.push(entityAttr)
                }
            }

            const parsedCurrencyEntity = new JsonConvert().deserializeObject(entityCurrency, CurrencyEntity).getMongoEntity()
            const currency: any = await this._create(ctx, parsedCurrencyEntity);
            if (currency) {
                if (entityAttrCurrency.length > 0) {
                    for (let i = 0; i > entityAttrCurrency.length; i++) {
                        let entityAttr: any = entityAttrCurrency[i];
                        entityAttr.currency_id = currency._id.toString();
                        await ctx.call('v1.currencyAttr.create', entityAttr)
                    }
                }
                return this.responseSuccessDataMessage("Create currency success", currency);
            } else {

            }
        } catch (error) {
            this.logger.error('CurrencyAdminService - create:' + error)
            return this.responseUnkownError();
        }
    }
    /**
     *  @swagger
     *
     *  /v1/admin/currency/update:
     *    put:
     *      tags:
     *      - "Admin Currency"
     *      summary: update
     *      description: update
     *      security:
     *        - Bearer: []
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
     *              - currency_id
     *              - title
     *              - min_crawl
     *              - icon
     *            properties:
     *              title:
     *                type: string
     *                default: zuki
     *              min_crawl:
     *                type: integer
     *                default: 1
     *              currency_id:
     *                type: string
     *                default: 62a641cf936a6b7c6ccee1db
     *              icon:
     *                type: string
     *                default: 62a641cf936a6b7c6ccee1db
     *              usd_rate:
     *                type: integer
     *                default: 1
     *              factor_rate:
     *                type: integer
     *                default: 1
     *              check_rates:
     *                type: array
     *                items:
     *                  type: object
     *                  properties:
     *                    type:
     *                      type: string
     *                      default: "PANCAKE"
     *                    link:
     *                      type: string
     *                      default: "https://api.pancakeswap.info/api/v2/tokens/0xe81257d932280ae440b17afc5f07c8a110d21432"
     *              swap_enable:
     *                type: array
     *                default: ["OPV","USDT"]
     *              swap_fee:
     *                type: integer
     *                default: 1
     *              min_swap:
     *                type: integer
     *                default: 1
     *              max_swap:
     *                type: integer
     *                default: 1
     *              swap_fee_type:
     *                type: integer
     *                default: 1
     *                summary: "select: 0: percent,1:token amount"
     *              transfer_fee:
     *                type: integer
     *                default: 1
     *              transfer_fee_type:
     *                type: integer
     *                default: 1
     *                summary: "select: 0: percent,1:token amount"
     *              currency_attrs:
     *                type: array
     *                items:
     *                  type: object
     *                  properties:
     *                    currency_attr_id:
     *                      type: string
     *                      default: 62a641cf936a6b7c6ccee1db
     *                    contract:
     *                      type: string
     *                      default: 62a641cf936a6b7c6ccee1db
     *                    abi:
     *                      type: string
     *                      default: 62a641cf936a6b7c6ccee1db
     *                    native_token:
     *                      type: string
     *                      default: BNB
     *                    withdraw_fee_token:
     *                      type: integer
     *                      default: 1
     *                    withdraw_fee_token_type:
     *                      type: integer
     *                      default: 1
     *                      summary: "0: percent,1:token amount"
     *                    withdraw_fee_chain:
     *                      type: integer
     *                      default: 1
     *                    decimal:
     *                      type: integer
     *                      default: 18
     *                    min_withdraw:
     *                      type: integer
     *                      default: 1
     *                    max_withdraw:
     *                      type: integer
     *                      default: 1
     *                    value_need_approve:
     *                      type: integer
     *                      default: 1
     *                    value_need_approve_currency:
     *                      type: string
     *                      default: 62a641cf936a6b7c6ccee1db
     *                    max_amount_withdraw_daily:
     *                      type: integer
     *                      default: 1
     *                    max_amount_withdraw_daily_currency:
     *                      type: string
     *                      default: 62a641cf936a6b7c6ccee1db
     *                    max_times_withdraw:
     *                      type: integer
     *                      default: 1
     *                    type_withdraw:
     *                      type: string
     *                      default: ONCHAIN
     *                    type_deposit:
     *                      type: string
     *                      default: ONCHAIN
     *                    type_transfer:
     *                      type: string
     *                      default: ALL
     *              active:
     *                type: boolean
     *                default: true
     *      responses:
     *        200:
     *          description: stake Package
     *        403:
     *          description: Server error
     */
    @Put<RestOptions>('/update', {
        name: 'update',
        middleware: ['authAdmin'],
        cache: false
    })
    async update(ctx: Context<CurrencyUpdateParams>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, ParamsCurrencyUpdateValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const currency = await this.adapter.findById(entity.currency_id);
            if (!currency) {
                return this.responseError('err_not_found', "Currency not found");
            }

            let entityCurrency: any = {}

            if (entity.title != null) {
                entityCurrency.title = entity.title
            }
            if (entity.min_crawl != null) {
                entityCurrency.min_crawl = entity.min_crawl
            }
            if (entity.active != null) {
                entityCurrency.active = entity.active
            }
            if (checkFieldExist(entity.min_swap)) {
                entityCurrency.min_swap = entity.min_swap
            }

            if (checkFieldExist(entity.max_swap)) {
                entityCurrency.max_swap = entity.max_swap
            }

            if (checkFieldExist(entity.transfer_fee)) {
                entityCurrency.transfer_fee = entity.transfer_fee
            }

            if (checkFieldExist(entity.transfer_fee_type)) {
                entityCurrency.transfer_fee_type = entity.transfer_fee_type
            }
            if (checkFieldExist(entity.factor_rate)) {
                entityCurrency.factor_rate = entity.factor_rate
            }

            if (checkFieldExist(entity.max_swap)) {
                entityCurrency.max_swap = entity.max_swap
            }

            if (entity.usd_rate != null) {
                entityCurrency.usd_rate = entity.usd_rate
            }

            if (entity.swap_fee != null) {
                entityCurrency.swap_fee = entity.swap_fee
            }

            if (entity.swap_fee_type != null) {
                entityCurrency.swap_fee_type = entity.swap_fee_type
            }

            if (entity.swap_enable != null && entity.swap_enable != null && Array.isArray(entity.swap_enable)) {
                const swap_enables = entity.swap_enable
                for (let i = 0; i < swap_enables.length; i++) {
                    const swap_enable = swap_enables[i];
                    const checkCode = await this.adapter.findOne({ code: swap_enable });
                    if (swap_enable == currency.code) {
                        return this.responseError('err_not_found', `Can't swap for ${swap_enable}`);
                    }

                    if (!checkCode) {
                        return this.responseError('err_not_found', 'Currency not found');
                    }
                }
                entityCurrency.swap_enable = swap_enables
            }

            if (entity.icon != null) {
                const icon: any = await ctx.call('v1.files.find', { id: entity.icon });
                if (icon.status == "success") {
                    entityCurrency.icon = icon.data.full_link;
                }
            }

            if (entity.check_rates != null && entity.check_rates != null && Array.isArray(entity.check_rates)) {
                const check_rates = entity.check_rates
                const typeCheckRate: any = TypeCheckRate
                for (let i = 0; i < check_rates.length; i++) {
                    const check_rate = check_rates[i];
                    if (typeCheckRate[check_rate.type] == undefined) {
                        return this.responseError('err_not_found', 'Type check rate not exist');
                    }
                }
                entityCurrency.link_rate = check_rates
            }

            if (entity.currency_attrs != null && entity.currency_attrs != null && Array.isArray(entity.currency_attrs)) {
                const typeWithdraw: any = TypeWithdraw;
                const typeDeposit: any = TypeDeposit;
                const typeTransfer: any = TypeTransfer;
                const currency_attrs = entity.currency_attrs
                for (let i = 0; i < currency_attrs.length; i++) {
                    const currency_attr: CurrencyAttrUpdateParams = currency_attrs[i];
                    if (checkFieldExist(currency_attr.currency_attr_id)) {
                        const findCurrencyAttr = await ctx.call('v1.currencyAttr.findById', { id: currency_attr.currency_attr_id })
                        if (!findCurrencyAttr || findCurrencyAttr == null) {
                            return this.responseError('err_not_found', 'Currency Attr not exist');
                        }

                        const validate = customValidator.validate(currency_attr, ParamsCurrencyAttrUpdateValidator)
                        if (validate !== true) {
                            return this.responseErrorData('err_validate', validate.message, validate.data);
                        }
                        let entityAttrUpdate: any = {
                            updatedAt: moment().unix()
                        }

                        if (currency_attr.contract != null && currency_attr.contract != undefined) {
                            entityAttrUpdate.contract = currency_attr.contract
                        }
                        if (currency_attr.abi != null && currency_attr.abi != undefined) {
                            entityAttrUpdate.abi = currency_attr.abi
                        }

                        if (currency_attr.withdraw_fee_token != null && currency_attr.withdraw_fee_token != undefined) {
                            entityAttrUpdate.withdraw_fee_token = currency_attr.withdraw_fee_token
                        }

                        if (currency_attr.withdraw_fee_token_type != null && currency_attr.withdraw_fee_token_type != undefined) {
                            entityAttrUpdate.withdraw_fee_token_type = currency_attr.withdraw_fee_token_type
                        }

                        if (currency_attr.withdraw_fee_chain != null && currency_attr.withdraw_fee_chain != undefined) {
                            entityAttrUpdate.withdraw_fee_chain = currency_attr.withdraw_fee_chain
                        }
                        if (currency_attr.min_withdraw != null && currency_attr.min_withdraw != undefined) {
                            entityAttrUpdate.min_withdraw = currency_attr.min_withdraw
                        }
                        if (currency_attr.max_withdraw != null && currency_attr.max_withdraw != undefined) {
                            entityAttrUpdate.max_withdraw = currency_attr.max_withdraw
                        }
                        if (currency_attr.max_amount_withdraw_daily != null && currency_attr.max_amount_withdraw_daily != undefined) {
                            entityAttrUpdate.max_amount_withdraw_daily = currency_attr.max_amount_withdraw_daily
                        }
                        if (currency_attr.value_need_approve != null && currency_attr.value_need_approve != undefined) {
                            entityAttrUpdate.value_need_approve = currency_attr.value_need_approve
                        }
                        if (currency_attr.max_times_withdraw != null && currency_attr.max_times_withdraw != undefined) {
                            entityAttrUpdate.max_times_withdraw = currency_attr.max_times_withdraw
                        }
                        if (currency_attr.decimal != null && currency_attr.decimal != undefined) {
                            entityAttrUpdate.decimal = currency_attr.decimal
                        }

                        if (currency_attr.type_withdraw != null && currency_attr.type_withdraw != undefined) {
                            if (typeWithdraw[currency_attr.type_withdraw] == undefined) {
                                return this.responseError('err_not_found', 'Type withdraw not exist');
                            } else {
                                entityAttrUpdate.type_withdraw = currency_attr.type_withdraw
                            }
                        }
                        if (currency_attr.type_transfer != null && currency_attr.type_transfer != undefined) {
                            if (typeTransfer[currency_attr.type_transfer] == undefined) {
                                return this.responseError('err_not_found', 'Type transfer not exist');
                            } else {
                                entityAttrUpdate.type_transfer = currency_attr.type_transfer
                            }
                        }

                        if (currency_attr.native_token != null && currency_attr.native_token != undefined) {
                            const native_token = await ctx.call('v1.currency.findByCode', { code: currency_attr.native_token });
                            if (native_token == false) {
                                return this.responseError('err_not_found', 'Currency not found');
                            } else {
                                entityAttrUpdate.native_token = currency_attr.native_token
                            }

                        }

                        if (currency_attr.type_deposit != null && currency_attr.type_deposit != undefined) {
                            if (typeDeposit[currency_attr.type_deposit] == undefined) {
                                return this.responseError('err_not_found', 'Type deposit not exist');
                            } else {
                                entityAttrUpdate.type_deposit = currency_attr.type_deposit
                            }
                        }

                        if (currency_attr.max_amount_withdraw_daily_currency != null && currency_attr.max_amount_withdraw_daily_currency != undefined) {
                            const max_amount_withdraw_daily_currency = await ctx.call('v1.currency.find', { currency_id: currency_attr.max_amount_withdraw_daily_currency });
                            if (max_amount_withdraw_daily_currency == false) {
                                return this.responseError('err_not_found', 'Currency not found');
                            } else {
                                entityAttrUpdate.max_amount_withdraw_daily_currency = currency_attr.max_amount_withdraw_daily_currency
                            }
                        }

                        if (currency_attr.value_need_approve_currency != null && currency_attr.value_need_approve_currency != undefined) {
                            const value_need_approve_currency = await ctx.call('v1.currency.find', { currency_id: currency_attr.value_need_approve_currency });
                            if (value_need_approve_currency == false) {
                                return this.responseError('err_not_found', 'Currency not found');
                            } else {
                                entityAttrUpdate.value_need_approve_currency = currency_attr.value_need_approve_currency
                            }
                        }
                        await ctx.call('v1.currencyAttr.update', { id: currency_attr.currency_attr_id, entity: entityAttrUpdate })
                    } else {
                        const validate = customValidator.validate(currency_attr, ParamsCurrencyAttrCreateValidator)
                        if (validate !== true) {
                            return this.responseErrorData('err_validate', validate.message, validate.data);
                        }

                        let entityAttr: any = {
                            blockchain: currency_attr.blockchain_id,
                            contract: currency_attr.contract,
                            abi: currency_attr.abi,
                            native_token: currency_attr.native_token,
                            withdraw_fee_token: currency_attr.withdraw_fee_token,
                            withdraw_fee_token_type: currency_attr.withdraw_fee_token_type,
                            withdraw_fee_chain: currency_attr.withdraw_fee_chain,
                            min_withdraw: currency_attr.min_withdraw,
                            decimal: currency_attr.decimal,
                            max_withdraw: currency_attr.max_withdraw,
                            type_withdraw: currency_attr.type_withdraw,
                            type_deposit: currency_attr.type_deposit,
                            type_transfer: currency_attr.type_transfer,
                            max_amount_withdraw_daily: currency_attr.max_amount_withdraw_daily,
                            max_amount_withdraw_daily_currency: currency_attr.max_amount_withdraw_daily_currency,
                            max_times_withdraw: currency_attr.max_times_withdraw,
                            value_need_approve: currency_attr.value_need_approve,
                            value_need_approve_currency: currency_attr.value_need_approve_currency,
                            currency_id: currency._id.toString()
                        }
                        await ctx.call('v1.currencyAttr.create', entityAttr)
                    }
                }
            }

            await this.adapter.updateById(entity.currency_id, { $set: entityCurrency })
            this.broker.cacher?.clean('*.currency.**');
            this.broker.cacher?.clean('*.currencyAttr.**');
            return this.responseSuccessMessage("Update currency success");
        } catch (error) {
            this.logger.error('CurrencyAdminService - update:' + error)
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *  /v1/admin/currency/detail:
     *    get:
     *      tags:
     *      - "Admin Currency"
     *      summary: detail currency
     *      description: detail currency
     *      security:
     *        - Bearer: []
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - name: currency_id
     *          description: currency_id
     *          in: query
     *          required: true
     *          type: string
     *          example : 62439e4ee9bcb14dfee7ce79
     *          default : 62439e4ee9bcb14dfee7ce79
     *      responses:
     *        200:
     *          description: detail currency
     *        403:
     *          description: Server error
     */
    @Get<RestOptions>('/detail', {
        name: 'detail',
        middleware: ['authAdmin'],
        cache: false
    })
    async detail(ctx: Context<DbContextParameters>) {
        try {
            let params: any = ctx.params;
            const currency_id = params.currency_id
            if (currency_id == undefined) {
                return this.responseError('err_not_found', 'Currency not found');
            }

            let currency: any = await this.adapter.findById(currency_id)
            if (currency == false) {
                return this.responseError('err_not_found', 'Currency not found');
            }

            const attrCurrency = await ctx.call('v1.currencyAttr.getByCurrency', { currency_id })
            currency.attrCurrency = attrCurrency;
            return this.responseSuccess(currency);
        } catch (error) {
            this.logger.error("CurrencyAttrService --detail ", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *  /v1/admin/currency/deleteAttr:
     *    delete:
     *      tags:
     *      - "Admin Currency"
     *      summary: delete currency attr
     *      description: delete currency attr
     *      security:
     *        - Bearer: []
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
     *              - currency_id
     *              - currency_attr_id
     *            properties:
     *              currency_id:
     *                type: string
     *                default: 62a641cf936a6b7c6ccee1db
     *              currency_attr_id:
     *                type: string
     *                default: 62a641cf936a6b7c6ccee1db
     *      responses:
     *        200:
     *          description: delete currency attr
     *        403:
     *          description: Server error
     */
    @Delete<RestOptions>('/deleteAttr', {
        name: 'deleteAttr',
        middleware: ['authAdmin'],
        cache: false
    })
    async deleteAttr(ctx: Context) {
        try {
            let params: any = ctx.params;
            const currency_id = params.currency_id
            if (currency_id == undefined) {
                return this.responseError('err_not_found', 'Currency not found');
            }

            let currency: any = await this.adapter.findById(currency_id)
            if (currency == false) {
                return this.responseError('err_not_found', 'Currency not found');
            }

            const currency_attr_id = params.currency_attr_id
            if (currency_attr_id == undefined) {
                return this.responseError('err_not_found', 'Currency attribute not found');
            }

            let currency_attr: any = await ctx.call('v1.currencyAttr.findById', { id: currency_attr_id })
            if (currency_attr == false) {
                return this.responseError('err_not_found', 'Currency attribute not found');
            }
            await ctx.call('v1.currencyAttr.update', { id: currency_attr_id, entity: { deletedAt: moment().unix() } })
            this.broker.cacher?.clean('*.currency.**');
            this.broker.cacher?.clean('*.currencyAttr.**');
            return this.responseSuccessMessage("Delete currency attribute success");
        } catch (error) {
            this.logger.error("CurrencyAttrService -- deleteAttr ", error);
            return this.responseUnkownError();
        }
    }
}
