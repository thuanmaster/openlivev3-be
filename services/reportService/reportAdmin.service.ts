'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Post, Get, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { RestOptions, MoleculerDBService, actionTransaction } from '../../types';
import { DbContextParameters } from 'moleculer-db';
import * as _ from 'lodash';
@Service({
    name: 'admin.report',
    version: 1,
    settings: {
        rest: '/v1/admin/report'
    },
})
export default class ReportAdminService extends MoleculerDBService<any, any> {
    /**
    *  @swagger
    *
    *  /v1/admin/report/total:
    *    get:
    *      tags:
    *      - "Admin Report"
    *      summary: report total
    *      description: report total
    *      produces:
    *        - application/json
    *      consumes:
    *        - application/json
    *      parameters:
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
    *        - name: customer_id
    *          description: customer_id
    *          in: query
    *          required: false
    *          type: string
    *          example : 1651853180
    *      security:
    *        - Bearer: [] 
    *      responses:
    *        200:
    *          description: get list Transaction
    *        403:
    *          description: Server error
    */
    @Get<RestOptions>('/total', {
        name: 'total',
        middleware: ['authAdmin'],
        cache: false,
    })
    async total(ctx: Context<DbContextParameters>) {
        try {
            let params: any = ctx.params
            const totalCustomer = await ctx.call('v1.customer.totalCustomer', { from_date: params.from_date, to_date: params.to_date });
            const currencies: any = await ctx.call('v1.currency.getAll');
            let reportTransaction: any = [];
            for (let i = 0; i < currencies.length; i++) {
                const currency = currencies[i]
                const data: any = await ctx.call('v1.transaction.reportTotal', { currency: currency.code, chain: params.chain, from_date: params.from_date, to_date: params.to_date })
                let obj: any = {
                    currency: currency.code
                }
                for (const [key, value] of Object.entries(actionTransaction)) {
                    const item = _.find(data, { _id: value });
                    if (item != undefined) {
                        obj[value] = item.sumAmount;
                    } else {
                        obj[value] = 0
                    }
                }
                reportTransaction.push(obj)
            }
            const countInvestment = await ctx.call("v1.investment.countInvestment", { customer_id: params.customer_id, from_date: params.from_date, to_date: params.to_date })
            return this.responseSuccess({ totalCustomer, reportTransaction, countInvestment })
        } catch (error) {
            this.logger.error("ReportService - list", error);
            return this.responseUnkownError();
        }
    }
}
