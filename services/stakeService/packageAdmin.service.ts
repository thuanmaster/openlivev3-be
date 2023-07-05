'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbPackageMixin, eventsPackageMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	RestOptions,
	PackageAdminCreateParams,
	PackageAdminCreateParamsValidator,
	PackageAdminUpdateParams,
	PackageAdminUpdateParamsValidator
} from '../../types';
import { PackageEntity, IPackage } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { CustomValidator } from '../../validators';
import moment from 'moment';
import { Types } from 'mongoose';
import { convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
@Service({
	name: 'admin.package',
	version: 1,
	mixins: [dbPackageMixin, eventsPackageMixin],
	settings: {
		rest: '/v1/admin/package',
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
		]
	}
})
export default class PackageAdminService extends MoleculerDBService<DbServiceSettings, IPackage> {

	/**
	 *  @swagger
	 *
	 *  /v1/admin/package/list:
	 *    get:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: get list Package
	 *      description: get list Package
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
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
		middleware: ['authAdmin'],
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
			return this.responseSuccess(packages);
		} catch (error) {
			this.logger.error("PackageAdminService - list", error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/package/create:
	 *    post:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: create Package
	 *      description: create Package
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
	 *              - currency_stake_id
	 *              - title
	 *              - min_stake
	 *              - max_stake
	 *              - description
	 *              - type
	 *              - start_date
	 *              - end_date
	 *            properties:
	 *              title:
	 *                type: string
	 *                default: package
	 *              currency_stake_id:
	 *                type: string
	 *                default: 1234567890
	 *              min_stake:
	 *                type: integer
	 *                default: 0
	 *              max_stake:
	 *                type: integer
	 *                default: 0
	 *              start_date:
	 *                type: integer
	 *                default: 0
	 *              end_date:
	 *                type: integer
	 *                default: 0
	 *              description:
	 *                type: string
	 *                default: description
	 *              type:
	 *                type: string
	 *                default: LOCKED
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: create Package
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/create', {
		name: 'create',
		middleware: ['authAdmin'],
		cache: false
	})
	async create(ctx: Context<PackageAdminCreateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, PackageAdminCreateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const currency = await ctx.call('v1.currency.find', { currency_id: entity.currency_stake_id })
			if (!currency) {
				return this.responseError('err_not_found', 'Currency not found.');
			}

			let entityPackage: any = {
				currency_stake_id: Types.ObjectId(entity.currency_stake_id),
				title: entity.title,
				min_stake: entity.min_stake,
				max_stake: entity.max_stake,
				description: entity.description,
				type: entity.type,
				start_date: entity.start_date,
				end_date: entity.end_date,
				status: true
			}

			const parsePackageEntity = new JsonConvert().deserializeObject(entityPackage, PackageEntity).getMongoEntity()
			const packageCheck = await this._create(ctx, parsePackageEntity);
			return this.responseSuccessDataMessage("Create package success", packageCheck);
		} catch (error) {
			this.logger.error('PackageAdminService - create:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/package/update:
	 *    put:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: update Package
	 *      description: update Package
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
	 *              - currency_stake_id
	 *              - title
	 *              - min_stake
	 *              - max_stake
	 *              - description
	 *              - type
	 *              - start_date
	 *              - end_date
	 *            properties:
	 *              title:
	 *                type: string
	 *                default: package
	 *              package_id:
	 *                type: string
	 *                default: 1234567890
	 *              currency_stake_id:
	 *                type: string
	 *                default: 1234567890
	 *              min_stake:
	 *                type: integer
	 *                default: 0
	 *              max_stake:
	 *                type: integer
	 *                default: 0
	 *              start_date:
	 *                type: integer
	 *                default: 0
	 *              end_date:
	 *                type: integer
	 *                default: 0
	 *              description:
	 *                type: string
	 *                default: description
	 *              type:
	 *                type: string
	 *                default: LOCKED
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: update Package
	 *        403:
	 *          description: Server error
	 */
	@Put<RestOptions>('/update', {
		name: 'update',
		middleware: ['authAdmin'],
		cache: false
	})
	async update(ctx: Context<PackageAdminUpdateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity: any = ctx.params;
			const validate = customValidator.validate(entity, PackageAdminUpdateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const packageData = await ctx.call('v1.package.checkActive', { package_id: entity.package_id });
			if (!packageData) {
				return this.responseError('err_not_found', 'Package not found or not active.');
			}

			let entityUpdate: any = {
				updatedAt: moment().unix()
			}
			if (entity.title) {
				entityUpdate.title = entity.title;
			}

			if (entity.currency_stake_id) {
				const currency = await ctx.call('v1.currency.find', { currency_id: entity.currency_stake_id })
				if (currency) {
					entityUpdate.currency_stake_id = Types.ObjectId(entity.currency_stake_id);
				} else {
					return this.responseError('err_not_found', 'Currency not found.');
				}
			}

			if (entity.min_stake) {
				entityUpdate.min_stake = entity.min_stake;
			}
			if (entity.max_stake) {
				entityUpdate.max_stake = entity.max_stake;
			}
			if (entity.description) {
				entityUpdate.description = entity.description;
			}
			if (entity.type) {
				entityUpdate.title = entity.type;
			}
			if (entity.start_date) {
				entityUpdate.start_date = entity.start_date;
			}
			if (entity.end_date) {
				entityUpdate.end_date = entity.end_date;
			}
			if (entity.status) {
				entityUpdate.status = entity.status;
			}

			const checkUpdate = await this.adapter.updateById(entity.package_id, { $set: entityUpdate });
			this.broker.cacher?.clean("*.package.findById:" + entity.package_id);
			return this.responseSuccessDataMessage("Update package success", checkUpdate);
		} catch (error) {
			this.logger.error('PackageAdminService - update:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/package/delete:
	 *    delete:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: delete Package
	 *      description: delete Package
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
	 *            properties:
	 *              package_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: package_id 
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: delete package
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

			let entityPackage: any = {
				deletedAt: moment().unix()
			};
			await this.adapter.updateById(entity.package_id, { $set: entityPackage });
			this.broker.cacher?.clean("*.package.findById:" + entity.package_id);
			return this.responseSuccess({ message: 'Delete package success' });
		} catch (error) {
			this.logger.error('PackageAdminService - delete:' + error)
			return this.responseUnkownError();
		}
	}
}
