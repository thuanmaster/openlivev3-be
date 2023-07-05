'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbCommissionMixin, eventsCommissionMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	RestOptions,
	CommissionAdminCreateParams,
	CommissionAdminCreateParamsValidator,
	CommissionAdminUpdateParams,
	CommissionAdminUpdateParamsValidator
} from '../../types';
import { CommissionEntity, ICommission } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { CustomValidator } from '../../validators';
import moment from 'moment';
import { Types } from 'mongoose';
import { convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
@Service({
	name: 'admin.commission',
	version: 1,
	mixins: [dbCommissionMixin, eventsCommissionMixin],
	settings: {
		rest: '/v1/admin/commission',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'package_id',
			'level',
			'currency_id',
			'commission',
			'type',
			'createdAt',
			'updatedAt',
		]
	}
})

export default class CommissionAdminService extends MoleculerDBService<DbServiceSettings, ICommission> {

	/**
	 *  @swagger
	 *
	 *  /v1/admin/commission/list:
	 *    get:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: get list commission
	 *      description: get list commission
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: package_id
	 *          description: package id
	 *          in: query
	 *          required: false
	 *          type: string
	 *      security:
	 *        - Bearer: [] 
	 *      responses:
	 *        200:
	 *          description: get list Package term
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/list', {
		name: 'list',
		middleware: ['authAdmin'],
		cache: false,
	})
	async list(ctx: Context<DbContextParameters>) {
		try {

			let params: any = this.sanitizeParams(ctx, ctx.params);
			let query: any = {
				deletedAt: null
			}

			if (params.package_id != undefined) {
				query.package_id = convertObjectId(params.package_id)
			}

			params.query = query
			let commissions: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			return this.responseSuccess(commissions);
		} catch (error) {
			this.logger.error("CommissionAdminService - list", error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/commission/create:
	 *    post:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: create commission
	 *      description: create commission
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - package_id
	 *              - level
	 *              - currency_id
	 *              - commission
	 *              - type
	 *            properties:
	 *              package_id:
	 *                type: string
	 *                default: 1234567890
	 *              currency_id:
	 *                type: string
	 *                default: 1234567890
	 *              level:
	 *                type: integer
	 *                default: 1
	 *              commission:
	 *                type: integer
	 *                default: 1
	 *              type:
	 *                type: integer
	 *                default: 0
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: create commission
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/create', {
		name: 'create',
		middleware: ['authAdmin'],
		cache: false
	})
	async create(ctx: Context<CommissionAdminCreateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, CommissionAdminCreateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const packageData = await ctx.call('v1.package.checkActive', { package_id: entity.package_id });
			if (!packageData) {
				return this.responseError('err_not_found', 'Package not found or not active.');
			}

			const currency = await ctx.call('v1.currency.find', { currency_id: entity.currency_id })
			if (!currency) {
				return this.responseError('err_not_found', 'Currency not found.');
			}

			let entityCommission: any = {
				package_id: convertObjectId(entity.package_id),
				level: entity.level,
				currency_id: convertObjectId(entity.currency_id),
				commission: entity.commission,
				type: entity.type,
			}

			const parseCommissionEntity = new JsonConvert().deserializeObject(entityCommission, CommissionEntity).getMongoEntity()
			const packageCheck = await this._create(ctx, parseCommissionEntity);
			return this.responseSuccessDataMessage("Create commission success", packageCheck);
		} catch (error) {
			this.logger.error('commissionAdminService - create:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/commission/update:
	 *    put:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: update commission
	 *      description: update commission
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - commission_id
	 *            properties:
	 *              commission_id:
	 *                type: string
	 *                default: 1234567890
	 *              package_id:
	 *                type: string
	 *                default: 1234567890
	 *              currency_id:
	 *                type: string
	 *                default: 1234567890
	 *              level:
	 *                type: integer
	 *                default: 1
	 *              commission:
	 *                type: integer
	 *                default: 1
	 *              type:
	 *                type: integer
	 *                default: 0
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: update Package Term
	 *        403:
	 *          description: Server error
	 */
	@Put<RestOptions>('/update', {
		name: 'update',
		middleware: ['authAdmin'],
		cache: false
	})
	async update(ctx: Context<CommissionAdminUpdateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity: any = ctx.params;
			const validate = customValidator.validate(entity, CommissionAdminUpdateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const packageData = await ctx.call('v1.package.checkActive', { package_id: entity.package_id });
			if (!packageData) {
				return this.responseError('err_not_found', 'Package not found or not active.');
			}

			const commission = await this.adapter.findById(entity.commission_id)
			if (!commission) {
				return this.responseError('err_not_found', 'Commission not found.');
			}

			let entityUpdate: any = {
				updatedAt: moment().unix()
			}

			if (entity.package_id) {
				entityUpdate.package_id = convertObjectId(entity.package_id);
			}

			if (entity.currency_id) {
				const currency = await ctx.call('v1.currency.find', { currency_id: entity.currency_id })
				if (currency) {
					entityUpdate.currency_id = convertObjectId(entity.currency_id);
				} else {
					return this.responseError('err_not_found', 'Currency not found.');
				}
			}

			if (entity.level) {
				entityUpdate.level = entity.level;
			}

			if (entity.commission) {
				entityUpdate.commission = entity.commission;
			}

			if (entity.type) {
				entityUpdate.type = entity.type;
			}

			const checkUpdate = await this.adapter.updateById(entity.commission_id, { $set: entityUpdate });
			return this.responseSuccessDataMessage("Update commission success", checkUpdate);
		} catch (error) {
			this.logger.error('CommissionAdminService - update:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/commission/delete:
	 *    delete:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: delete commission
	 *      description: delete commission
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - commission_id
	 *              - package_id
	 *            properties:
	 *              commission_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: commission_id 
	 *              package_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: package_id 
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: delete commission
	 *        403:
	 *          description: Server error
	 */
	@Delete<RestOptions>('/delete', {
		name: 'delete',
		middleware: ['authAdmin'],
		cache: false
	})
	async delete(ctx: Context) {
		try {
			const entity: any = ctx.params;
			const packageData = await ctx.call('v1.package.checkActive', { package_id: entity.package_id });
			if (!packageData) {
				return this.responseError('err_not_found', 'Package not found or not active.');
			}

			const commission = await this.adapter.findById(entity.commission_id)
			if (!commission) {
				return this.responseError('err_not_found', 'Commission not found.');
			}

			let entityPackage: any = {
				deletedAt: moment().unix()
			};
			await this.adapter.updateById(entity.commission_id, { $set: entityPackage });
			return this.responseSuccess({ message: 'Delete commission success' });
		} catch (error) {
			this.logger.error('CommissionAdminService - delete:' + error)
			return this.responseUnkownError();
		}
	}
}
