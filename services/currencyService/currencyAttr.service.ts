'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters } from 'moleculer-db';
import { dbCurrencyAttrMixin, eventsCurrencyAttrMixin } from '../../mixins/dbMixins';

import {
	MoleculerDBService,
	CurrenciesAttrServiceOptions,
	CurrenciesAttrServiceSettingsOptions,
	RestOptions,
	ParamFindCurrencyAttr
} from '../../types';
import { CurrencyAttrEntity, ICurrencyAttr } from '../../entities';

@Service<CurrenciesAttrServiceOptions>({
	name: 'currencyAttr',
	version: 1,
	mixins: [dbCurrencyAttrMixin, eventsCurrencyAttrMixin],
	settings: {
		idField: '_id',
		pageSize: 10,
		rest: '/v1/currencyAttr',
		fields: [
			'_id',
			'contract',
			'currency_id',
			'blockchain',
			'withdraw_fee_chain',
			'withdraw_fee_token',
			'withdraw_fee_token_type',
			'min_withdraw',
			'max_withdraw',
			'value_need_approve',
			'value_need_approve_currency',
			'max_amount_withdraw_daily',
			'max_amount_withdraw_daily_currency',
			'max_times_withdraw',
			'native_token',
			'createdAt',
			'updatedAt',
			'deletedAt',
		]
	},
})

export default class CurrencyAttrService extends MoleculerDBService<CurrenciesAttrServiceSettingsOptions, ICurrencyAttr> {

	/**
	 *  @swagger
	 *
	 *  /v1/currencyAttr/list:
	 *    get:
	 *      tags:
	 *      - "Currencies"
	 *      summary: get list currency
	 *      description: get list currency
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
	 *          description: get list currency
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/list', {
		name: 'list',
		cache: false
	})
	async list(ctx: Context<DbContextParameters>) {
		try {
			let params: any = ctx.params;
			const currency_id = params.currency_id

			if (currency_id == undefined) {
				return this.responseError('err_not_found', 'Currency not found');
			}

			const currency = await ctx.call('v1.currency.find', { currency_id: currency_id });
			if (currency == false) {
				return this.responseError('err_not_found', 'Currency not found');
			}

			const data = await this._find(ctx, { query: { currency_id, deletedAt: null } });
			return this.responseSuccess(data);
		} catch (error) {
			this.logger.error("CurrencyAttrService --list ", error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'find',
		cache: {
			keys: ['currency_id', 'chain_id'],
			ttl: 60 * 60
		}
	})
	async find(ctx: Context<ParamFindCurrencyAttr>) {
		try {
			const params = ctx.params;
			const attr: any = await this.adapter.findOne({ currency_id: params.currency_id.toString(), blockchain: params.chain_id.toString(), deletedAt: null });
			if (attr) {
				return attr;
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error currencyAttrService - find', e);
			return false;
		}
	}

	@Action({
		name: 'getByCurrency',
		cache: {
			keys: ['currency_id'],
			ttl: 60 * 60
		},
	})
	async getByCurrency(ctx: Context<ParamFindCurrencyAttr>) {
		try {
			const params = ctx.params;
			return await this.adapter.find({ query: { currency_id: params.currency_id.toString(), deletedAt: null } });
		} catch (e) {
			this.logger.error('Error currencyAttrService - getByCurrency', e);
			return false;
		}
	}

	@Action({
		name: 'getAll',
		cache: {
			keys: ['currencyAttrService', 'getAll'],
			ttl: 60 * 60
		},
	})
	async getAll(ctx: Context) {
		try {
			const attr: any = await this.adapter.find({ query: { deletedAt: null } });
			if (attr) {
				return attr;
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error currencyAttrService - getAll', e);
			return false;
		}
	}

	@Action({
		name: 'findByContract',
		cache: {
			keys: ['contract'],
			ttl: 60 * 60
		},
	})
	async findByContract(ctx: Context) {
		try {
			const params: any = ctx.params;
			const regex = new RegExp(["^", params.contract, "$"].join(""), "i");
			return await this.adapter.findOne({ deletedAt: null, contract: regex });
		} catch (e) {
			this.logger.error('Error currencyAttrService - findByContract', e);
			return false;
		}
	}

	@Action({
		name: 'findById',
		cache: {
			keys: ['id'],
			ttl: 60 * 60
		},
	})
	async findById(ctx: Context) {
		try {
			const params: any = ctx.params;
			const attr: ICurrencyAttr = await this.adapter.findById(params.id);
			if (attr && attr.deletedAt == null) {
				return attr;
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error currencyAttrService - findById', e);
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
			await this.adapter.updateById(params.id, { $set: params.entity });
			this.broker.cacher?.clean('*.currencyAttr.*');
			return true
		} catch (e) {
			this.logger.error('Error currencyAttrService - update', e);
			return false;
		}
	}

	@Action({
		name: 'getAllWithdrawOnChian',
		cache: {
			keys: ['blockchain'],
			ttl: 60 * 60
		},
	})
	async getAllWithdrawOnChian(ctx: Context) {
		try {
			const params: any = ctx.params;
			return await this.adapter.find({ query: { deletedAt: null, blockchain: params.blockchain } });
		} catch (e) {
			this.logger.error('Error currencyAttrService - getAllWithdrawOnChian', e);
			return false;
		}
	}
}
