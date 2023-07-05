'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbPackageMixin, dbRewardMixin, eventsPackageMixin, eventsRewardMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	RestOptions,
	RewardAdminCreateParams,
	RewardAdminCreateParamsValidator,
	RewardAdminUpdateParams,
	RewardAdminUpdateParamsValidator
} from '../../types';
import { RewardEntity, IReward, ICurrency } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { CustomValidator } from '../../validators';
import moment from 'moment';
import { Types } from 'mongoose';
import { convertObjectId } from '../../mixins/dbMixins/helpers.mixin';

@Service({
	name: 'admin.reward',
	version: 1,
	mixins: [dbRewardMixin, eventsRewardMixin],
	settings: {
		rest: '/v1/admin/reward',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'package_id',
			'term_id',
			'currency_reward_id',
			'apr_reward',
			'createdAt',
			'updatedAt',
		]
	}
})
export default class RewardAdminService extends MoleculerDBService<DbServiceSettings, IReward> {

	/**
	 *  @swagger
	 *
	 *  /v1/admin/reward/list:
	 *    get:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: get list Package reward
	 *      description: get list Package reward
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
	 *        - name: term_id
	 *          description: term id
	 *          in: query
	 *          required: false
	 *          type: string
	 *      security:
	 *        - Bearer: [] 
	 *      responses:
	 *        200:
	 *          description: get list Package reward
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
				query.package_id = convertObjectId(params.package_id);
			}

			if (params.term_id != undefined) {
				query.term_id = convertObjectId(params.term_id);
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
	 *  /v1/admin/reward/create:
	 *    post:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: create Package reward
	 *      description: create Package reward
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
	 *              - term_id
	 *              - currency_reward_id
	 *              - apr_reward
	 *            properties:
	 *              package_id:
	 *                type: string
	 *                default: 1234567890
	 *              term_id:
	 *                type: string
	 *                default: 1234567890
	 *              currency_reward_id:
	 *                type: string
	 *                default: 1234567890
	 *              apr_reward:
	 *                type: integer
	 *                default: 0
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: create Package reward
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/create', {
		name: 'create',
		middleware: ['authAdmin'],
		cache: false
	})
	async create(ctx: Context<RewardAdminCreateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, RewardAdminCreateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const packageData = await ctx.call('v1.package.checkActive', { package_id: entity.package_id });
			if (!packageData) {
				return this.responseError('err_not_found', 'Package not found or not active.');
			}

			const packageTerm = await ctx.call('v1.packageTerm.findById', { term_id: entity.term_id });
			if (!packageTerm) {
				return this.responseError('err_not_found', 'Package term not found.');
			}

			const currency: ICurrency = await ctx.call('v1.currency.find', { currency_id: entity.currency_reward_id })
			if (!currency) {
				return this.responseError('err_not_found', 'Currency not found.');
			}

			const checkRewardCurrency = await this.adapter.findOne({
				currency_reward_id: Types.ObjectId(entity.currency_reward_id),
				package_id: Types.ObjectId(entity.package_id),
				term_id: Types.ObjectId(entity.term_id),
				deletedAt: null
			})

			if (checkRewardCurrency) {
				return this.responseError('err_data_existed', 'Package reward currency exist in system!.');
			}

			let entityReward: any = {
				package_id: Types.ObjectId(entity.package_id),
				term_id: Types.ObjectId(entity.term_id),
				currency_reward_id: Types.ObjectId(entity.currency_reward_id),
				apr_reward: entity.apr_reward
			}

			const parseRewardEntity = new JsonConvert().deserializeObject(entityReward, RewardEntity).getMongoEntity()
			const packageCheck = await this._create(ctx, parseRewardEntity);
			return this.responseSuccessDataMessage("Create package reward success", packageCheck);
		} catch (error) {
			this.logger.error('RewardAdminService - create:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/reward/update:
	 *    put:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: update Package reward
	 *      description: update Package reward
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
	 *              - reward_id
	 *              - package_id
	 *              - term_id
	 *              - currency_reward_id
	 *              - apr_reward
	 *            properties:
	 *              term_id:
	 *                type: string
	 *                default: 1234567890
	 *              reward_id:
	 *                type: string
	 *                default: 1234567890
	 *              package_id:
	 *                type: string
	 *                default: 1234567890
	 *              currency_reward_id:
	 *                type: string
	 *                default: 1234567890
	 *              apr_reward:
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
	async update(ctx: Context<RewardAdminUpdateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity: any = ctx.params;
			const validate = customValidator.validate(entity, RewardAdminUpdateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const packageData = await ctx.call('v1.package.checkActive', { package_id: entity.package_id });
			if (!packageData) {
				return this.responseError('err_not_found', 'Package not found or not active.');
			}

			const reward = await this.adapter.findById(entity.reward_id)
			if (!reward) {
				return this.responseError('err_not_found', 'Package reward not found.');
			}

			let entityUpdate: any = {
				updatedAt: moment().unix()
			}
			if (entity.currency_reward_id) {
				const currency = await ctx.call('v1.currency.find', { currency_id: entity.currency_reward_id })
				if (currency) {
					entityUpdate.currency_reward_id = Types.ObjectId(entity.currency_reward_id)
				}
			}
			if (entity.apr_reward) {
				entityUpdate.apr_reward = entity.apr_reward;
			}

			const checkUpdate = await this.adapter.updateById(entity.reward_id, { $set: entityUpdate });
			return this.responseSuccessDataMessage("Update package reward success", checkUpdate);
		} catch (error) {
			this.logger.error('RewardAdminService - update:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/reward/delete:
	 *    delete:
	 *      tags:
	 *      - "Admin Package"
	 *      summary: delete Package reward
	 *      description: delete Package reward
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
	 *              - reward_id
	 *              - package_id
	 *            properties:
	 *              reward_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: reward_id 
	 *              package_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: package_id 
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: delete package reward
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

			const reward = await this.adapter.findById(entity.reward_id)
			if (!reward) {
				return this.responseError('err_not_found', 'Package reward not found.');
			}

			let entityPackage: any = {
				deletedAt: moment().unix()
			};
			await this.adapter.updateById(entity.reward_id, { $set: entityPackage });
			return this.responseSuccess({ message: 'Delete package reward success' });
		} catch (error) {
			this.logger.error('RewardAdminService - delete:' + error)
			return this.responseUnkownError();
		}
	}
}
