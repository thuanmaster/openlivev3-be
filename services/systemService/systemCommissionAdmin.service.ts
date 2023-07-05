'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbSystemCommissionMixin, eventsSystemCommissionMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	RestOptions,
	SystemCommissionAdminCreateParams,
	SystemCommissionAdminCreateParamsValidator,
	SystemCommissionAdminUpdateParams,
	SystemCommissionAdminUpdateParamsValidator,
	SystemCommissionType
} from '../../types';
import { SystemCommissionEntity, ISystemCommission } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { CustomValidator } from '../../validators';
import moment from 'moment';
import { convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
@Service({
	name: 'admin.systemCommission',
	version: 1,
	mixins: [dbSystemCommissionMixin, eventsSystemCommissionMixin],
	settings: {
		rest: '/v1/admin/systemCommission',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'level',
			'currency_id',
			'commission',
			'commission_type',
			'createdAt',
			'updatedAt',
		]
	}
})

export default class SystemCommissionAdminService extends MoleculerDBService<DbServiceSettings, ISystemCommission> {

	/**
	 *  @swagger
	 *
	 *  /v1/admin/systemCommission/list:
	 *    get:
	 *      tags:
	 *      - "Admin SystemCommission"
	 *      summary: get list SystemCommission
	 *      description: get list SystemCommission
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
	 *      security:
	 *        - Bearer: [] 
	 *      responses:
	 *        200:
	 *          description: get list SystemCommission
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

			params.query = query
			let SystemCommissions: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			return this.responseSuccess(SystemCommissions);
		} catch (error) {
			this.logger.error("SystemCommissionAdminService - list", error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/systemCommission/create:
	 *    post:
	 *      tags:
	 *      - "Admin SystemCommission"
	 *      summary: create SystemCommission
	 *      description: create SystemCommission
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
	 *              - level
	 *              - currency_id
	 *              - commission
	 *              - commission_type
	 *            properties:
	 *              commission_type:
	 *                type: string
	 *                default: BONUS_ACTIVE
	 *              currency_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *              level:
	 *                type: integer
	 *                default: 1
	 *              commission:
	 *                type: integer
	 *                default: 1
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: create SystemCommission
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/create', {
		name: 'create',
		middleware: ['authAdmin'],
		cache: false
	})
	async create(ctx: Context<SystemCommissionAdminCreateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, SystemCommissionAdminCreateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const currency = await ctx.call('v1.currency.find', { currency_id: entity.currency_id })
			if (!currency) {
				return this.responseError('err_not_found', 'Currency not found.');
			}

			const systemCommissionTypes: any = SystemCommissionType;
			if (systemCommissionTypes[entity.commission_type] == undefined) {
				return this.responseError('err_not_found', 'Commission type not exist');
			}

			const checkLevel = await this.adapter.findOne({
				deletedAt: null,
				level: entity.level,
				commission_type: entity.commission_type,
			})
			if (checkLevel) {
				return this.responseError('err_not_found', 'Commission existed');
			}

			let entitySystemCommission: any = {
				commission_type: entity.commission_type,
				level: entity.level,
				currency_id: convertObjectId(entity.currency_id),
				commission: entity.commission
			}

			const parseSystemCommissionEntity = new JsonConvert().deserializeObject(entitySystemCommission, SystemCommissionEntity).getMongoEntity()
			const packageCheck = await this._create(ctx, parseSystemCommissionEntity);
			return this.responseSuccessDataMessage("Create System Commission success", packageCheck);
		} catch (error) {
			this.logger.error('SystemCommissionAdminService - create:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/systemCommission/update:
	 *    put:
	 *      tags:
	 *      - "Admin SystemCommission"
	 *      summary: update SystemCommission
	 *      description: update SystemCommission
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
	 *                default: 6243432f1e5349c0f40dd4da
	 *              currency_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *              commission:
	 *                type: integer
	 *                default: 1
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: update system commission
	 *        403:
	 *          description: Server error
	 */
	@Put<RestOptions>('/update', {
		name: 'update',
		middleware: ['authAdmin'],
		cache: false
	})
	async update(ctx: Context<SystemCommissionAdminUpdateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, SystemCommissionAdminUpdateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const SystemCommission = await this.adapter.findById(entity.commission_id)
			if (!SystemCommission) {
				return this.responseError('err_not_found', 'System Commission not found.');
			}

			let entityUpdate: any = {
				updatedAt: moment().unix()
			}

			if (entity.currency_id) {
				const currency = await ctx.call('v1.currency.find', { currency_id: entity.currency_id })
				if (currency) {
					entityUpdate.currency_id = convertObjectId(entity.currency_id);
				} else {
					return this.responseError('err_not_found', 'Currency not found.');
				}
			}

			if (entity.commission) {
				entityUpdate.commission = entity.commission;
			}
			
			const checkUpdate = await this.adapter.updateById(entity.commission_id, { $set: entityUpdate });
			return this.responseSuccessDataMessage("Update System Commission success", checkUpdate);
		} catch (error) {
			this.logger.error('SystemCommissionAdminService - update:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/systemCommission/delete:
	 *    delete:
	 *      tags:
	 *      - "Admin SystemCommission"
	 *      summary: delete SystemCommission
	 *      description: delete SystemCommission
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
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: System Commission id 
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: delete SystemCommission
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

			const SystemCommission = await this.adapter.findById(entity.commission_id)
			if (!SystemCommission) {
				return this.responseError('err_not_found', 'SystemCommission not found.');
			}

			let entityPackage: any = {
				deletedAt: moment().unix()
			};
			await this.adapter.updateById(entity.commission_id, { $set: entityPackage });
			return this.responseSuccess({ message: 'Delete SystemCommission success' });
		} catch (error) {
			this.logger.error('SystemCommissionAdminService - delete:' + error)
			return this.responseUnkownError();
		}
	}
}
