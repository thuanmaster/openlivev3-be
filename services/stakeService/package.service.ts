'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbPackageMixin, eventsPackageMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	RestOptions,
} from '../../types';
import { IPackage} from '../../entities';

import { DbContextParameters, DbServiceSettings } from 'moleculer-db';

import moment from 'moment';
import { convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
@Service({
	name: 'package',
	version: 1,
	mixins: [dbPackageMixin, eventsPackageMixin],
	settings: {
		rest: '/v1/package',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'currency_stake_id',
			'title',
			'min_stake',
			'max_stake',
			'description',
			'type',
			'start_date',
			'end_date',
			'status',
			'createdAt',
			'updatedAt',
		],
		scopes: {
			notDeleted: {
				deletedAt: { $exists: false }
			},
		},
		defaultScopes: ["notDeleted"]
	}
})
export default class PackageService extends MoleculerDBService<DbServiceSettings, IPackage> {
	/**
	 *  @swagger
	 *
	 *  /v1/package/list:
	 *    get:
	 *      tags:
	 *      - "Package"
	 *      summary: get list Package
	 *      description: get list Package
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
	 *        - name: currency_stake_id
	 *          description: currency stake id
	 *          in: query
	 *          required: false
	 *          type: string
	 *        - name: start_date
	 *          description: start_date
	 *          in: query
	 *          required: false
	 *          type: integer
	 *          example : 1111111 
	 *        - name: end_date
	 *          description: end_date
	 *          in: query
	 *          required: false
	 *          type: integer
	 *          example : 1111111 
	 *        - name: status
	 *          description: status
	 *          in: query
	 *          required: false
	 *          type: boolean
	 *          example : true 
	 *        - name: type
	 *          description: type
	 *          in: query
	 *          required: false
	 *          type: string
	 *          example : LOCKED,FLEXIBLE
	 *      security:
	 *        - Bearer: [] 
	 *      responses:
	 *        200:
	 *          description: get list Package
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/list', {
		name: 'list',
		middleware: ['auth'],
		cache: false,
	})
	async list(ctx: Context<DbContextParameters>) {
		try {

			let params: any = this.sanitizeParams(ctx, ctx.params);
			let query: any = {
				deletedAt: null
			}

			if (params.currency_stake_id != undefined) {
				query.currency_stake_id = convertObjectId(params.currency_stake_id);
			}

			if (params.type != undefined) {
				query.type = params.type;
			}

			if (params.start_date != undefined) {
				query.start_date = { $gte: +params.start_date };
			}

			if (params.end_date != undefined) {
				query.end_date = { $lt: +params.end_date };
			}

			if (params.status != undefined) {
				query.status = params.status == "true" ? true : false;
			} else {
				query.status = true;
			}
			
			params.query = query
			let packages: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			const dataPackages = packages.rows;
			let dataRows: any = [];
			for (let i = 0; i < dataPackages.length; i++) {
				let row: any = dataPackages[i];
				let dataTerms: any = await ctx.call('v1.packageTerm.findByPackageId', { package_id: row._id });
				let currency: any = await ctx.call('v1.currency.find', { currency_id: row.currency_stake_id });
				if (currency) {
					delete currency.link_rate;
				}
				let terms: any = []
				for (let k = 0; k < dataTerms.length; k++) {
					let dataTerm = dataTerms[k]
					const rewards = await ctx.call('v1.reward.getRewardByTerm', { package_id: row._id, term_id: dataTerm._id.toString() })
					dataTerm.rewards = rewards;
					terms.push(dataTerm)
				}

				row.currency_stake = currency;
				row.terms = terms;
				dataRows.push(row)
			}
			packages.rows = dataRows;
			return this.responseSuccess(packages);
		} catch (error) {
			this.logger.error("PackageService - list", error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'checkActive',
		cache: false
	})
	async checkActive(ctx: Context): Promise<boolean> {
		try {
			const params: any = ctx.params;
			const packageData: any = await this.adapter.findById(params.package_id);
			if (packageData) {
				if (packageData.status == true) {
					const now = moment().unix();
					if (packageData.start_date > now) {
						return true
					} else {
						return false;
					}
				} else {
					return false;
				}
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error('PackageService - checkActive:', error)
			return false
		}
	}

	@Action({
		name: 'findByParam',
		cache: false
	})
	async findByParam(ctx: Context): Promise<IPackage | boolean> {
		try {
			const params: any = ctx.params;
			const packageData: IPackage = await this.adapter.findOne(params);
			if (packageData) {
				return packageData;
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error('PackageService - checkActive:', error)
			return false
		}
	}
	
	@Action({
		name: 'findById',
		cache: {
			keys: ['id'],
			ttl: 60 * 60
		},
	})
	async findById(ctx: Context): Promise<IPackage | boolean> {
		try {
			const params: any = ctx.params;
			const packageData: IPackage = await this.adapter.findById(params.id);
			if (packageData) {
				return packageData;
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error('PackageService - findById:', error)
			return false
		}
	}
}
