'use strict';
import { Action, Method, Post, Get, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
    RestOptions, MoleculerDBService, actionTransaction, CustomerStatus, statusOrder,
    statusTransaction, paymentMethod, SettingTypes, TypeDeposit, TypeWithdraw, TypeCheckRate, SystemCommissionType,
    TypeTransfer
} from '../../types';
@Service({
    name: 'staticData',
    version: 1,
    settings: {
        rest: '/v1/staticData'
    },
})
export default class StaticDataService extends MoleculerDBService<any, any> {
    /**
    *  @swagger
    *
    *  /v1/staticData/data:
    *    get:
    *      tags:
    *      - "Static Data"
    *      summary: staticData
    *      description: staticData
    *      produces:
    *        - application/json
    *      consumes:
    *        - application/json
    *      responses:
    *        200:
    *          description: get staticData
    *        403:
    *          description: Server error
    */
    @Get<RestOptions>('/data', {
        name: 'data',
        cache: false,
    })
    async data() {
        try {
            return this.responseSuccess({
                CustomerStatus,
                statusTransaction,
                actionTransaction,
                paymentMethod,
                statusOrder,
                SettingTypes,
                TypeDeposit,
                TypeWithdraw,
                TypeCheckRate,
                SystemCommissionType,
                TypeTransfer
            })
        } catch (error) {
            this.logger.error("StaticDataService - list", error);
            return this.responseUnkownError();
        }
    }
}
