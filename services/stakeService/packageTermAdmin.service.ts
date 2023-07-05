'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbPackageMixin, dbPackageTermMixin, eventsPackageMixin, eventsPackageTermMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	RestOptions,
	PackageTermAdminCreateParams,
	PackageTermAdminCreateParamsValidator,
	PackageTermAdminUpdateParams,
	PackageTermAdminUpdateParamsValidator
} from '../../types';
import { PackageTermEntity, IPackageTerm } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { CustomValidator } from '../../validators';
import moment from 'moment';
import { Types } from 'mongoose';
import { convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
@Service({
	name: 'admin.packageTerm',
	version: 1,
	mixins: [dbPackageTermMixin, eventsPackageTermMixin],
	settings: {
		rest: '/v1/admin/packageTerm',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'package_id',
			'title',
			'day_reward',
			'total_stake',
			'createdAt',
			'updatedAt',
		]
	}
})
export default class PackageTermAdminService extends MoleculerDBService<DbServiceSettings, IPackageTerm> {

	/**
	 *  @swagger
	 *
	 *  /v1/admin/packageTerm/list:
	 *    get:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: get list Package term
	 *      description: get list Package term
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
			let wallets: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			return this.responseSuccess(wallets);
		} catch (error) {
			this.logger.error("PackageAdminService - list", error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/packageTerm/create:
	 *    post:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: create Package term
	 *      description: create Package term
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
	 *              - title
	 *              - day_reward
	 *              - total_stake
	 *            properties:
	 *              title:
	 *                type: string
	 *                default: package
	 *              package_id:
	 *                type: string
	 *                default: 1234567890
	 *              day_reward:
	 *                type: integer
	 *                default: 0
	 *              total_stake:
	 *                type: integer
	 *                default: 0
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: create Package Term
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/create', {
		name: 'create',
		middleware: ['authAdmin'],
		cache: false
	})
	async create(ctx: Context<PackageTermAdminCreateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, PackageTermAdminCreateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const packageData = await ctx.call('v1.package.checkActive', { package_id: entity.package_id });
			if (!packageData) {
				return this.responseError('err_not_found', 'Package not found or not active.');
			}

			let entityPackageTerm: any = {
				package_id: Types.ObjectId(entity.package_id),
				title: entity.title,
				day_reward: entity.day_reward,
				total_stake: entity.total_stake,
			}

			const parsePackageTermEntity = new JsonConvert().deserializeObject(entityPackageTerm, PackageTermEntity).getMongoEntity()
			const packageCheck = await this._create(ctx, parsePackageTermEntity);
			return this.responseSuccessDataMessage("Create package term success", packageCheck);
		} catch (error) {
			this.logger.error('PackageTermAdminService - create:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/packageTerm/update:
	 *    put:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: update Package Term
	 *      description: update Package Term
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
	 *              - package_term_id
	 *              - title
	 *              - day_reward
	 *              - total_stake
	 *            properties:
	 *              title:
	 *                type: string
	 *                default: package
	 *              package_term_id:
	 *                type: string
	 *                default: 1234567890
	 *              package_id:
	 *                type: string
	 *                default: 1234567890
	 *              day_reward:
	 *                type: integer
	 *                default: 0
	 *              total_stake:
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
	async update(ctx: Context<PackageTermAdminUpdateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity: any = ctx.params;
			const validate = customValidator.validate(entity, PackageTermAdminUpdateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const packageData = await ctx.call('v1.package.checkActive', { package_id: entity.package_id });
			if (!packageData) {
				return this.responseError('err_not_found', 'Package not found or not active.');
			}

			const packageTerm = await this.adapter.findById(entity.package_term_id)
			if (!packageTerm) {
				return this.responseError('err_not_found', 'Package term not found.');
			}

			let entityUpdate: any = {
				updatedAt: moment().unix()
			}

			if (entity.title) {
				entityUpdate.title = entity.title;
			}

			if (entity.day_reward) {
				entityUpdate.day_reward = entity.day_reward;
			}

			if (entity.total_stake) {
				entityUpdate.total_stake = entity.total_stake;
			}

			const checkUpdate = await this.adapter.updateById(entity.package_term_id, { $set: entityUpdate });
			return this.responseSuccessDataMessage("Update package term success", checkUpdate);
		} catch (error) {
			this.logger.error('PackageTermAdminService - update:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/packageTerm/delete:
	 *    delete:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: delete Package Term
	 *      description: delete Package Term
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
	 *              - package_term_id
	 *              - package_id
	 *            properties:
	 *              package_term_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: package_term_id 
	 *              package_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: package_id 
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: delete package Term
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

			const packageTerm = await this.adapter.findById(entity.package_term_id)
			if (!packageTerm) {
				return this.responseError('err_not_found', 'Package term not found.');
			}

			let entityPackage: any = {
				deletedAt: moment().unix()
			};
			await this.adapter.updateById(entity.package_term_id, { $set: entityPackage });
			return this.responseSuccess({ message: 'Delete package term success' });
		} catch (error) {
			this.logger.error('PackageTermAdminService - delete:' + error)
			return this.responseUnkownError();
		}
	}
}
