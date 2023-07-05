'use strict';
import { Context } from 'moleculer';
import { dbInvestPackageMixin, eventsInvestPackageMixin } from '../../mixins/dbMixins';
import { Delete, Get, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	RestOptions,
	InvestPackageAdminCreateParams,
	InvestPackageAdminCreateParamsValidator,
	InvestPackageAdminUpdateParams,
	InvestPackageAdminUpdateParamsValidator,
} from '../../types';
import { InvestPackageEntity, IInvestPackage } from '../../entities';
import { JsonConvert } from 'json2typescript';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { CustomValidator } from '../../validators';
import moment from 'moment';
import { checkFieldExist, convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
@Service({
	name: 'admin.investPackage',
	version: 1,
	mixins: [dbInvestPackageMixin, eventsInvestPackageMixin],
	settings: {
		rest: '/v1/admin/investPackage',
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
			'status',
			'meta_data',
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
export default class InvestPackageAdminService extends MoleculerDBService<
	DbServiceSettings,
	IInvestPackage
> {
	/**
	 *  @swagger
	 *
	 *  /v1/admin/investPackage/list:
	 *    get:
	 *      tags:
	 *      - "Admin InvestPackage"
	 *      summary: get list InvestPackage
	 *      description: get list InvestPackage
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
	 *        - name: title
	 *          description: title
	 *          in: query
	 *          required: false
	 *          type: string
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
	 *          description: get list InvestPackage
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
				deletedAt: null,
			};

			if (params.title != undefined) {
				query.title = params.title;
			}

			if (params.status != undefined) {
				query.status = params.status == 'true' ? true : false;
			} else {
				query.status = true;
			}

			params.query = query;
			let investPackages: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			return this.responseSuccess(investPackages);
		} catch (error) {
			this.logger.error('InvestPackageAdminService - list', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/investPackage/detail:
	 *    get:
	 *      tags:
	 *      - "Admin InvestPackage"
	 *      summary: detail investPackage
	 *      description: detail investPackage
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: invest_package_id
	 *          description: invest_package_id
	 *          in: query
	 *          required: true
	 *          type: string
	 *          example : 6333fc1b85e387279dad7f96
	 *          default : 6333fc1b85e387279dad7f96
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: detail investPackage
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/detail', {
		name: 'detail',
		middleware: ['authAdmin'],
		cache: false,
	})
	async detail(ctx: Context) {
		try {
			let params: any = ctx.params;

			let investPackage: any = await this.adapter.findById(params.invest_package_id);
			if (investPackage == null) {
				return this.responseError('err_not_found', 'InvestPackage not found.');
			}

			if (investPackage.deletedAt != null) {
				return this.responseError('err_not_found', 'InvestPackage not found.');
			}

			return this.responseSuccess(investPackage);
		} catch (error) {
			this.logger.error('InvestPackageService - detail', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/investPackage/create:
	 *    post:
	 *      tags:
	 *      - "Admin InvestPackage"
	 *      summary: create InvestPackage
	 *      description: create InvestPackage
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
	 *              - title
	 *              - rare
	 *              - price_invest
	 *              - currency_invest
	 *              - bonus_token
	 *              - currency_bonus_token
	 *              - dividend_rate
	 *              - avatar
	 *              - status
	 *            properties:
	 *              title:
	 *                type: string
	 *                default: Invest Package
	 *              description:
	 *                type: string
	 *                default: description Invest Package
	 *              avatar:
	 *                type: string
	 *                default: 62aee65967c10159005c5286
	 *              video:
	 *                type: string
	 *                default: 62aee65967c10159005c5286
	 *              price_invest:
	 *                type: integer
	 *                default: 100000000000
	 *              rare:
	 *                type: integer
	 *                default: 1
	 *              currency_invest:
	 *                type: string
	 *                default: 62aee65967c10159005c5286
	 *              bonus_token:
	 *                type: integer
	 *                default: 100000000000
	 *              currency_bonus_token:
	 *                type: string
	 *                default: 62aee65967c10159005c5286
	 *              dividend_rate:
	 *                type: integer
	 *                default: 1
	 *              meta_data:
	 *                type: array
	 *                items:
	 *                  type: object
	 *                  properties:
	 *                    key:
	 *                      type: string
	 *                      default: OPV Reward
	 *                    value:
	 *                      type: string
	 *                      default: 500
	 *              currency_method_pay:
	 *                type: array
	 *                default: ["OPV","USDT"]
	 *              status:
	 *                type: boolean
	 *                default: true
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: create InvestPackage
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/create', {
		name: 'create',
		middleware: ['authAdmin'],
		cache: false,
	})
	async create(ctx: Context<InvestPackageAdminCreateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(
				entity,
				InvestPackageAdminCreateParamsValidator,
			);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const currency_invest = await ctx.call('v1.currency.find', {
				currency_id: entity.currency_invest,
			});
			if (!currency_invest) {
				return this.responseError('err_not_found', 'Currency not found.');
			}

			const currency_bonus_token = await ctx.call('v1.currency.find', {
				currency_id: entity.currency_bonus_token,
			});
			if (!currency_bonus_token) {
				return this.responseError('err_not_found', 'Currency not found.');
			}

			let entityInvestPackage: any = {
				title: entity.title,
				currency_invest: convertObjectId(entity.currency_invest),
				rare: entity.rare,
				description: entity.description,
				price_invest: entity.price_invest,
				bonus_token: entity.bonus_token,
				currency_bonus_token: convertObjectId(entity.currency_bonus_token),
				dividend_rate: entity.dividend_rate,
				status: entity.status,
				amount: entity.amount,
				amount_type: entity.amount_type,
				currency: entity.currency,
				currency_buy: entity.currency_buy,
				from_date: entity.from_date,
				to_date: entity.to_date,
			};

			const checkFileAvatar: any = await ctx.call('v1.files.find', { id: entity.avatar });
			if (checkFileAvatar.status == 'error') {
				return checkFileAvatar;
			} else {
				entityInvestPackage.avatar = checkFileAvatar.data.full_link;
			}

			const checkFileVideo: any = await ctx.call('v1.files.find', { id: entity.video });
			if (checkFileVideo.status == 'error') {
				return checkFileVideo;
			} else {
				entityInvestPackage.video = checkFileVideo.data.full_link;
			}

			if (
				entity.meta_data != undefined &&
				entity.meta_data != '' &&
				entity.meta_data != null
			) {
				const meta_data = entity.meta_data;
				if (Array.isArray(meta_data)) {
					for (let i = 0; i < meta_data.length; i++) {
						const dataMeta = meta_data[i];
						if (dataMeta.key == undefined || dataMeta.value == undefined) {
							return this.responseError('err_validate', 'Meta data wrong format');
						}
					}
					entityInvestPackage.meta_data = meta_data;
				} else {
					return this.responseError('err_validate', 'Meta data wrong format');
				}
			}

			if (
				entity.currency_method_pay != undefined &&
				entity.currency_method_pay != '' &&
				entity.currency_method_pay != null
			) {
				const currency_method_pay = entity.currency_method_pay;
				if (Array.isArray(currency_method_pay)) {
					for (let i = 0; i < currency_method_pay.length; i++) {
						const dataCurrency = currency_method_pay[i];
						const currency = await ctx.call('v1.currency.findByCode', {
							code: dataCurrency,
						});
						if (currency == null || currency == false) {
							return this.responseError(
								'err_validate',
								'Currency method pay not found',
							);
						}
					}
					entityInvestPackage.currency_method_pay = currency_method_pay;
				} else {
					return this.responseError('err_validate', 'Currency method pay wrong format');
				}
			}

			const parseInvestPackageEntity = new JsonConvert()
				.deserializeObject(entityInvestPackage, InvestPackageEntity)
				.getMongoEntity();
			const InvestPackageCheck = await this._create(ctx, parseInvestPackageEntity);
			return this.responseSuccessDataMessage(
				'Create Invest Package success',
				InvestPackageCheck,
			);
		} catch (error) {
			this.logger.error('InvestPackageAdminService - create:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/investPackage/update:
	 *    put:
	 *      tags:
	 *      - "Admin InvestPackage"
	 *      summary: update InvestPackage
	 *      description: update InvestPackage
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
	 *              - invest_package_id
	 *            properties:
	 *              invest_package_id:
	 *                type: string
	 *                default: 1234567890
	 *              title:
	 *                type: string
	 *                default: Invest Package
	 *              avatar:
	 *                type: string
	 *                default: 62aee65967c10159005c5286
	 *              video:
	 *                type: string
	 *                default: 62aee65967c10159005c5286
	 *              description:
	 *                type: string
	 *                default: description Invest Package
	 *              price_invest:
	 *                type: integer
	 *                default: 100000000000
	 *              currency_invest:
	 *                type: string
	 *                default: 1234567890
	 *              bonus_token:
	 *                type: integer
	 *                default: 100000000000
	 *              currency_bonus_token:
	 *                type: string
	 *                default: 1234567890
	 *              meta_data:
	 *                type: array
	 *                items:
	 *                  type: object
	 *                  properties:
	 *                    key:
	 *                      type: string
	 *                      default: OPV Reward
	 *                    value:
	 *                      type: string
	 *                      default: 500
	 *              currency_method_pay:
	 *                type: array
	 *                default: ["OPV","USDT"]
	 *              status:
	 *                type: boolean
	 *                default: true
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: update Invest Package
	 *        403:
	 *          description: Server error
	 */
	@Put<RestOptions>('/update', {
		name: 'update',
		middleware: ['authAdmin'],
		cache: false,
	})
	async update(ctx: Context<InvestPackageAdminUpdateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity: any = ctx.params;
			const validate = customValidator.validate(
				entity,
				InvestPackageAdminUpdateParamsValidator,
			);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const investPackage = await this.adapter.findById(entity.invest_package_id);
			if (!investPackage) {
				return this.responseError('err_not_found', 'Invest Package not found.');
			}

			let entityUpdate: any = {
				updatedAt: moment().unix(),
			};

			if (entity.title) {
				entityUpdate.title = entity.title;
			}

			if (entity.description) {
				entityUpdate.description = entity.description;
			}

			if (entity.price_invest) {
				entityUpdate.price_invest = entity.price_invest;
			}

			if (entity.rare) {
				entityUpdate.rare = entity.rare;
			}

			if (entity.currency_invest) {
				const currency_invest = await ctx.call('v1.currency.find', {
					currency_id: entity.currency_invest,
				});
				if (currency_invest) {
					entityUpdate.currency_invest = convertObjectId(entity.currency_invest);
				} else {
					return this.responseError('err_not_found', 'Currency not found.');
				}
			}

			if (entity.bonus_token) {
				entityUpdate.bonus_token = entity.bonus_token;
			}

			if (entity.total_daily_reward) {
				entityUpdate.total_daily_reward = entity.total_daily_reward;
			}

			if (entity.daily_reward) {
				entityUpdate.daily_reward = entity.daily_reward;
			}

			if (entity.amount) {
				entityUpdate.amount = entity.amount;
			}

			if (entity.amount_type != null && entity.amount_type != undefined) {
				entityUpdate.amount_type = entity.amount_type;
			}

			if (entity.currency) {
				entityUpdate.currency = entity.currency;
			}

			if (entity.from_date) {
				entityUpdate.from_date = entity.from_date;
			}

			if (entity.to_date) {
				entityUpdate.to_date = entity.to_date;
			}

			if (entity.currency_buy != null && Array.isArray(entity.currency_buy)) {
				entityUpdate.currency_buy = entity.currency_buy;
			}

			if (entity.avatar) {
				const checkFileAvatar: any = await ctx.call('v1.files.find', { id: entity.avatar });
				if (checkFileAvatar.status == 'error') {
					return checkFileAvatar;
				} else {
					entityUpdate.avatar = checkFileAvatar.data.full_link;
				}
			}

			if (entity.video) {
				const checkFileVideo: any = await ctx.call('v1.files.find', { id: entity.video });
				if (checkFileVideo.status == 'error') {
					return checkFileVideo;
				} else {
					entityUpdate.video = checkFileVideo.data.full_link;
				}
			}

			if (
				entity.meta_data != undefined &&
				entity.meta_data != '' &&
				entity.meta_data != null
			) {
				const meta_data = entity.meta_data;
				if (Array.isArray(meta_data)) {
					for (let i = 0; i < meta_data.length; i++) {
						const dataMeta = meta_data[i];
						if (dataMeta.key == undefined || dataMeta.value == undefined) {
							return this.responseError('err_validate', 'Meta data wrong format');
						}
					}
					entityUpdate.meta_data = meta_data;
				} else {
					return this.responseError('err_validate', 'Meta data wrong format');
				}
			}

			if (
				entity.currency_method_pay != undefined &&
				entity.currency_method_pay != '' &&
				entity.currency_method_pay != null
			) {
				const currency_method_pay = entity.currency_method_pay;
				if (Array.isArray(currency_method_pay)) {
					for (let i = 0; i < currency_method_pay.length; i++) {
						const dataCurrency = currency_method_pay[i];
						const currency = await ctx.call('v1.currency.findByCode', {
							code: dataCurrency,
						});
						if (currency == null || currency == false) {
							return this.responseError(
								'err_validate',
								'Currency method pay not found',
							);
						}
					}
					entityUpdate.currency_method_pay = currency_method_pay;
				} else {
					return this.responseError('err_validate', 'Currency method pay wrong format');
				}
			}

			if (entity.currency_daily_reward != null && entity.currency_daily_reward != '') {
				const currency_daily_reward = await ctx.call('v1.currency.find', {
					currency_id: entity.currency_daily_reward,
				});
				if (currency_daily_reward) {
					entityUpdate.currency_daily_reward = convertObjectId(
						entity.currency_daily_reward,
					);
				} else {
					return this.responseError('err_not_found', 'Currency not found.');
				}
			}

			if (entity.currency_bonus_token) {
				const currency_bonus_token = await ctx.call('v1.currency.find', {
					currency_id: entity.currency_bonus_token,
				});
				if (currency_bonus_token) {
					entityUpdate.currency_bonus_token = convertObjectId(
						entity.currency_bonus_token,
					);
				} else {
					return this.responseError('err_not_found', 'Currency not found.');
				}
			}

			if (entity.receive_token) {
				entityUpdate.receive_token = entity.receive_token;
			}

			if (entity.currency_receive_token) {
				const currency_receive_token = await ctx.call('v1.currency.find', {
					currency_id: entity.currency_receive_token,
				});
				if (currency_receive_token) {
					entityUpdate.currency_receive_token = convertObjectId(
						entity.currency_receive_token,
					);
				} else {
					return this.responseError('err_not_found', 'Currency not found.');
				}
			}

			if (entity.slot_airdrop) {
				entityUpdate.slot_airdrop = entity.slot_airdrop;
			}

			if (entity.factor_airdrop) {
				entityUpdate.factor_airdrop = entity.factor_airdrop;
			}

			if (checkFieldExist(entity.status)) {
				entityUpdate.status = entity.status;
			}

			const checkUpdate = await this.adapter.updateById(entity.invest_package_id, {
				$set: entityUpdate,
			});
			this.broker.cacher?.clean('*.investPackage.findById:' + entity.invest_package_id);
			return this.responseSuccessDataMessage('Update InvestPackage success', checkUpdate);
		} catch (error) {
			this.logger.error('InvestPackageAdminService - update:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/investPackage/delete:
	 *    delete:
	 *      tags:
	 *      - "Admin InvestPackage"
	 *      summary: delete Invest Package
	 *      description: delete Invest Package
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
	 *              - invest_package_id
	 *            properties:
	 *              invest_package_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: invest_package_id
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: delete Invest Package
	 *        403:
	 *          description: Server error
	 */
	@Delete<RestOptions>('/delete', {
		name: 'delete',
		middleware: ['authAdmin'],
		cache: false,
	})
	async delete(ctx: Context) {
		try {
			const entity: any = ctx.params;
			const investPackage = await this.adapter.findById(entity.invest_package_id);
			if (!investPackage) {
				return this.responseError('err_not_found', 'Invest Package not found.');
			}

			let entityInvestPackage: any = {
				deletedAt: moment().unix(),
			};
			await this.adapter.updateById(entity.invest_package_id, { $set: entityInvestPackage });
			this.broker.cacher?.clean('*.investPackage.findById:' + entity.invest_package_id);
			return this.responseSuccess({ message: 'Delete Invest Package success' });
		} catch (error) {
			this.logger.error('InvestPackageAdminService - delete:' + error);
			return this.responseUnkownError();
		}
	}
}
