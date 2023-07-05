'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbChainWalletMixin, eventsChainWalletMixin } from '../../mixins/dbMixins';
import {
	Action,
	Delete,
	Get,
	Method,
	Post,
	Put,
	Service,
} from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	ChainWalletServiceSettingsOptions,
	RestOptions,
	ChainWalletAdminCreateParams,
	ChainWalletAdminCreateParamsValidator,
} from '../../types';
import { ChainWalletEntity, IChainWallet } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters } from 'moleculer-db';
import { CustomValidator } from '../../validators';
import moment from 'moment';
import _ from 'lodash';
import { Web3Balance, Web3Token } from '../../libraries';

@Service({
	name: 'admin.chainWallet',
	version: 1,
	mixins: [dbChainWalletMixin, eventsChainWalletMixin],
	settings: {
		rest: '/v1/admin/chainWallet',
		idField: '_id',
		pageSize: 10,
		fields: ['_id', 'chain_id', 'address', 'using', 'active', 'createdAt', 'updatedAt'],
	},
})
export default class ChainWalletAdminService extends MoleculerDBService<
	ChainWalletServiceSettingsOptions,
	IChainWallet
> {
	/**
	 *  @swagger
	 *
	 *  /v1/admin/chainWallet/list:
	 *    get:
	 *      tags:
	 *      - "Admin Wallet Chain"
	 *      summary: get list Wallet
	 *      description: get list Wallet
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: chain_id
	 *          description: chain id
	 *          in: query
	 *          required: false
	 *          type: string
	 *        - name: address
	 *          description: address
	 *          in: query
	 *          required: false
	 *          type: string
	 *          example : 0xe10e5e2ab284d1C98afFaBf62a7fcc124880b8eb
	 *        - name: using
	 *          description: using
	 *          in: query
	 *          required: false
	 *          type: boolean
	 *          example : true
	 *        - name: active
	 *          description: active
	 *          in: query
	 *          required: false
	 *          type: boolean
	 *          example : true
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

			if (params.chain_id != undefined) {
				query.chain_id = params.chain_id;
			}

			if (params.using != undefined && params.using != null) {
				query.using = params.using;
			}

			if (params.type != undefined) {
				query.type = params.type;
			}

			if (params.address != undefined && params.address != null) {
				const regex = new RegExp(['^', params.address, '$'].join(''), 'i');
				query.address = regex;
			}

			if (params.active != undefined) {
				query.active = params.active;
			} else {
				query.active = true;
			}

			params.query = query;
			let wallets: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			const dataWallets = wallets.rows;
			let rows: any = [];
			const currencies: any = await ctx.call('v1.currency.getAll');
			const blockChains: any = await ctx.call('v1.blockchain.getAllEthereum');
			for (let i = 0; i < dataWallets.length; i++) {
				let wallet = dataWallets[i];
				let dataBalance: any = [];
				for (let k = 0; k < blockChains.length; k++) {
					const blockchain = blockChains[k];
					let dataBlockchain: any = {
						code: blockchain.code,
						title: blockchain.title,
						scan: blockchain.scan,
					};
					const atrr: any = await ctx.call('v1.currencyAttr.getAllWithdrawOnChian', {
						blockchain: blockchain._id.toString(),
					});
					let dataCurrency: any = [];
					for (let l = 0; l < currencies.length; l++) {
						const currency = currencies[l];
						const currencyAttr = _.find(atrr, { currency_id: currency._id.toString() });
						if (currencyAttr) {
							const web3Token = new Web3Token(blockchain.rpc);
							const isAddress = await web3Token.isAddress(currencyAttr.contract);
							if (isAddress) {
								const web3Balance = new Web3Balance(
									blockchain.rpc,
									currencyAttr.contract,
									JSON.parse(currencyAttr.abi),
								);
								const balance = await web3Balance.getBalance(wallet.address);
								dataCurrency.push({
									_id: currency._id,
									code: currency.code,
									title: currency.title,
									icon: currency.icon,
									balance: +balance,
								});
							} else {
								dataCurrency.push({
									_id: currency._id,
									code: currency.code,
									title: currency.title,
									icon: currency.icon,
									balance: 0,
								});
							}
						} else {
							dataCurrency.push({
								_id: currency._id,
								code: currency.code,
								title: currency.title,
								icon: currency.icon,
								balance: 0,
							});
						}
					}
					dataBlockchain.currency = dataCurrency;
					dataBalance.push(dataBlockchain);
				}
				wallet.blockChains = dataBalance;

				rows.push(wallet);
			}
			wallets.rows = rows;
			return this.responseSuccess(wallets);
		} catch (error) {
			this.logger.error('ChainWalletAdminService - list', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/chainWallet/detail:
	 *    get:
	 *      tags:
	 *      - "Admin Wallet Chain"
	 *      summary: detail Wallet Chain
	 *      description: detail Wallet Chain
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: wallet_chain_id
	 *          description: wallet_chain_id
	 *          in: query
	 *          required: true
	 *          type: string
	 *          example : 6333fc1b85e387279dad7f96
	 *          default : 6333fc1b85e387279dad7f96
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: detail Wallet Chain
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

			let walletChain: any = await this.adapter.findById(params.wallet_chain_id);
			if (walletChain == null) {
				return this.responseError('err_not_found', 'WalletChain not found.');
			}

			if (walletChain.deletedAt != null) {
				return this.responseError('err_not_found', 'WalletChain not found.');
			}

			return this.responseSuccess(walletChain);
		} catch (error) {
			this.logger.error('WalletChainService - detail', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/chainWallet/create:
	 *    post:
	 *      tags:
	 *      - "Admin Wallet Chain"
	 *      summary: create chainWallet
	 *      description: create chainWallet
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
	 *              - chain_id
	 *              - address
	 *              - privateKey
	 *            properties:
	 *              chain_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: chain_id
	 *              address:
	 *                type: string
	 *                default: 1234567890
	 *                description: password
	 *              privateKey:
	 *                type: string
	 *                default: 09090909
	 *                description: phone_number
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: create chainWallet
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/create', {
		name: 'create',
		middleware: ['authAdmin'],
		cache: false,
	})
	async create(ctx: Context<ChainWalletAdminCreateParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(
				entity,
				ChainWalletAdminCreateParamsValidator,
			);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const regex = new RegExp(['^', entity.address, '$'].join(''), 'i');
			const checkAddress = await this.adapter.findOne({ address: regex, deleteAt: null });
			if (checkAddress) {
				return this.responseError('err_data_existed', 'Address Exist in system.');
			}

			const chain = await ctx.call('v1.blockchain.id', { id: entity.chain_id });
			if (!chain) {
				return this.responseError('err_not_found', 'Chain not found.');
			}

			let entityWallet: any = {
				address: entity.address,
				privateKey: entity.privateKey,
				chain_id: entity.chain_id,
				active: true,
				using: false,
			};

			const parsedWalletEntity = new JsonConvert()
				.deserializeObject(entityWallet, ChainWalletEntity)
				.getMongoEntity();
			const wallet = await this._create(ctx, parsedWalletEntity);
			return this.responseSuccessDataMessage('Create wallet success', wallet);
		} catch (error) {
			this.logger.error('CustomerAdminService - create:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/chainWallet/update:
	 *    put:
	 *      tags:
	 *      - "Admin Wallet Chain"
	 *      summary: update chainWallet
	 *      description: update chainWallet
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
	 *              - chain_id
	 *              - using
	 *            properties:
	 *              wallet_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: wallet_id
	 *              chain_id:
	 *                type: string
	 *                default: 6243432f1e5349c0f40dd4da
	 *                description: chain_id
	 *              using:
	 *                type: boolean
	 *                default: false
	 *                description: using
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

			const wallet: any = await this.adapter.findById(entity.wallet_id);
			if (wallet) {
				let entityEntity: any = {
					updatedAt: moment().unix(),
				};
				if (entity.using != undefined && entity.using != null) {
					entityEntity.using = entity.using;
				}
				if (entity.chain_id != undefined && entity.chain_id != null) {
					const chain = await ctx.call('v1.blockchain.id', { id: entity.chain_id });
					if (!chain) {
						return this.responseError('err_not_found', 'Chain not found.');
					}
					entityEntity.chain_id = entity.chain_id;
				}
				const update = await this.adapter.updateById(wallet._id, { $set: entityEntity });
				return this.responseSuccessDataMessage('Update wallet success', update);
			} else {
				return this.responseError('err_not_found', 'Wallet not found.');
			}
		} catch (error) {
			this.logger.error('CustomerAdminService - update:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/chainWallet/delete:
	 *    delete:
	 *      tags:
	 *      - "Admin Wallet Chain"
	 *      summary: delete chainWallet
	 *      description: delete chainWallet
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
			this.logger.error('CustomerAdminService - delete:' + error);
			return this.responseUnkownError();
		}
	}
}
