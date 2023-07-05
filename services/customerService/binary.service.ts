'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Get, Method, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbBinaryMixin, eventsBinaryMixin } from '../../mixins/dbMixins';
import { BinarysServiceSettingsOptions, MoleculerDBService, RestOptions, SettingTypes } from '../../types';
import { BinaryEntity, IBinary } from '../../entities';
import { JsonConvert } from 'json2typescript';
import _ from 'lodash';
import moment from 'moment';

@Service({
    name: 'binary',
    version: 1,
    mixins: [dbBinaryMixin, eventsBinaryMixin],
    settings: {
        idField: '_id',
        pageSize: 10,
        rest: '/v1/binary',
        fields: [
            '_id',
            'createdAt',
            'updatedAt'
        ]
    }
})
export default class BinaryService extends MoleculerDBService<BinarysServiceSettingsOptions, IBinary> {

    @Action({
        name: 'createBinary',
        cache: false
    })
    async createBinary(ctx: Context) {
        try {
            let params: any = ctx.params;
            const topBinarySponsor: string = await this.broker.call("v1.setting.getByKey", { key: SettingTypes.TOP_BINARY_SPONSOR });
            if (topBinarySponsor == null) {
                return false;
            }
            let lastBinary: any = await this.adapter.find({ sort: { createdAt: -1 }, limit: 1 });
            const customer_id = params.customer_id
            if (topBinarySponsor == customer_id) {
                return false;
            }

            if (lastBinary.length == 0) {
                let entity = {
                    main_id: topBinarySponsor,
                    node_main: 1,
                    left: customer_id,
                    node_left: 2,
                }
                const parsedCustomerTokenEntity = new JsonConvert().deserializeObject(entity, BinaryEntity).getMongoEntity()
                await this._create(ctx, parsedCustomerTokenEntity);
            } else {
                lastBinary = lastBinary[0]
                if (lastBinary.right == "") {
                    let entityUpdate = {
                        right: customer_id,
                        node_right: lastBinary.node_left + 1,
                        updatedAt: moment().unix()
                    }
                    await this.adapter.updateById(lastBinary._id, { $set: entityUpdate })
                } else {
                    const node_main = lastBinary.node_main + 1
                    const newMainBinary = await this.adapter.findOne({ $or: [{ node_right: node_main }, { node_left: node_main }] })
                    let newMain = newMainBinary.left
                    if (newMainBinary.node_right == node_main) {
                        newMain = newMainBinary.right
                    }
                    let entity = {
                        main_id: newMain,
                        node_main: node_main,
                        left: customer_id,
                        node_left: lastBinary.node_right + 1
                    }
                    const parsedCustomerTokenEntity = new JsonConvert().deserializeObject(entity, BinaryEntity).getMongoEntity()
                    await this._create(ctx, parsedCustomerTokenEntity);
                }
            }

            return true;
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'getParentCustomer',
        cache: false
    })
    async getParentCustomer(ctx: Context) {
        try {
            const params: any = ctx.params
            const newMainBinary: any = await this.adapter.findOne({ $or: [{ right: params.customer_id }, { left: params.customer_id }] })
            let dataReturn = []
            if (newMainBinary) {
                const listBinary: any = await this.adapter.find({ query: { node_main: { $lte: newMainBinary.node_main } } })
                const dataCustomers = await this.recursiveBinary(listBinary, params.customer_id, 1, [])
                for (let i = 0; i < dataCustomers.length; i++) {
                    const dataCustomer = dataCustomers[i]
                    let customer: any = await ctx.call('v1.customer.findById', { customer_id: dataCustomer.customer_id });
                    customer.level = dataCustomer.level;
                    dataReturn.push(customer)
                }
            }
            return dataReturn;
        } catch (error) {
            this.logger.error("BinaryService getParentCustomer:", error);
            return false;
        }
    }

    @Method
    async recursiveBinary(listBinary: any, customer_id: string, level: number, data: any) {
        const newMainBinary: any = _.find(listBinary, (o) => { return o.right == customer_id || o.left == customer_id; });
        if (newMainBinary) {
            data.push({ customer_id: newMainBinary.main_id, level })
            await this.recursiveBinary(listBinary, newMainBinary.main_id, level + 1, data);
        }
        return data;
    }

    /**
     *  @swagger
     *
     *  /v1/binary/getListF1:
     *    get:
     *      tags:
     *      - "Customers"
     *      summary: get List F1 Customer
     *      description: get List F1 Customer
     *      security:
     *        - Bearer: []
     *      produces:
     *        - application/json
     *      parameters:
     *        - name: customer_id
     *          description: customer_id
     *          in: query
     *          required: false
     *          type: string 
     *      consumes:
     *        - application/json
     *      responses:
     *        200:
     *          description: get List F1 Customer
     *        403:
     *          description: Server error
     */
    @Get<RestOptions>('/getListF1', {
        name: 'getListF1',
        middleware: ['auth'],
        cache: false
    })
    async getListF1(ctx: Context<string, Record<string, any>>) {
        try {
            const params: any = ctx.params
            const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            if (!customer) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }

            let customer_id = customer._id.toString()
            if (params.customer_id != "" && params.customer_id != null && params.customer_id != undefined) {
                customer_id = params.customer_id
            }

            const main: IBinary = await this.adapter.findOne({ main_id: customer_id });
            let data = [
                { id: null, email: null, level_commission: null, hasChildrent: false, type: 'left' },
                { id: null, email: null, level_commission: null, hasChildrent: false, type: "right" }
            ];
            if (main) {
                if (main.left != "") {
                    const customer: any = await ctx.call('v1.customer.findById', { customer_id: main.left });
                    if (customer) {
                        const checkHasChild: IBinary = await this.adapter.findOne({ main_id: main.left });
                        data[0] = {
                            id: customer._id, email: customer.email, level_commission: customer.level_commission, hasChildrent: checkHasChild ? true : false, type: 'left'
                        }
                    }
                }

                if (main.right != "") {
                    const customer: any = await ctx.call('v1.customer.findById', { customer_id: main.right });
                    if (customer) {
                        const checkHasChild: IBinary = await this.adapter.findOne({ main_id: main.right });
                        data[1] = {
                            id: customer._id, email: customer.email, level_commission: customer.level_commission, hasChildrent: checkHasChild ? true : false, type: 'right'
                        }
                    }
                }
            }

            return this.responseSuccess(data);
        } catch (error) {
            this.logger.error('BinaryService - getListF1:' + error)
            return this.responseUnkownError();
        }
    }
}
