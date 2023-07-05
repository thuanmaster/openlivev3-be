'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbDirectCommissionMixin, eventsDirectCommissionMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	RestOptions,
	DirectCommissionAdminCreateParams,
	DirectCommissionAdminCreateParamsValidator,
	DirectCommissionAdminUpdateParams,
	DirectCommissionAdminUpdateParamsValidator
} from '../../types';
import { DirectCommissionEntity, ICurrency, IDirectCommission, IInvestPackage } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { CustomValidator } from '../../validators';
import moment from 'moment';
import { checkFieldExist, convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
@Service({
	name: 'admin.directCommission',
	version: 1,
	mixins: [dbDirectCommissionMixin, eventsDirectCommissionMixin],
	settings: {
		rest: '/v1/admin/directCommission',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'level',
			'currency_id',
			'package_id',
			'commission',
			'type',
			'createdAt',
			'updatedAt',
		]
	}
})

export default class DirectCommissionAdminService extends MoleculerDBService<DbServiceSettings, IDirectCommission> {

	/**
	 *  @swagger
	 *
	 *  /v1/admin/directCommission/list:
	 *    get:
	 *      tags:
	 *      - "Admin DirectCommissionInvest"
	 *      summary: get list DirectCommission
	 *      description: get list DirectCommission
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
	 *        - name: package_id
	 *          description: package_id
	 *          in: query
	 *          required: false
	 *          type: string
	 *          default : 635218fe5f29c7b6f327003c
	 *      security:
	 *        - Bearer: [] 
	 *      responses:
	 *        200:
	 *          description: get list directCommission
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

			if (params.package_id != null && params.package_id != undefined) {
				query.package_id = convertObjectId(params.package_id)
			}

			params.query = query
			let directCommissions: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			const dataDirectCommissions = directCommissions.rows;
			let dataRows: any = [];
			for (let i = 0; i < dataDirectCommissions.length; i++) {
				let row: any = dataDirectCommissions[i];
				const packageData: IInvestPackage = await ctx.call('v1.investPackage.findById', {
					invest_package_id: row.package_id,
				});
				row.package = packageData;
				dataRows.push(row);
			}
			directCommissions.rows = dataRows;
			return this.responseSuccess(directCommissions);
		} catch (error) {
			this.logger.error("DirectCommissionAdminService - list", error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/directCommission/create:
	 *    post:
	 *      tags:
	 *      - "Admin DirectCommissionInvest"
	 *      summary: create DirectCommission
	 *      description: create DirectCommission
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
	 *              - package_id
	 *              - commission
	 *              - type
	 *            properties:
	 *              package_id:
	 *                type: string
	 *                default: 635218fe5f29c7b6f327003c
	 *                summary: currency id
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
	 *          description: create DirectCommission
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/create', {
		name: 'create',
		middleware: ['authAdmin'],
		cache: false
	})
	async create(ctx: Context<DirectCommissionAdminCreateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, DirectCommissionAdminCreateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}
			const packageData = await ctx.call('v1.investPackage.findById', { invest_package_id: entity.package_id })
			if (!packageData) {
				return this.responseError('err_not_found', 'Package invest not found.');
			}

			const checkLevel = await this.adapter.findOne({
				deletedAt: null,
				level: entity.level,
				package_id: convertObjectId(entity.package_id)
			})
			if (checkLevel) {
				return this.responseError('err_not_found', 'Commission existed');
			}

			let entityDirectCommission: any = {
				level: entity.level,
				package_id: convertObjectId(entity.package_id),
				commission: entity.commission,
				type: entity.type,
			}

			const parseDirectCommissionEntity = new JsonConvert().deserializeObject(entityDirectCommission, DirectCommissionEntity).getMongoEntity()
			const packageCheck = await this._create(ctx, parseDirectCommissionEntity);
			return this.responseSuccessDataMessage("Create Direct Commission success", packageCheck);
		} catch (error) {
			this.logger.error('DirectCommissionAdminService - create:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/directCommission/update:
	 *    put:
	 *      tags:
	 *      - "Admin DirectCommissionInvest"
	 *      summary: update DirectCommission
	 *      description: update DirectCommission
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
	async update(ctx: Context<DirectCommissionAdminUpdateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, DirectCommissionAdminUpdateParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const directCommission = await this.adapter.findById(entity.commission_id)
			if (!directCommission) {
				return this.responseError('err_not_found', 'Direct Commission not found.');
			}

			let entityUpdate: any = {
				updatedAt: moment().unix()
			}

			if (checkFieldExist(entity.commission)) {
				entityUpdate.commission = entity.commission;
			}

			if (checkFieldExist(entity.type)) {
				entityUpdate.type = entity.type;
			}

			const checkUpdate = await this.adapter.updateById(entity.commission_id, { $set: entityUpdate });
			return this.responseSuccessDataMessage("Update DirectCommission success", checkUpdate);
		} catch (error) {
			this.logger.error('DirectCommissionAdminService - update:' + error)
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/directCommission/delete:
	 *    delete:
	 *      tags:
	 *      - "Admin DirectCommissionInvest"
	 *      summary: delete DirectCommission
	 *      description: delete DirectCommission
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
	 *                description: DirectCommission_id 
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: delete DirectCommission
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

			const DirectCommission = await this.adapter.findById(entity.commission_id)
			if (!DirectCommission) {
				return this.responseError('err_not_found', 'DirectCommission not found.');
			}

			let entityPackage: any = {
				deletedAt: moment().unix()
			};
			await this.adapter.updateById(entity.commission_id, { $set: entityPackage });
			return this.responseSuccess({ message: 'Delete DirectCommission success' });
		} catch (error) {
			this.logger.error('DirectCommissionAdminService - delete:' + error)
			return this.responseUnkownError();
		}
	}
}
