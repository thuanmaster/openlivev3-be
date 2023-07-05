'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Get, Method, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbInvestmentStatisticMixin, eventsInvestmentStatisticMixin } from '../../mixins/dbMixins';
import moment from 'moment';
import {
    InvestmentStatisticsServiceOptions,
    InvestmentStatisticsServiceSettingsOptions,
    MoleculerDBService,
    ParamCreateInvestmentStatistic, ParamFindStatistic, ParamRemoveDataInvestmentStatistic, ParamUpdateInvestmentStatistic, RestOptions
} from '../../types';
import { InvestmentStatisticEntity, IInvestmentStatistic } from '../../entities';
import { JsonConvert } from 'json2typescript';
import { checkFieldExist, convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
import _ from 'lodash';

@Service<InvestmentStatisticsServiceOptions>({
    name: 'investmentStatistic',
    version: 1,
    mixins: [dbInvestmentStatisticMixin, eventsInvestmentStatisticMixin],
    settings: {
        rest: '/v1/investmentStatistic',
        idField: '_id',
        pageSize: 10,
        fields: [
            '_id',
            'customer_id',
            'month',
            'year',
            'total_self_bought',
            'binary_sum_team_volumn',
            'binary_sum_team_volumn_break',
            'ref_sum_team_volumn',
            'ref_sum_team_volumn_break',
            'ref_count_member',
            'ref_count_f1',
            'ref_sum_f1_volumn',
            'createdAt',
            'updatedAt',
        ]
    }
})

export default class InvestmentStatisticService extends MoleculerDBService<InvestmentStatisticsServiceSettingsOptions, IInvestmentStatistic> {

    @Action({
        name: 'createDataEmptyAll',
        cache: false
    })
    async createDataEmptyAll(ctx: Context) {
        try {
            const customers: any = await this.broker.call('v1.customer.getAll')
            for (let i = 0; i < customers.length; i++) {
                const customer = customers[i]
                await this.broker.call('v1.investmentStatistic.createDataEmpty', { customer_id: customer._id.toString() })
            }
            return true
        } catch (e) {
            this.logger.error("InvestmentStatisticService - createDataEmpty:", e);
            return false;
        }
    }

    @Action({
        name: 'createDataEmpty',
        cache: false
    })
    async createDataEmpty(ctx: Context<ParamCreateInvestmentStatistic>) {
        try {
            const params = ctx.params;
            const now = moment();
            const month = now.format('M')
            const year = now.format('YYYY')
            const customerId = convertObjectId(params.customer_id)
            let investmentStatistic = await this.adapter.findOne({ customer_id: customerId, month: +month, year: +year });
            if (!investmentStatistic) {
                let entityInvestmentStatistic: any = {
                    customer_id: customerId,
                    month: +month,
                    year: +year
                }
                const parsedCustomerEntity = new JsonConvert().deserializeObject(entityInvestmentStatistic, InvestmentStatisticEntity).getMongoEntity()
                await this._create(ctx, parsedCustomerEntity);
            }
            return true
        } catch (e) {
            this.logger.error("InvestmentStatisticService - createDataEmpty:", e);
            return false;
        }
    }
    @Action({
        name: 'deleteMonth',
        cache: false
    })
    async deleteMonth(ctx: Context) {
        try {
            const params: any = ctx.params;
            const month = params.month
            const year = params.year
            let investmentStatistics: any = await this.adapter.find({ query: { month: +month, year: +year } });
            for (let i = 0; i < investmentStatistics.length; i++) {
                const investmentStatistic = investmentStatistics[i];
                await this.adapter.removeById(investmentStatistic._id);
            }
            return true
        } catch (e) {
            this.logger.error("InvestmentStatisticService - deleteMonth:", e);
            return false;
        }
    }

    @Action({
        name: 'removeData',
        cache: false
    })
    async removeData(ctx: Context<ParamRemoveDataInvestmentStatistic>) {
        try {
            const params = ctx.params;
            const month = params.month
            const year = params.year
            const customerId = convertObjectId(params.customer_id)
            let investmentStatistic: any = await this.adapter.findOne({ customer_id: customerId, month: +month, year: +year });
            if (investmentStatistic) {
                if (params.action == 'active_account') {
                    await ctx.call('v1.investmentStatistic.removeCountRef', { customer_id: params.customer_id, month: +month, year: +year });
                }

                if (params.action == 'investment') {
                    await ctx.call('v1.investmentStatistic.removeVolumn', { customer_id: params.customer_id, month: +month, year: +year, amount_invest_usd: params.amount_invest_usd });
                    await ctx.call('v1.investmentStatistic.removeVolumnBreakDown', { customer_id: params.customer_id, month: +month, year: +year, amount_invest_usd: params.amount_invest_usd });
                }
            }
            return true
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'updateData',
        cache: false
    })
    async updateData(ctx: Context<ParamUpdateInvestmentStatistic>) {
        try {
            const params = ctx.params;
            const now = moment();
            let month = +now.format('M')
            let year = +now.format('YYYY')
            if (checkFieldExist(params.month)) {
                month = params.month
            }

            if (checkFieldExist(params.year)) {
                year = params.year
            }

            const customerId = convertObjectId(params.customer_id.toString())
            let investmentStatistic: any = await this.adapter.findOne({ customer_id: customerId, month: +month, year: +year });
            if (!investmentStatistic) {
                let entityInvestmentStatistic: any = {
                    customer_id: customerId,
                    month: +month,
                    year: +year
                }
                const parsedCustomerEntity = new JsonConvert().deserializeObject(entityInvestmentStatistic, InvestmentStatisticEntity).getMongoEntity()
                investmentStatistic = await this._create(ctx, parsedCustomerEntity);
            }

            if (params.action == 'active_account') {
                await ctx.call('v1.investmentStatistic.updateCountRef', { customer_id: params.customer_id, month: +month, year: +year });
            }

            if (params.action == 'investment') {
                if (!checkFieldExist(params.month) && !checkFieldExist(params.year)) {
                    await this.adapter.updateById(investmentStatistic._id, { $set: { total_self_bought: investmentStatistic.total_self_bought + +params.amount_invest_usd } });
                }
                await ctx.call('v1.investmentStatistic.updateVolumn', { customer_id: params.customer_id, month: +month, year: +year, amount_invest_usd: params.amount_invest_usd });
                await ctx.call('v1.investmentStatistic.updateVolumnBreakDown', { customer_id: params.customer_id, month: +month, year: +year, amount_invest_usd: params.amount_invest_usd });
            }
            return true
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'findStatisticData',
        cache: false
    })
    async findStatisticData(ctx: Context<ParamFindStatistic>) {
        try {
            const params = ctx.params;
            return this.adapter.findOne({ month: params.month, year: params.year, customer_id: convertObjectId(params.customer_id.toString()) });
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'updateCountRef',
        cache: false
    })
    async updateCountRef(ctx: Context) {
        try {
            const params: any = ctx.params;
            const parents: any = await ctx.call('v1.customer.getParentCustomer', { customer_id: params.customer_id });
            if (parents && parents.length > 0) {
                for (let i = 0; i < parents.length; i++) {
                    const parent = parents[i];
                    const customerId = convertObjectId(parent._id)
                    const investmentStatistic: IInvestmentStatistic = await this.adapter.findOne({ customer_id: customerId, month: +params.month, year: +params.year });
                    if (investmentStatistic) {
                        let dataUpdate: any = {
                            ref_count_member: investmentStatistic.ref_count_member + 1
                        }
                        if (parent.level == 1) {
                            dataUpdate.ref_count_f1 = investmentStatistic.ref_count_f1 + 1
                        }
                        await this.adapter.updateById(investmentStatistic._id, { $set: dataUpdate });
                    } else {
                        let entityInvestmentStatistic: any = {
                            customer_id: customerId,
                            month: +params.month,
                            year: +params.year,
                            ref_count_member: 1
                        }
                        if (parent.level == 1) {
                            entityInvestmentStatistic.ref_count_f1 = 1
                        }
                        const parsedCustomerEntity = new JsonConvert().deserializeObject(entityInvestmentStatistic, InvestmentStatisticEntity).getMongoEntity()
                        await this._create(ctx, parsedCustomerEntity);
                    }
                }
            }
            return true
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'removeCountRef',
        cache: false
    })
    async removeCountRef(ctx: Context) {
        try {
            const params: any = ctx.params;
            const parents: any = await ctx.call('v1.customer.getParentCustomer', { customer_id: params.customer_id });
            if (parents && parents.length > 0) {
                for (let i = 0; i < parents.length; i++) {
                    const parent = parents[i];
                    const customerId = convertObjectId(parent._id)
                    const investmentStatistic: IInvestmentStatistic = await this.adapter.findOne({ customer_id: customerId, month: +params.month, year: +params.year });
                    if (investmentStatistic) {
                        let dataUpdate: any = {
                            ref_count_member: investmentStatistic.ref_count_member - 1
                        }
                        if (parent.level == 1) {
                            dataUpdate.ref_count_f1 = investmentStatistic.ref_count_f1 - 1
                        }
                        await this.adapter.updateById(investmentStatistic._id, { $set: dataUpdate });
                    }
                }
            }
            return true
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'updateVolumn',
        cache: false
    })
    async updateVolumn(ctx: Context) {
        try {
            const params: any = ctx.params;
            const parents: any = await ctx.call('v1.customer.getParentCustomer', { customer_id: params.customer_id });
            if (parents && parents.length > 0) {
                for (let i = 0; i < parents.length; i++) {
                    const parent = parents[i];
                    const customerId = convertObjectId(parent._id)
                    const investmentStatistic: IInvestmentStatistic = await this.adapter.findOne({ customer_id: customerId, month: +params.month, year: +params.year });
                    if (investmentStatistic) {
                        let dataUpdate: any = {
                            ref_sum_team_volumn: investmentStatistic.ref_sum_team_volumn + +params.amount_invest_usd
                        }
                        if (parent.level == 1) {
                            dataUpdate.ref_sum_f1_volumn = investmentStatistic.ref_sum_f1_volumn + +params.amount_invest_usd
                        }

                        await this.adapter.updateById(investmentStatistic._id, { $set: dataUpdate });
                    } else {
                        let entityInvestmentStatistic: any = {
                            customer_id: customerId,
                            month: +params.month,
                            year: +params.year,
                            ref_sum_team_volumn: +params.amount_invest_usd,
                            ref_sum_f1_volumn: 0
                        }
                        if (parent.level == 1) {
                            entityInvestmentStatistic.ref_sum_f1_volumn = +params.amount_invest_usd
                        }
                        const parsedCustomerEntity = new JsonConvert().deserializeObject(entityInvestmentStatistic, InvestmentStatisticEntity).getMongoEntity()
                        await this._create(ctx, parsedCustomerEntity);
                    }
                }
            }
            return true
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'updateVolumnBreakDown',
        cache: false
    })
    async updateVolumnBreakDown(ctx: Context) {
        try {
            const params: any = ctx.params;
            const customer: any = await ctx.call('v1.customer.findById', { customer_id: params.customer_id });
            let levelCurrent = customer.level_commission;
            let parents: any = await ctx.call('v1.customer.getParentCustomer', { customer_id: params.customer_id });
            parents = _.orderBy(parents, ['level'], ['asc']);
            if (parents && parents.length > 0) {
                for (let i = 0; i < parents.length; i++) {
                    const parent = parents[i];

                    if (parent.level_commission > levelCurrent) {
                        levelCurrent = parents.level_commission;
                        const customerId = convertObjectId(parent._id)
                        const investmentStatistic: IInvestmentStatistic = await this.adapter.findOne({ customer_id: customerId, month: +params.month, year: +params.year });
                        if (investmentStatistic) {
                            let dataUpdate: any = {
                                ref_sum_team_volumn_break: investmentStatistic.ref_sum_team_volumn_break + +params.amount_invest_usd
                            }
                            await this.adapter.updateById(investmentStatistic._id, { $set: dataUpdate });
                        } else {
                            let entityInvestmentStatistic: any = {
                                customer_id: customerId,
                                month: +params.month,
                                year: +params.year,
                                ref_sum_team_volumn_break: +params.amount_invest_usd
                            }
                            const parsedCustomerEntity = new JsonConvert().deserializeObject(entityInvestmentStatistic, InvestmentStatisticEntity).getMongoEntity()
                            await this._create(ctx, parsedCustomerEntity);
                        }
                    }
                }
            }
            return true
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }


    @Action({
        name: 'removeVolumn',
        cache: false
    })
    async removeVolumn(ctx: Context) {
        try {
            const params: any = ctx.params;
            const parents: any = await ctx.call('v1.customer.getParentCustomer', { customer_id: params.customer_id });
            if (parents && parents.length > 0) {
                for (let i = 0; i < parents.length; i++) {
                    const parent = parents[i];
                    const customerId = convertObjectId(parent._id)
                    const investmentStatistic: IInvestmentStatistic = await this.adapter.findOne({ customer_id: customerId, month: +params.month, year: +params.year });
                    if (investmentStatistic) {
                        let dataUpdate: any = {
                            ref_sum_team_volumn: investmentStatistic.ref_sum_team_volumn - +params.amount_invest_usd
                        }
                        if (parent.level == 1) {
                            dataUpdate.ref_sum_f1_volumn = investmentStatistic.ref_sum_f1_volumn - +params.amount_invest_usd
                        }

                        await this.adapter.updateById(investmentStatistic._id, { $set: dataUpdate });
                    }
                }
            }
            return true
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'removeVolumnBreakDown',
        cache: false
    })
    async removeVolumnBreakDown(ctx: Context) {
        try {
            const params: any = ctx.params;
            const customer: any = await ctx.call('v1.customer.findById', { customer_id: params.customer_id });
            let levelCurrent = customer.level_commission;
            let parents: any = await ctx.call('v1.customer.getParentCustomer', { customer_id: params.customer_id });
            parents = _.orderBy(parents, ['level'], ['asc']);
            if (parents && parents.length > 0) {
                for (let i = 0; i < parents.length; i++) {
                    const parent = parents[i];

                    if (parent.level_commission > levelCurrent) {
                        levelCurrent = parents.level_commission;
                        const customerId = convertObjectId(parent._id)
                        const investmentStatistic: IInvestmentStatistic = await this.adapter.findOne({ customer_id: customerId, month: +params.month, year: +params.year });
                        if (investmentStatistic) {
                            let dataUpdate: any = {
                                ref_sum_team_volumn_break: investmentStatistic.ref_sum_team_volumn_break - +params.amount_invest_usd
                            }
                            await this.adapter.updateById(investmentStatistic._id, { $set: dataUpdate });
                        }
                    }
                }
            }
            return true
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    /**
     *  @swagger
     *
     *  /v1/investmentStatistic/report:
     *    get:
     *      tags:
     *      - "InvestmentStatistic"
     *      summary: report investment Statistic
     *      description: report investment Statistic
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      security:
     *        - Bearer: []
     *      parameters:
     *        - name: customer_id
     *          description: customer_id
     *          in: query
     *          required: false
     *          type: string
     *      responses:
     *        200:
     *          description: get list Investment
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
            const params: any = ctx.params
            let customer_id = customer._id.toString();
            if (params.customer_id != undefined && params.customer_id != "" && params.customer_id != null) {
                customer_id = params.customer_id
            }

            let query: any = {
                customer_id: convertObjectId(customer_id)
            }
            let reports: any = await this.adapter.find({ query, sort: { createdAt: -1 } });
            let data: any = []
            for (let i = 0; i < reports.length; i++) {
                let report = reports[i]
                if (report.month > 1 && report.year >= 2023) {
                    data.push(report);
                } else {
                    report.total_self_bought = 0;
                    report.binary_sum_team_volumn = 0;
                    report.binary_sum_team_volumn_break = 0;
                    report.ref_sum_team_volumn = 0;
                    report.ref_sum_team_volumn_break = 0;
                    report.ref_sum_f1_volumn = 0;
                    data.push(report);
                }
            }
            return this.responseSuccess(data);
        } catch (error) {
            this.logger.error("InvestmentService - report", error);
            return this.responseUnkownError();
        }
    }

    @Action({
        name: 'totalInvest',
        cache: false
    })
    async totalInvest(ctx: Context): Promise<Number | Boolean> {
        try {
            const params: any = ctx.params;
            let match: any = { customer_id: convertObjectId(params.customer_id) }

            const total_self_bought = await this.adapter.collection.aggregate([
                {
                    $match: match
                }, {
                    $group: {
                        _id: "$customer_id",
                        sumAmount: {
                            $sum: "$total_self_bought",
                        },
                    },
                }
            ]);
            let sumAmount = 0;
            const dataTotalInvest = await total_self_bought.toArray();
            if (dataTotalInvest.length > 0) {
                sumAmount = dataTotalInvest[0].sumAmount
            }
            return sumAmount;
        } catch (error) {
            this.logger.error('InvestmentService - totalInvest:', error)
            return false
        }
    }
    @Action({
        name: 'totalInvestCustomers',
        cache: false
    })
    async totalInvestCustomers(ctx: Context): Promise<Number | Boolean> {
        try {
            const params: any = ctx.params;
            var customer_id = params.customer_id.map((item: string) => {
                return convertObjectId(item);
            });
            let match: any = { customer_id: { $in: customer_id }, month: { $gte: 2 }, year: { $gte: 2023 } }
            const total_self_bought = await this.adapter.collection.aggregate([
                {
                    $match: match
                }, {
                    $group: {
                        _id: "$customer_id",
                        sumAmount: {
                            $sum: "$total_self_bought",
                        },
                    },
                }
            ]);
            let sumAmount = 0;
            const dataTotalInvest = await total_self_bought.toArray();
            if (dataTotalInvest.length > 0) {
                sumAmount = _.sumBy(dataTotalInvest, 'sumAmount')
            }
            return sumAmount;
        } catch (error) {
            this.logger.error('InvestmentService - totalInvest:', error)
            return false
        }
    }

    @Action({
        name: 'totalTeamVolumn',
        cache: false
    })
    async totalTeamVolumn(ctx: Context): Promise<Number | Boolean> {
        try {
            const params: any = ctx.params;
            let match: any = { customer_id: convertObjectId(params.customer_id) }

            const totalTeamVolumn = await this.adapter.collection.aggregate([
                {
                    $match: match
                }, {
                    $group: {
                        _id: "$customer_id",
                        sumAmount: {
                            $sum: "$ref_sum_team_volumn",
                        },
                    },
                }
            ]);
            let sumAmount = 0;
            const dataTotalTeamVolumn = await totalTeamVolumn.toArray();
            if (dataTotalTeamVolumn.length > 0) {
                sumAmount = dataTotalTeamVolumn[0].sumAmount
            }
            return sumAmount;
        } catch (error) {
            this.logger.error('InvestmentService - totalTeamVolumn:', error)
            return false
        }
    }

    @Action({
        name: 'totalTeamMember',
        cache: false
    })
    async totalTeamMember(ctx: Context): Promise<Number | Boolean> {
        try {
            const params: any = ctx.params;
            let match: any = { customer_id: convertObjectId(params.customer_id) }

            const totalTeamMember = await this.adapter.collection.aggregate([
                {
                    $match: match
                }, {
                    $group: {
                        _id: "$customer_id",
                        sumAmount: {
                            $sum: "$ref_count_member",
                        },
                    },
                }
            ]);
            let sumAmount = 0;
            const dataTotalTeamMember = await totalTeamMember.toArray();
            if (dataTotalTeamMember.length > 0) {
                sumAmount = dataTotalTeamMember[0].sumAmount
            }
            return sumAmount;
        } catch (error) {
            this.logger.error('InvestmentService - totalTeamMember:', error)
            return false
        }
    }

    @Get<RestOptions>('/reset-month-2', {
        name: 'resetMonthTwo',
        cache: false,
    })
    async resetMonthTwo(ctx: Context) {
        const datas: any = await this.adapter.find({ query: { month: 2, year: 2023 } });
        for (let i = 0; i < datas.length; i++) {
            const data = datas[i]
            const dataUpdate: any = {
                total_self_bought: 0,
                binary_sum_team_volumn: 0,
                binary_sum_team_volumn_break: 0,
                ref_sum_team_volumn: 0,
                ref_sum_team_volumn_break: 0,
                ref_sum_f1_volumn: 0,
            }
            await this.adapter.updateById(data._id, { $set: dataUpdate })
        }
        return true;
    }
}
