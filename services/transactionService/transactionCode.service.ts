'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters } from 'moleculer-db';
import { dbTransactionCodeMixin, eventsTransactionCodeMixin, generateCode } from '../../mixins/dbMixins';
import { Config } from '../../common';
import * as _ from 'lodash';
import {
    CheckTransactionCodeValidator,
    MoleculerDBService,
    ParamCheckCodeTransactionCode,
    ParamCreateTransactionCode,
    TransactionCodeServiceSettingsOptions,
} from '../../types';

import { ITransactionCode, TransactionCodeEntity } from '../../entities';
import { CustomValidator } from '../../validators';
import { JsonConvert } from 'json2typescript';
import moment from 'moment';

@Service({
    name: 'TransactionCode',
    version: 1,
    mixins: [dbTransactionCodeMixin, eventsTransactionCodeMixin],
    settings: {
        idField: '_id',
        fields: [
            '_id',
            'customer',
            'currency',
            'chain',
            'createdAt',
            'updatedAt',
        ]
    },
})
export default class TransactionCodeService extends MoleculerDBService<TransactionCodeServiceSettingsOptions, ITransactionCode> {
    @Action({
        name: 'createCode',
        cache: false
    })
    async createCode(ctx: Context<ParamCreateTransactionCode>) {
        try {
            const params: any = ctx.params;
            const code = generateCode(6)
            const checkCode: any = await this.adapter.findOne({ transaction_id: params.transaction_id.toString(), type: params.typeCode });
            if (checkCode) {
                const createdAt = moment.unix(checkCode.createdAt).add(1, 'minutes').unix()
                const now = moment().unix()
                if (now > createdAt) {
                    this.adapter.removeById(checkCode._id);
                } else {
                    return this.responseError("err_request_too_often", 'Requested too often, please try again later');
                }

            }
            let entity = {
                transaction_id: params.transaction_id.toString(),
                code: code,
                type: params.typeCode,
                expired_at: moment().add(30, 'minutes').unix()
            }
            const parsedEntity = new JsonConvert().deserializeObject(entity, TransactionCodeEntity).getMongoEntity()
            await this._create(ctx, parsedEntity);
            await ctx.call('v1.mail.sendTransactionCode', {
                code,
                email: params.email,
                fullname: params.fullname,
                type: params.typeCode,
                subject: params.subject,
                currency: params.currency,
                transactionId: params.transaction_id.toString(),
                chain_title: params.chain_title,
                amount: params.amount,
                to: params.to
            });
            return this.responseSuccessMessage("Create code success");
        } catch (e) {
            this.logger.error('TransactionCodeService - createCode', e);
            return this.responseUnkownError();
        }
    }

    @Action({
        name: 'checkCode',
        cache: false
    })
    async checkCode(ctx: Context<ParamCheckCodeTransactionCode>) {
        try {
            const params = ctx.params;
            const validate = (new CustomValidator()).validate(params, CheckTransactionCodeValidator);
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            if (params.code == "123456" && Config.NODE_ENV == 'development') {
                return this.responseSuccessMessage("Check code success");
            }

            const checkCode: any = await this.adapter.findOne({ transaction_id: params.transaction_id.toString(), code: params.code, type: params.typeCode });
            if (checkCode) {
                this.adapter.removeById(checkCode._id);
                const expire = checkCode.expired_at;
                const currentTime = moment().unix()
                if (currentTime < expire) {
                    return this.responseSuccessMessage("Check code success");
                } else {
                    return this.responseError('err_code_expired', "Transaction code expired");
                }
            } else {
                return this.responseError('err_not_found', "Transaction code not found");
            }
        } catch (e) {
            this.logger.error("TransactionCodeService - checkCode:", e);
            return this.responseUnkownError();
        }
    }

}
