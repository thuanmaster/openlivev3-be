'use strict';
import { Context } from 'moleculer';
import { Action, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbTransactionTempMixin, eventsTransactionTempMixin } from '../../mixins/dbMixins';
import {
    MoleculerDBService,
    statusTransaction,
    TransactionTempServiceOptions,
    TransactionTempServiceSettingsOptions
} from '../../types';

import { ITransactionTemp, TransactionTempEntity } from '../../entities';
import { JsonConvert } from 'json2typescript';
@Service<TransactionTempServiceOptions>({
    name: 'TransactionTemp',
    version: 1,
    mixins: [dbTransactionTempMixin, eventsTransactionTempMixin],
    settings: {
        idField: '_id',
        pageSize: 10,
        fields: [
            '_id',
            'createdAt',
            'action'
        ]
    },
})
export default class TransactionTempService extends MoleculerDBService<TransactionTempServiceSettingsOptions, ITransactionTemp> {

    @Action({
        name: 'create',
        cache: false
    })
    async create(ctx: Context) {
        try {
            const params: any = ctx.params;
            const parsedTransactionEntity = new JsonConvert().deserializeObject(params, TransactionTempEntity).getMongoEntity()
            await this._create(ctx, parsedTransactionEntity);
            return true;
        } catch (error) {
            this.logger.error("transactionService - createTransaction:", error)
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
            const transaction = await this.adapter.findOne({ txhash: params.txhash });
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
        name: 'getTransactionProcess',
        cache: false
    })
    async getTransactionProcess(ctx: Context) {
        try {
            const transaction = await this._find(ctx, { query: { status: { $in: [statusTransaction.CREATED, statusTransaction.ACCEPTED] } }, sort: { createdAt: 1 }, limit: 20 });
            if (transaction) {
                return transaction;
            } else {
                return false;
            }
        } catch (error) {
            this.logger.error("transactionService - getTransactionProcess", error)
            return false;
        }
    }

    @Action({
        name: 'find',
        cache: false
    })
    async find(ctx: Context) {
        try {
            const params: any = ctx.params;
            return await this.adapter.findById(params.id);
        } catch (error) {
            this.logger.error("transactionService - find", error)
            return false;
        }
    }
    @Action({
        name: 'findByCode',
        cache: false
    })
    async findByCode(ctx: Context) {
        try {
            const params: any = ctx.params;
            return await this.adapter.findOne({ txhash: params.code, status: params.status });
        } catch (error) {
            this.logger.error("transactionService - findByCode", error)
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
            return await this.adapter.findOne(params);
        } catch (error) {
            this.logger.error("transactionService - params", error)
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
                return this._update(ctx, { _id: transaction._id, status: statusTransaction.COMPLETED });
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
            const transaction: any = await this._get(ctx, { id: params.transactionId });
            if (transaction) {
                return this._update(ctx, { _id: transaction._id, status: statusTransaction.ACCEPTED });
            } else {
                this.logger.error("transactionService - complete - transaction not found", params)
                return false;
            }
        } catch (error) {
            this.logger.error("transactionService - complete", error)
            return false;
        }
    }

}
