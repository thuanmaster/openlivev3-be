'use strict';
import { Context } from 'moleculer';
import { dbInvestPackageMixin, eventsInvestPackageMixin } from '../../mixins/dbMixins';
import { Action, Get, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { MoleculerDBService, RestOptions } from '../../types';
import { IInvestPackage } from '../../entities';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
@Service({
	name: 'investPackage',
	version: 1,
	mixins: [dbInvestPackageMixin, eventsInvestPackageMixin],
	settings: {
		rest: '/v1/investPackage',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'title',
			'description',
			'avatar',
			'video',
			'rare',
			'price_invest',
			'currency_invest',
			'currency_method_pay',
			'bonus_token',
			'currency_bonus_token',
			'dividend_rate',
			'meta_data',
			'status',
			'amount',
			'amount_type',
			'currency',
			'from_date',
			'to_date',
			'currency_buy',
			'createdAt',
			'updatedAt',
		],
	},
})
export default class InvestPackageService extends MoleculerDBService<
	DbServiceSettings,
	IInvestPackage
> {
	/**
	 *  @swagger
	 *
	 *  /v1/investPackage/list:
	 *    get:
	 *      tags:
	 *      - "InvestPackage"
	 *      summary: get list investPackage
	 *      description: get list investPackage
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
	 *        - name: status
	 *          description: status
	 *          in: query
	 *          required: false
	 *          type: boolean
	 *          example : true
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: get list investPackage
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/list', {
		name: 'list',
		cache: false,
	})
	async list(ctx: Context<DbContextParameters>) {
		try {
			let params: any = this.sanitizeParams(ctx, ctx.params);
			let query: any = {
				deletedAt: null,
			};

			if (params.status != undefined) {
				query.status = params.status == 'true' ? true : false;
			} else {
				query.status = true;
			}

			params.query = query;
			let packages: any = await this._list(ctx, { ...params, sort: { price_invest: 1 } });
			const dataPackages = packages.rows;
			let dataRows: any = [];
			for (let i = 0; i < dataPackages.length; i++) {
				let row: any = dataPackages[i];
				dataRows.push(row);
			}
			packages.rows = dataRows;
			return this.responseSuccess(packages);
		} catch (error) {
			this.logger.error('InvestPackageService - list', error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'findById',
		cache: {
			keys: ['invest_package_id'],
			ttl: 60 * 60,
		},
	})
	async findById(ctx: Context) {
		try {
			const params: any = ctx.params;
			const packageData: any = await this.adapter.findById(
				convertObjectId(params.invest_package_id.toString()),
			);
			if (packageData) {
				if (packageData.deletedAt != null) {
					return false;
				} else {
					return packageData;
				}
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error('InvestPackageService - findById', error);
			return false;
		}
	}
}
