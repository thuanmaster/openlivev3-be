'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbOrderMixin, eventsOrderMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
    actionTransaction,
    MoleculerDBService,
    OrderCreateParams,
    PackageStakeParams,
    PackageStakeParamsValidator,
    paymentMethod,
    RestOptions,
    statusTransaction,
    TotalStakeTermParams,
    ClaimRewardParams,
    ClaimRewardParamsValidator,
    TypePackage,
    TotalStakeCustomerParams,
    statusOrder,
    TotalHarvestCustomerParams
} from '../../types';
import { IPackage, IOrder, OrderEntity, IPackageTerm, ICurrency, IReward } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { CustomValidator } from '../../validators';
import moment from 'moment';
import { convertObjectId, generateCode } from '../../mixins/dbMixins/helpers.mixin';
import { BotTelegram } from '../../libraries';

@Service({
    name: 'order',
    version: 1,
    mixins: [dbOrderMixin, eventsOrderMixin],
    settings: {
        rest: '/v1/order',
        idField: '_id',
        pageSize: 10,
        fields: [
            '_id',
            'customer_id',
            'package_id',
            'term_id',
            'currency_stake_id',
            'amount_stake',
            'amount_usd_stake',
            'subscription_date',
            'redemption_date',
            'last_time_reward',
            'status',
            'createdAt',
            'updatedAt',
        ]
    }
})

export default class OrderService extends MoleculerDBService<DbServiceSettings, IOrder> {
    @Action({
        name: 'create',
        cache: false
    })
    async create(ctx: Context<OrderCreateParams>): Promise<IOrder | Boolean> {
        try {
            const entityCreate = ctx.params;
            const parsedOrderEntity = new JsonConvert().deserializeObject(entityCreate, OrderEntity).getMongoEntity()
            return await this._create(ctx, parsedOrderEntity);
        } catch (error) {
            this.logger.error('OrderService - create:', error)
            return false
        }

    }

    /**
     *  @swagger
     *
     *  /v1/order/list:
     *    get:
     *      tags:
     *      - "Order"
     *      summary: get list order
     *      description: get list order
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
     *        - name: currency_stake_id
     *          description: currency stake id
     *          in: query
     *          required: false
     *          type: string
     *        - name: package_id
     *          description: package id
     *          in: query
     *          required: false
     *          type: string
     *        - name: start_date
     *          description: start_date
     *          in: query
     *          required: false
     *          type: integer
     *          example : 1111111 
     *        - name: end_date
     *          description: end_date
     *          in: query
     *          required: false
     *          type: integer
     *          example : 1111111 
     *        - name: status
     *          description: status
     *          in: query
     *          required: false
     *          type: string
     *          example : HOLDING
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: get list order
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
                deletedAt: null,
                customer_id: convertObjectId(customer._id.toString())
            }

            if (params.currency_stake_id != undefined) {
                query.currency_stake_id = convertObjectId(params.currency_stake_id);
            }
            if (params.package_id != undefined) {
                query.package_id = convertObjectId(params.package_id);
            }

            if (params.status != undefined) {
                query.status = params.status
            }

            if (params.start_date != undefined) {
                query.createdAt = { $gte: +params.start_date };
            }

            if (params.end_date != undefined) {
                query.createdAt = { $lt: +params.end_date };
            }

            params.query = query
            let orders: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
            const dataOrders = orders.rows;
            let dataRows: any = [];
            for (let i = 0; i < dataOrders.length; i++) {
                let row: any = dataOrders[i];
                let dataPackage: any = await ctx.call('v1.package.findById', { id: row.package_id });
                row.package = dataPackage;
                dataRows.push(row)
            }
            orders.rows = dataRows;
            return this.responseSuccess(orders);
        } catch (error) {
            this.logger.error("OrderService - list", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/order/detail:
     *    get:
     *      tags:
     *      - "Order"
     *      summary: get order detail
     *      description: get order detail
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - name: order_id
     *          description: order_id
     *          in: query
     *          required: true
     *          type: string
     *          example : 1
     *          default : 1
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: get order detail
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
            const params: any = ctx.params
            const order_id = params.order_id

            let order: any = await this.adapter.findById(order_id);
            if (order) {
                if (order.customer_id.toString() == customer._id.toString()) {
                    const rewards = await ctx.call('v1.reward.getRewardByTerm', { 'package_id': order.package_id, 'term_id': order.term_id })
                    order.rewards = rewards;
                    return this.responseSuccess(order);
                } else {
                    return this.responseError('err_not_found', 'Stake not found.');
                }
            } else {
                return this.responseError('err_not_found', 'Stake not found.');
            }
        } catch (error) {
            this.logger.error("OrderService - detail", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/order/report:
     *    get:
     *      tags:
     *      - "Order"
     *      summary: get order report
     *      description: get order report
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: get order report
     *        403:
     *          description: Server error
     */
    @Get<RestOptions>('/report', {
        name: 'report',
        middleware: ['auth'],
        cache: false,
    })
    async report(ctx: Context) {
        try {
            const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }

            const totalStake = await ctx.call('v1.order.totalStakeCustomer', { customer_id: customer._id.toString() })
            const totalStakeSystem = await ctx.call('v1.order.totalStakeSystem')
            const totalEarnedHarvest = await ctx.call('v1.transaction.totalEarnedHarvestCustomer', { customer_id: customer._id.toString() })
            const totalHarvest = await ctx.call('v1.order.totalHarvestCustomer', { customer_id: customer._id.toString() })
            return this.responseSuccess({ totalStake, totalEarnedHarvest, totalHarvest, totalStakeSystem });
        } catch (error) {
            this.logger.error("OrderService - detail", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/order/stake:
     *    post:
     *      tags:
     *      - "Order"
     *      summary: stake Package
     *      description: stake Package
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
     *              - package_id
     *              - term_id
     *              - amount
     *            properties:
     *              package_id:
     *                type: string
     *                default: 62a50d077a6b325e302051e9
     *              term_id:
     *                type: string
     *                default: 62a641cf936a6b7c6ccee1db
     *              amount:
     *                type: integer
     *                default: 100000000000000000000
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: stake Package
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/stake', {
        name: 'stake',
        middleware: ['auth'],
        cache: false,
    })
    async stake(ctx: Context<PackageStakeParams>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, PackageStakeParamsValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }

