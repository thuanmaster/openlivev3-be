'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Post, Service, Event, Get } from '@ourparentcenter/moleculer-decorators-extended';
import { dbCustomerHistoryMixin, eventsCustomerHistoryMixin, generateCode } from '../../mixins/dbMixins';
import { CustomerHistoryEntity, ICustomerHistory } from '../../entities';
import { CustomerHistorysServiceSettingsOptions, MoleculerDBService, ParamCheckCustomerHistory, RestOptions, } from '../../types';
import { JsonConvert } from 'json2typescript';
import { DbContextParameters } from 'moleculer-db';

@Service({
    name: 'customerHistory',
    version: 1,
    mixins: [dbCustomerHistoryMixin, eventsCustomerHistoryMixin],
    settings: {
        idField: '_id',
        pageSize: 10,
        rest: '/v1/customerHistory',
        fields: [
            '_id',
            'ip',
            'os',
            'device_id',
            'last_login',
            'createdAt',
            'updatedAt',
        ]
    },
})

export default class CustomerHistoryService extends MoleculerDBService<CustomerHistorysServiceSettingsOptions, ICustomerHistory> {
    @Event({
        name: 'customerHistory.create'
    })
    async create(ctx: Context) {
        try {
            const params: any = ctx.params;
            const entity = { customer_id: params.customer_id.toString(), device_id: params.device_id, os: params.os, ip: params.ip, action: params.action }
            const parsedEntity = new JsonConvert().deserializeObject(entity, CustomerHistoryEntity).getMongoEntity()
            await this._create(ctx, parsedEntity);
            return true;
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    /**
      *  @swagger
      *
      *  /v1/customerHistory/list:
      *    get:
      *      tags:
      *      - "Customers"
      *      summary: get list history customer
      *      description: get list history customer
      *      produces:
      *        - application/json
      *      consumes:
      *        - application/json
      *      security:
      *        - Bearer: [] 
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
      *      responses:
      *        200:
      *          description: get list history customer
      *        403:
      *          description: Server error
      */
    @Get<RestOptions>('/list', {
        name: 'list',
        middleware: ['auth'],
        cache: false
    })
    async list(ctx: Context<DbContextParameters>) {
        try {
            let params: any = this.sanitizeParams(ctx, ctx.params);
            let customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }
            params.query = { customer_id: customer._id.toString() };
            const data = await this._list(ctx, params);
            return this.responseSuccess(data);
        } catch (e) {
            this.logger.error(e);
            return this.responseUnkownError()
        }
    }
}
