'use strict';
import { Context } from 'moleculer';
import {
	Action,
	Delete,
	Get,
	Post,
	Put,
	Service,
} from '@ourparentcenter/moleculer-decorators-extended';
import { dbTeamWalletMixin, eventsTeamWalletMixin } from '../../mixins/dbMixins';
import {
	MoleculerDBService,
	RestOptions,
	TeamWalletAdminsServiceSettingsOptions,
	TeamWalletAdminsServiceOptions,
	TeamWalletAdminCreateParams,
	teamWalletAdminCreateParamsValidator,
} from '../../types';

import { ITeamWallet, TeamWalletEntity } from '../../entities';
import { JsonConvert } from 'json2typescript';
import moment from 'moment';
import { DbContextParameters } from 'moleculer-db';
import { CustomValidator } from '../../validators';

@Service<TeamWalletAdminsServiceOptions>({
	name: 'admin.teamWallet',
	version: 1,
	mixins: [dbTeamWalletMixin, eventsTeamWalletMixin],
	settings: {
		rest: '/v1/admin/teamWallet',
		idField: '_id',
		pageSize: 10,
		fields: ['_id', 'title', 'address', 'createdAt', 'updatedAt', 'deletedAt'],
	},
})
export default class TeamWalletAdminService extends MoleculerDBService<
	TeamWalletAdminsServiceSettingsOptions,
	ITeamWallet
> {
	/**
	 *  @swagger
	 *
	 *  /v1/admin/teamWallet/list:
	 *    get:
	 *      tags:
	 *      - "Admin Team Wallet"
	 *      summary: get list Wallet
	 *      description: get list Wallet
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
	 *        - name: address
	 *          description: address
	 *          in: query
	 *          required: false
	 *          type: string
	 *          example : 0xe10e5e2ab284d1C98afFaBf62a7fcc124880b8eb
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: get list Wallet
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
				deleteAt: null,
			};

			if (params.address != undefined && params.address != null) {
				const regex = new RegExp(['^', params.address, '$'].join(''), 'i');
				query.address = regex;
			}

			if (params.title != undefined && params.title != null) {
				const regex = new RegExp(['^', params.title, '$'].join(''), 'i');
				query.title = regex;
			}

			params.query = query;
			let wallets: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			return this.responseSuccess(wallets);
		} catch (error) {
			this.logger.error('teamWalletAdminService - list', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/teamWallet/detail:
	 *    get:
	 *      tags:
	 *      - "Admin Team Wallet"
	 *      summary: detail Team Wallet
	 *      description: detail Team Wallet
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: team_wallet_id
	 *          description: team_wallet_id
	 *          in: query
	 *          required: true
	 *          type: string
	 *          example : 6333fc1b85e387279dad7f96
	 *          default : 6333fc1b85e387279dad7f96
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: detail Team Wallet
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

			let teamWallet: any = await this.adapter.findById(params.team_wallet_id);
			if (teamWallet == null) {
				return this.responseError('err_not_found', 'TeamWallet not found.');
			}

			if (teamWallet.deletedAt != null) {
				return this.responseError('err_not_found', 'TeamWallet not found.');
			}

			return this.responseSuccess(teamWallet);
		} catch (error) {
			this.logger.error('TeamWalletService - detail', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/teamWallet/create:
	 *    post:
	 *      tags:
	 *      - "Admin Team Wallet"
	 *      summary: create teamWallet
	 *      description: create teamWallet
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
	 *              - address
	 *            properties:
	 *              title:
	 *                type: string
	 *                default: Team ECO
	 *                description: title
	 *              address:
	 *                type: string
	 *                default: "0x1b6d272A7cC15284918d13609a6B37057b0Cf7E3"
	 *                description: address
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: create teamWallet
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/create', {
		name: 'create',
		middleware: ['authAdmin'],
		cache: false,
	})
	async create(ctx: Context<TeamWalletAdminCreateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, teamWalletAdminCreateParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const regex = new RegExp(['^', entity.address, '$'].join(''), 'i');
			const checkAddress = await this.adapter.findOne({ address: regex, deleteAt: null });
			if (checkAddress) {
				return this.responseError('err_data_existed', 'Address Exist in system.');
			}

			let entityWallet: any = {
				title: entity.title,
				address: entity.address,
			};

			const parsedWalletEntity = new JsonConvert()
				.deserializeObject(entityWallet, TeamWalletEntity)
				.getMongoEntity();
			const wallet = await this._create(ctx, parsedWalletEntity);
			return this.responseSuccessDataMessage('Create team wallet success', wallet);
		} catch (error) {
			this.logger.error('TeamWalletAdminService - create:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/teamWallet/update:
	 *    put:
	 *      tags:
	 *      - "Admin Team Wallet"
	 *      summary: update teamWallet
	 *      description: update teamWallet
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
	 *              - address
	 *            properties:
	 *              wallet_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: wallet_id
	 *              title:
	 *                type: string
	 *                default: Team ECO
	 *                description: title
	 *              address:
	 *                type: string
	 *                default: "0x1b6d272A7cC15284918d13609a6B37057b0Cf7E3"
	 *                description: address
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: update wallet
	 *        403:
	 *          description: Server error
	 */
	@Put<RestOptions>('/update', {
		name: 'update',
		middleware: ['authAdmin'],
		cache: false,
	})
	async update(ctx: Context) {
		try {
			const entity: any = ctx.params;
			const wallet: ITeamWallet = await this.adapter.findById(entity.wallet_id);
			if (wallet) {
				let entityEntity: any = {
					updatedAt: moment().unix(),
				};

				if (entity.address != null && entity.address != undefined) {
					const regex = new RegExp(['^', entity.address, '$'].join(''), 'i');
					const checkAddress: ITeamWallet = await this.adapter.findOne({
						address: regex,
						deleteAt: null,
					});
					if (checkAddress && checkAddress.address != wallet.address) {
						return this.responseError('err_data_existed', 'Address Exist in system.');
					} else {
						entityEntity.address = entity.address;
					}
				}
				if (entity.title != null && entity.title != undefined) {
					entityEntity.title = entity.title;
				}

				const update = await this.adapter.updateById(wallet._id, { $set: entityEntity });
				return this.responseSuccessDataMessage('Update wallet success', update);
			} else {
				return this.responseError('err_not_found', 'Wallet not found.');
			}
		} catch (error) {
			this.logger.error('TeamWalletAdminService - update:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/teamWallet/delete:
	 *    delete:
	 *      tags:
	 *      - "Admin Team Wallet"
	 *      summary: delete teamWallet
	 *      description: delete teamWallet
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
	 *              - wallet_id
	 *            properties:
	 *              wallet_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: wallet_id
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: delete wallet
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
			const wallet: any = await this.adapter.findById(entity.wallet_id);
			if (wallet) {
				let entityEntity: any = {
					deleteAt: moment().unix(),
				};
				await this.adapter.updateById(wallet._id, { $set: entityEntity });
				return this.responseSuccess({ message: 'Delete wallet success' });
			} else {
				return this.responseError('err_not_found', 'Wallet not found.');
			}
		} catch (error) {
			this.logger.error('TeamWalletAdminService - delete:' + error);
			return this.responseUnkownError();
		}
	}
}