            const now = moment().unix();

            const queryData = { id: convertObjectId(entity.package_id) }
            const packageData: IPackage = await ctx.call('v1.package.findById', queryData);
            if (!packageData) {
                return this.responseError('err_not_found', 'Package not found.');
            }

            if (packageData.start_date > now || packageData.end_date < now || packageData.deletedAt != null || packageData.status != true) {
                return this.responseError('err_not_found', 'The package has expired.');
            }

            const packageTerm: IPackageTerm = await ctx.call('v1.packageTerm.findById', { term_id: convertObjectId(entity.term_id) })
            if (!packageTerm) {
                return this.responseError('err_not_found', 'Package term not found.');
            }

            const currency: ICurrency = await ctx.call('v1.currency.find', { currency_id: packageData.currency_stake_id });
            if (!currency) {
                return this.responseError('err_not_found', 'Currency not found or not active.');
            }

            if (+entity.amount < packageData.min_stake || +entity.amount > packageData.max_stake) {
                return this.responseError('err_over_limit', `Staking limit from ${packageData.min_stake / 10 ** 18} ${currency.code} to ${packageData.max_stake / 10 ** 18} ${currency.code}`);
            }

            if (packageTerm.total_stake != 0) {
                const total: number = await ctx.call('v1.order.totalStakeTerm', { term_id: entity.term_id });
                if (total >= packageTerm.total_stake) {
                    return this.responseError('err_over_limit', 'Stake has reached the limit');
                }
            }

            const balance: number = await ctx.call('v1.transaction.getBalance', {
                currency_code: currency.code,
                customer_id: customer._id
            })

            if (balance < +entity.amount) {
                return this.responseError('err_balance_not_enough', 'The balance in the wallets is not enough for staking.');
            }

