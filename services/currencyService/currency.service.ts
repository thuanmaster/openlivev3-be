'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters } from 'moleculer-db';
import { dbCurrencyMixin, eventsCurrencyMixin } from '../../mixins/dbMixins';
import {
	MoleculerDBService,
	RestOptions,
	CurrenciesServiceOptions,
	CurrenciesServiceSettingsOptions
} from '../../types';
import { convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
import { ICurrency } from '../../entities';
import axios from 'axios';
import { log } from 'console';
@Service<CurrenciesServiceOptions>({
	name: 'currency',
	version: 1,
	mixins: [dbCurrencyMixin, eventsCurrencyMixin],
	settings: {
		idField: '_id',
		pageSize: 10,
		rest: '/v1/currency',
		fields: [
			'_id',
			'code',
			'title',
			'type',
			'usd_rate',
			'icon',
			'swap_enable',
			'swap_fee',
			'transfer_fee',
			'swap_fee_type',
			'min_swap',
			'max_swap',
		],
		populates: {
			attributes: {
				action: 'v1.currencyAttr.id',
				fields: '_id'
			}
		},
	},
})
export default class CurrencyService extends MoleculerDBService<CurrenciesServiceSettingsOptions, ICurrency> {
	/**
	 *  @swagger
	 *
	 *  /v1/currency/list:
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
		cache: false
	})
	async list(ctx: Context<DbContextParameters>) {
		try {
			let params: any = this.sanitizeParams(ctx, ctx.params);
			let query: any = {
				active: true
			}
			if (params.code != undefined) {
				query.code = params.code
			}
			params.query = query
			const data = await this._find(ctx, params);
			return this.responseSuccess(data);
		} catch (error) {
			this.logger.error("CurrencyService --list ", error);
			return this.responseUnkownError();
		}
	}


	@Action({
		name: 'find',
		cache: {
			keys: ['currency_id'],
			ttl: 60 * 60
		},
	})
	async find(ctx: Context) {
		try {
			const params: any = ctx.params
			let currency_id = convertObjectId(params.currency_id.toString());
			const currency: any = await this.adapter.findById(currency_id);
			if (currency && currency.active == true) {
				return currency;
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('CurrencyService - find', e);
			return false;
		}
	}

	@Action({
		name: 'findByCode',
		cache: {
			keys: ['code'],
			ttl: 60 * 60
		},
	})
	async findByCode(ctx: Context) {
		try {
			const params: any = ctx.params;
			const currency: any = await this.adapter.findOne({ code: params.code, active: true });
			if (currency) {
				return currency;
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error CurrencyService - findByCode', e);
			return false;
		}
	}

	@Action({
		name: 'getCurrencyRate',
		cache: false
	})
	async getCurrencyRate(ctx: Context) {
		try {
			return await this.adapter.find({ query: { link_rate: { $ne: null }, active: true } });
		} catch (e) {
			this.logger.error('Error CurrencyService - getCurrencyRate', e);
			return false;
		}
	}

	@Action({
		name: 'getAll',
		cache: false
	})
	async getAll(ctx: Context) {
		try {
			return await this.adapter.find({ query: { code: { $ne: null }, active: true } });
		} catch (e) {
			this.logger.error('Error CurrencyService - getAll', e);
			return false;
		}
	}

	@Action({
		name: 'updateRate',
		cache: false
	})
	async updateRate(ctx: Context) {
		try {
			const params: any = ctx.params;
			const currency: ICurrency = await this.adapter.findById(params.id);
			if (currency) {
				let rate = +params.rate;
				if (currency.factor_rate > 0) {
					rate = rate * currency.factor_rate
				}
				await this.adapter.updateById(params.id, { $set: { usd_rate: rate } });
				this.broker.cacher?.clean('*.currency.**')
			}
			return true
		} catch (e) {
			this.logger.error('Error CurrencyService - updateRate', e);
			return false;
		}
	}
	@Action({
		name: 'testRate',
		cache: false
	})
	async testRate(ctx: Context) {
		const price = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?slug=openlive-nft', {
			headers: {
				'X-CMC_PRO_API_KEY': '72867771-a2ea-44b6-ae97-68281f28942c',
			},
		})
		const a:any = Object.values(price?.data?.data)?.[0]

		log(a.quote.USD.price)
		
		return true
	}
}