            const amount_usd_stake = +entity.amount * +currency.usd_rate;
            const codeOrder = generateCode(20);
            let entityOrder = {
                'code': codeOrder,
                'customer_id': convertObjectId(customer._id.toString()),
                'package_id': convertObjectId(entity.package_id),
                'term_id': convertObjectId(entity.term_id),
                'currency_stake_id': convertObjectId(packageData.currency_stake_id.toString()),
                'amount_stake': entity.amount,
                'amount_usd_stake': amount_usd_stake,
                'subscription_date': moment().unix(),
                'last_time_reward': moment().unix(),
                'redemption_date': moment().add(packageTerm.day_reward, 'days').unix(),
                'status': statusOrder.HOLDING,
            }
            const order: IOrder = await ctx.call('v1.order.create', entityOrder);
            if (order) {
                const codeTransaction = generateCode(20);
                let entityCreate = {
                    customer: convertObjectId(customer._id.toString()),
                    currency: currency.code,
                    chain: "",
                    action: actionTransaction.STAKE,
                    amount: entity.amount,
                    amount_usd: amount_usd_stake,
                    fee: 0,
                    balance: balance - +entity.amount,
                    balanceBefore: balance,
                    payment_method: paymentMethod.CRYPTO,
                    txhash: codeTransaction,
                    from: "",
                    to: "",
                    order: order._id,
                    status: statusTransaction.COMPLETED
                }
                await ctx.call('v1.transaction.create', entityCreate);
                await ctx.call('v1.commission.commissionStake', { order_id: order._id });
                this.broker.cacher?.clean(`*.order.totalStakeCustomer:${customer._id.toString()}`);
                this.broker.cacher?.clean(`*.order.totalStakeSystem`);
                this.broker.cacher?.clean(`*.transaction.totalEarnedHarvestCustomer:${customer._id.toString()}`);
                this.broker.cacher?.clean(`*.order.totalHarvestCustomer:${customer._id.toString()}`);
                return this.responseSuccessDataMessage("Create staking success", order);
            } else {
                BotTelegram.sendMessageError(`PackageService - stake: ${entityOrder}`);
                return this.responseError('err_unknown', 'Has error staking');
            }
        } catch (error) {
            BotTelegram.sendMessageError(`PackageService - stake error: ${error}`);
            this.logger.error("PackageService - stake", error);
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/order/claimReward:
     *    post:
     *      tags:
     *      - "Order"
     *      summary: claim Reward stake
     *      description: claim Reward stake
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
     *              - order_id
     *            properties:
     *              order_id:
     *                type: string
     *                default: 62a50d077a6b325e302051e9
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: claim Reward stake
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/claimReward', {
        name: 'claimReward',
        middleware: ['auth'],
        cache: false,
    })
    async claimReward(ctx: Context<ClaimRewardParams>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, ClaimRewardParamsValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }

            const orderData: IOrder = await this.adapter.findOne({
                _id: convertObjectId(entity.order_id),
                status: statusOrder.HOLDING,
                customer_id: convertObjectId(customer._id.toString())
            });
            if (!orderData) {
                return this.responseError('err_not_found', 'Order not found.');
            }


            const packageData: IPackage = await ctx.call('v1.package.findByParam', { _id: convertObjectId(orderData.package_id.toString()) })
            if (!packageData) {
                return this.responseError('err_not_found', 'Package not found.');
            }

            if (packageData.type == TypePackage.LOCKED) {
                return this.responseError('err_not_found', 'Package not found.');
            }

            const currency: ICurrency = await ctx.call('v1.currency.find', { currency_id: packageData.currency_stake_id });
            if (!currency) {
                return this.responseError('err_not_found', 'Currency not found or not active.');
            }

            const checkHandleReward = await ctx.call('v1.order.handleReward', { order: orderData, packageData, customer, currency })
            if (checkHandleReward) {
                this.broker.cacher?.clean(`*.transaction.totalEarnedHarvestCustomer:${customer._id.toString()}`);
                return this.responseSuccessMessage("Claim reward success")
            } else {
                return this.responseUnkownError();
            }
        } catch (error) {
            BotTelegram.sendMessageError(`PackageService - stake error: ${error}`);
            this.logger.error("PackageService - stake", error);
            return this.responseUnkownError();
        }
    }

    @Action({
        name: 'totalStakeTerm',
        cache: false
    })
    async totalStakeTerm(ctx: Context<TotalStakeTermParams>): Promise<Number | Boolean> {
        try {
            const params: any = ctx.params;
            let match: any = { term_id: convertObjectId(params.term_id) }

            const orders = await this.adapter.collection.aggregate([
                {
                    $match: match
                }, {
                    $group: {
                        _id: "$term_id",
                        sumAmount: {
                            $sum: "$amount_stake",
                        },
                    },
                }
            ]);
            let sumAmount = 0;
            const dataOrrder = await orders.toArray();
            if (dataOrrder.length > 0) {
                sumAmount = dataOrrder[0].sumAmount
            }
            return sumAmount;
        } catch (error) {
            this.logger.error('OrderService - totalStakeTerm:', error)
            return false
        }
    }

    @Action({
        name: 'totalStakeCustomer',
        cache: {
            keys: ['customer_id'],
            ttl: 300 * 60
        },
    })
    async totalStakeCustomer(ctx: Context<TotalStakeCustomerParams>): Promise<Number | Boolean> {
        try {
            const params: any = ctx.params;
            let match: any = { customer_id: convertObjectId(params.customer_id) }
            const orders = await this.adapter.collection.aggregate([
                {
                    $match: match
                }, {
                    $group: {
                        _id: "$customer_id",
                        sumAmount: {
                            $sum: "$amount_usd_stake",
                        },
                    },
                }
            ]);
            let sumAmount = 0;
            const dataOrrder = await orders.toArray();
            if (dataOrrder.length > 0) {
                sumAmount = dataOrrder[0].sumAmount
            }
            return sumAmount;
        } catch (error) {
            this.logger.error('OrderService - totalStakeCustomer:', error)
            return false
        }
    }
    @Action({
        name: 'totalStakeSystem',
        cache: {
            ttl: 300 * 60
        },
    })
    async totalStakeSystem(ctx: Context): Promise<Number | Boolean> {
        try {
            let match: any = {
                deletedAt: {
                    $exists: true
                }
            }
            const orders = await this.adapter.collection.aggregate([
                {
                    $match: match
                },
                {
                    $group: {
                        _id: "$deletedAt",
                        sumAmount: {
                            $sum: "$amount_usd_stake",
                        },
                    },
                }
            ]);
            let sumAmount = 0;
            const dataOrrder = await orders.toArray();
            if (dataOrrder.length > 0) {
                sumAmount = dataOrrder[0].sumAmount
            }
            return sumAmount;
        } catch (error) {
            this.logger.error('OrderService - totalStakeSystem:', error)
            return false
        }
    }

    @Action({
        name: 'totalHarvestCustomer',
        cache: {
            keys: ['customer_id'],
            ttl: 30 * 60
        }
    })
    async totalHarvestCustomer(ctx: Context<TotalHarvestCustomerParams>): Promise<Number | Boolean> {
        try {
            const params: any = ctx.params;
            let query: any = { customer_id: convertObjectId(params.customer_id) }
            const orders = await this.adapter.find({ query });
            let totalHarvest: number = 0;
            for (let i = 0; i < orders.length; i++) {
                const order = orders[i]
                const totalstake = order.amount_stake;
                const packageTerm: IPackageTerm = await ctx.call('v1.packageTerm.findById', { term_id: convertObjectId(order.term_id.toString()) })
                const packageData: IPackage = await ctx.call('v1.package.findByParam', { _id: convertObjectId(order.package_id.toString()) })
                const currency: ICurrency = await ctx.call('v1.currency.find', { currency_id: packageData.currency_stake_id });

                const day_reward = packageTerm.day_reward;
                const rewards: IReward[] = await ctx.call('v1.reward.getRewardByParams', { package_id: order.package_id, term_id: order.term_id })
                for (let index = 0; index < rewards.length; index++) {
                    const reward = rewards[index];
                    const rate = day_reward * (reward.apr_reward / 365);
                    const totalReward = totalstake * rate;
                    totalHarvest += totalReward * currency.usd_rate;
                }
            }

            return totalHarvest;
        } catch (error) {
            this.logger.error('OrderService - totalHarvestCustomer:', error)
            return false
        }
    }

    @Action({
        name: 'handleReward',
        cache: false
    })
    async handleReward(ctx: Context) {
        try {
            const params: any = ctx.params;
            const order: any = params.order
            const packageData: any = params.packageData
            const customer: any = params.customer
            const currencyPackage: any = params.currency

            const now = moment()
            const packageTerm: IPackageTerm = await ctx.call('v1.packageTerm.findById', { term_id: convertObjectId(order.term_id.toString()) })
            if (!packageTerm) {
                return this.responseError('err_not_found', 'Package term not found.');
            }

            const rewards: IReward[] = await ctx.call('v1.reward.getRewardByParams', { package_id: packageData._id, term_id: packageTerm._id })
            if (!rewards) {
                return this.responseError('err_not_found', 'Reward term not found.');
            }

            const amount_usd_stake = packageData.amount_stake * currencyPackage.usd_rate
            const redemption_date = order.redemption_date
            const last_time_reward = order.last_time_reward
            let timeReward = now.diff(moment(last_time_reward * 1000), 'hours')
            const totalNowRe = now.diff(moment(redemption_date * 1000), 'hours')
            if (totalNowRe > 0) {
                timeReward = timeReward - totalNowRe;
            }
            if (timeReward <= 1) {
                return this.responseError('err_not_found', 'Cant claim reward right now.');
            }

            let cuNow = last_time_reward + (3600 * timeReward)
            if (cuNow > redemption_date) {
                cuNow = redemption_date;
            }

            const totalHoursOfYear = 365 * 24;
            for (let i = 0; i < rewards.length; i++) {
                const reward: IReward = rewards[i]
                const rateHour = reward.apr_reward / totalHoursOfYear;
                const currency: ICurrency = await ctx.call('v1.currency.find', { currency_id: reward.currency_reward_id });
                if (currency) {
                    const totalStakeCurrency = amount_usd_stake / currency.usd_rate;

                    const amount = (totalStakeCurrency * (rateHour * timeReward)) / 100;
                    const balance: number = await ctx.call('v1.transaction.getBalance', {
                        currency_code: currency.code,
                        customer_id: customer._id
                    })
                    if (amount > 0) {
                        const codeTransaction = generateCode(20);
                        let entityCreate = {
                            customer: convertObjectId(customer._id.toString()),
                            currency: currency.code,
                            chain: "",
                            action: actionTransaction.INTEREST,
                            amount: amount,
                            amount_usd: amount * currency.usd_rate,
                            fee: 0,
                            balance: balance + amount,
                            balanceBefore: balance,
                            payment_method: paymentMethod.CRYPTO,
                            txhash: codeTransaction,
                            from: "",
                            to: "",
                            order: order._id?.toString(),
                            status: statusTransaction.COMPLETED
                        }
                        await ctx.call('v1.transaction.create', entityCreate);
                        this.broker.cacher?.clean(`*.transaction.totalEarnedHarvestCustomer:${customer._id.toString()}`);
                    }
                }
            }
            await this.adapter.updateById(order._id, { $set: { last_time_reward: cuNow, updatedAt: moment().unix() } });
            return true
        } catch (error) {
            this.logger.error('OrderService - handleReward:', error)
            return false;
        }
    }

    @Action({
        name: 'getOrderRedeem',
        cache: false
    })
    async getOrderRedeem(ctx: Context) {
        try {
            const startDate = moment().startOf('day').unix()
            const endDate = moment().endOf('day').unix()
            let query: any = {
                status: statusOrder.HOLDING,
                redemption_date: {
                    $gte: startDate,
                    $lt: endDate
                }
            };
            return await this._find(ctx, { query })
        } catch (error) {
            this.logger.error('OrderService - getOrderRedeem:', error)
            return false
        }
    }
    @Action({
        name: 'findById',
        cache: false
    })
    async findById(ctx: Context) {
        try {
            const params: any = ctx.params
            return await this.adapter.findById(params.order_id)
        } catch (error) {
            this.logger.error('OrderService - findById:', error)
            return false
        }
    }

    @Action({
        name: 'redeemtion',
        cache: false
    })
    async redeemtion(ctx: Context) {
        try {
            const params: any = ctx.params;
            const order: any = await this.adapter.findById(params.order_id);
            if (order) {
                const packageData: IPackage = await ctx.call('v1.package.findByParam', { _id: convertObjectId(order.package_id.toString()) })
                if (!packageData) {
                    return this.responseError('err_not_found', 'Package not found.');
                }

                const currency: ICurrency = await ctx.call('v1.currency.find', { currency_id: packageData.currency_stake_id });
                if (!currency) {
                    return this.responseError('err_not_found', 'Currency not found or not active.');
                }

                const customer: any = await ctx.call('v1.customer.findById', { customer_id: order.customer_id });
                if (!customer) {
                    return this.responseError('err_auth_fail', 'Token expired.');
                }

                const balance: number = await ctx.call('v1.transaction.getBalance', {
                    currency_code: currency.code,
                    customer_id: customer._id
                })

                const codeTransaction = generateCode(20);
                const amount = order.amount_stake
                let entityCreate = {
                    customer: convertObjectId(customer._id.toString()),
                    currency: currency.code,
                    chain: "",
                    action: actionTransaction.UNSTAKE,
                    amount: amount,
                    amount_usd: amount * currency.usd_rate,
                    fee: 0,
                    balance: balance + amount,
                    balanceBefore: balance,
                    payment_method: paymentMethod.CRYPTO,
                    txhash: codeTransaction,
                    from: "",
                    to: "",
                    order: order._id?.toString(),
                    status: statusTransaction.COMPLETED
                }

                await this.adapter.updateById(order._id, { $set: { status: statusOrder.COMPLETED, updatedAt: moment().unix() } });
                await ctx.call('v1.order.handleReward', { order: order, packageData, customer, currency })
                await ctx.call('v1.transaction.create', entityCreate);
                this.broker.cacher?.clean(`*.transaction.totalEarnedHarvestCustomer:${customer._id.toString()}`);
                this.broker.cacher?.clean(`*.order.totalHarvestCustomer:${customer._id.toString()}`);
            }
            return true
        } catch (error) {
            this.logger.error('OrderService - getOrderRedeem:', error)
            return false
        }
    }
}
