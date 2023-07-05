'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters } from 'moleculer-db';
import { dbWalletMixin, eventsWalletMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';
import * as _ from 'lodash';
import {
	BalanceWalletParams,
	BalanceWalletParamsValidator,
	CreateWalletChainParams,
	CreateWalletParams,
	CreateWalletParamsValidator,
	CurencyType,
	MoleculerDBService,
	ParamUpdateOnhold,
	RestOptions,
	WalletServiceOptions,
	WalletServiceSettingsOptions
} from '../../types';

import { IBlockChain, IWallet, WalletEntity } from '../../entities';
import { CustomValidator } from '../../validators';
import { Web3Withdraw, Web3Banker, Web3Token, HuobiApi } from '../../libraries';
import { JsonConvert } from 'json2typescript';
import { Types } from 'mongoose';
import { convertDecimal, convertNonDecimal, convertObjectId, decodeString, encodeString } from '../../mixins/dbMixins/helpers.mixin';
@Service<WalletServiceOptions>({
	name: 'wallet',
	version: 1,
	mixins: [dbWalletMixin, eventsWalletMixin],
	settings: {
		idField: '_id',
		pageSize: 10,
		rest: '/v1/wallet',
		fields: [
			'_id',
			'address',
			'addressTag',
			'customer_id',
			'currency',
			'chain',
			'type',
			'createdAt',
			'updatedAt',

		]
	},
})
export default class WalletService extends MoleculerDBService<WalletServiceSettingsOptions, IWallet> {
	/**
	 *  @swagger
	 *
	 *  /v1/wallet/list:
	 *    get:
	 *      tags:
	 *      - "Wallet"
	 *      summary: get list Wallet
	 *      description: get list Wallet
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: currency
	 *          description: currency code
	 *          in: query
	 *          required: false
	 *          type: string
	 *          example : ZUKI 
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
		middleware: ['auth'],
		cache: false,
	})
	async list(ctx: Context<DbContextParameters>) {
		try {
			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (!customer) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
			let params: any = ctx.params
			let query: any = {
				active: true,
				customer_id: Types.ObjectId(customer._id)
			}
			if (params.currency != undefined) {
				query.currency = params.currency;
			}
			params.query = query
			let wallets: any = await this._find(ctx, params);
			for (let index in wallets) {
				const wallet = wallets[index]
				const balance = await ctx.call('v1.transaction.getBalance', {
					currency_code: wallet.currency,
					customer_id: wallet.customer_id.toString()
				})
				wallets[index].balance = balance;

			}
			return this.responseSuccess(wallets);
		} catch (error) {
			this.logger.error("WalletService - list", error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/wallet/getaddress:
	 *    post:
	 *      tags:
	 *      - "Wallet"
	 *      summary: getaddress Wallet
	 *      description: getaddress Wallet
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      security:
	 *        - Bearer: [] 
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - currency_code
	 *              - chain_code
	 *              - type
	 *            properties:
	 *              currency_code:
	 *                type: string
	 *                default: ZUKI
	 *              chain_code:
	 *                type: string
	 *                default: BEP20
	 *              type:
	 *                type: string
	 *                default: CRYPTO
	 *      responses:
	 *        200:
	 *          description: getaddress Wallet
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/getaddress', {
		name: 'getaddress',
		middleware: ['auth', 'captcha','FORBIDDEN_ALL'],
		cache: false,
	})
	async getaddress(ctx: Context<CreateWalletParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, CreateWalletParamsValidator)
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (!customer) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}

			const currency: any = await ctx.call('v1.currency.findByCode', { code: entity.currency_code });
			const blockchain: IBlockChain = await ctx.call('v1.blockchain.findByCode', { code: entity.chain_code });
			if (!currency) {
				return this.responseError('err_not_found', 'Currency not found');
			}

			if (!blockchain) {
				return this.responseError('err_not_found', 'Chain not found');
			}

			const currencyAttr: any = await ctx.call('v1.currencyAttr.find', { currency_id: currency._id, chain_id: blockchain._id })
			if (!currencyAttr) {
				return this.responseError('err_not_found', `${blockchain.title} not support ${currency.title}`);
			}

			const customerId = Types.ObjectId(customer._id);

			const type = entity.type;
			const values = Object.values<string>(CurencyType);
			if (values.includes(type) == false) {
				return this.responseError('err_data_not_exist', 'Type not exist.');
			}

			const queryFindWallet: any = {
				active: true,
				customer_id: customerId,
				chain: blockchain.code,
				currency: currency.code
			}
			let findWallet: any = await this.adapter.findOne(queryFindWallet);
			if (findWallet == null) {
				if (currencyAttr.type_deposit != 'ONCHAIN') {
					let subUserId = customer.sub_user_id;
					const accessKey: string = await ctx.call("v1.setting.getByKey", { key: "HOUBI_ACCESS_KEY" })
					const secretKey: string = await ctx.call("v1.setting.getByKey", { key: "HOUBI_SECRET_KEY" })
					const huobiApi = new HuobiApi(accessKey, secretKey);
					if (subUserId == null) {
						const subUserCreation: any = await huobiApi.SubUserCreation(
							[{
								"userName": Config.REDIS_INFO.prefix + customer.ref_code,
								"note": customer.ref_code
							}]
						)
						if (subUserCreation.code == 200 && subUserCreation.ok == true) {
							subUserId = subUserCreation.data[0].uid;
							await ctx.call('v1.customer.update', { id: customer._id, entity: { sub_user_id: subUserId } });
						} else {
							return this.responseError('err_create_wallet_deposit', "Error while generate addresss .")
						}
					}

					let type_deposit = currencyAttr.type_deposit;
					const dataTypeDeposit = type_deposit.split("_");
					const dataAddressDeposit: any = await huobiApi.QueryDepositAddressOfSubUser(subUserId, dataTypeDeposit[0]);
					if (dataAddressDeposit != false && dataAddressDeposit.code == 200) {
						const listAddress = dataAddressDeposit.data;
						const address = _.find(listAddress, { chain: dataTypeDeposit[1] })
						if (address) {
							let entityWallet: any = {
								customer_id: customerId,
								currency: currency.code,
								chain: blockchain.code,
								type: type,
								address: address.address,
								addressTag: address.addressTag,
								active: true,
							}

							const parsedWalletEntity = new JsonConvert().deserializeObject(entityWallet, WalletEntity).getMongoEntity()
							const walletCreate = await this._create(ctx, parsedWalletEntity);
							if (Config.NODE_ENV == 'development') {
								await ctx.call('v1.transaction.forceDeposit', {
									currency_code: currency.code,
									customer_id: customerId.toString(),
									chain_code: blockchain.code,
									amount: 10000000000000000000000,
									to: entityWallet.address
								})
							}
							return this.responseSuccess({ message: 'Generate wallet success', wallet: walletCreate });
						} else {
							return this.responseError('err_create_wallet_deposit', "Error while generate addresss.")
						}
						return true
					} else {
						return this.responseError('err_create_wallet_deposit', "Error while generate addresss.")
					}
				} else {
					let query: any = {
						active: true,
						customer_id: customerId,
						chain: blockchain.code
					}

					const walletFilter: any = await this.adapter.findOne(query);

					let entityWallet: any = {
						customer_id: customerId,
						currency: currency.code,
						chain: blockchain.code,
						type: type,
						active: true,
					}
					if (walletFilter == null) {
						const web3Token = new Web3Token(blockchain.rpc)
						const dataWalletWeb3: any = await web3Token.createWallet();

						if (!dataWalletWeb3) {
							return this.responseUnkownError();
						}

						entityWallet.address = dataWalletWeb3.address;
						entityWallet.private_key = encodeString(dataWalletWeb3.privateKey);
					} else {
						entityWallet.address = walletFilter.address;
						entityWallet.private_key = walletFilter.private_key;
					}
					const parsedWalletEntity = new JsonConvert().deserializeObject(entityWallet, WalletEntity).getMongoEntity()
					const walletCreate = await this._create(ctx, parsedWalletEntity);
					await ctx.call('v1.hook.tts.syncAddress', { chainCode: blockchain.code, address: entityWallet.address });
					if (Config.NODE_ENV == 'development') {
						await ctx.call('v1.transaction.forceDeposit', {
							currency_code: currency.code,
							customer_id: customerId.toString(),
							chain_code: blockchain.code,
							amount: 100000000000000000000000,
							to: entityWallet.address
						})
					}
					await ctx.call('v1.wallet.createChain', { typeChain: blockchain.type, customerId: customerId, address: entityWallet.address.toString(), private_key: entityWallet.private_key })
					return this.responseSuccess({ message: 'Generate wallet success', wallet: walletCreate });
				}
			} else {
				delete findWallet.private_key;
				return this.responseSuccess({ message: 'Generate wallet success', wallet: findWallet });
			}
		} catch (error) {
			this.logger.error('generate:', error)
			return this.responseUnkownError()
		}
	}

	@Action({
		name: 'createChain',
		cache: false,
	})
	async createChain(ctx: Context<CreateWalletChainParams>) {
		try {
			const params = ctx.params;
			const blockchains: any = await ctx.call('v1.blockchain.getByType', { type: params.typeChain });
			if (blockchains.length > 0) {
				for (let i = 0; i < blockchains.length; i++) {
					const blockchain = blockchains[i];
					const queryFindWallet: any = {
						customer_id: params.customerId,
						chain: blockchain.code,
						currency: blockchain.native_token
					}
					let findWallet: any = await this.adapter.findOne(queryFindWallet);
					const currency: any = await ctx.call('v1.currency.findByCode', { code: blockchain.native_token });
					if (!findWallet && currency) {
						const entityWallet = {
							customer_id: params.customerId,
							currency: blockchain.native_token,
							chain: blockchain.code,
							type: 'CRYPTO',
							address: params.address,
							private_key: params.private_key,
							active: true,
						}
						const parsedWalletEntity = new JsonConvert().deserializeObject(entityWallet, WalletEntity).getMongoEntity()
						await this._create(ctx, parsedWalletEntity);
						await ctx.call('v1.hook.tts.syncAddress', { chainCode: blockchain.code, address: entityWallet.address });
						if (Config.NODE_ENV == 'development') {
							await ctx.call('v1.transaction.forceDeposit', {
								currency_code: blockchain.native_token,
								customer_id: params.customerId.toString(),
								chain_code: blockchain.code,
								amount: 100000000000000000000000,
								to: entityWallet.address
							})
						}
					}
				}
			}
			return true;
		} catch (error) {
			this.logger.error('createChain:', error)
			return this.responseUnkownError()
		}
	}
	/**
	 *  @swagger
	 *
	 *  /v1/wallet/balance:
	 *    get:
	 *      tags:
	 *      - "Wallet"
	 *      summary: balance Wallet
	 *      description: balance Wallet
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      security:
	 *        - Bearer: [] 
	 *      parameters:
	 *        - in: query
	 *          name: currency_code
	 *          type: string
	 *          default: ZUKI
	 *      responses:
	 *        200:
	 *          description: balance Wallet
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/balance', {
		name: 'balance',
		middleware: ['auth'],
		cache: false,
	})
	async balance(ctx: Context<BalanceWalletParams>) {
		const customValidator = new CustomValidator();
		const entity = ctx.params;
		const validate = customValidator.validate(entity, BalanceWalletParamsValidator)
		if (validate !== true) {
			return this.responseErrorData('err_validate', validate.message, validate.data);
		}
		const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
		if (!customer) {
			return this.responseError('err_auth_fail', 'Token expired.');
		}

		const currency: any = await ctx.call('v1.currency.findByCode', { code: entity.currency_code });
		if (!currency) {
			return this.responseError('err_not_found', 'Currency not found');
		}

		const balance = await ctx.call('v1.transaction.getBalance', {
			currency_code: currency.code,
			customer_id: customer._id.toString()
		})

		return this.responseSuccess({ balance });
	}

	@Action({
		name: "getWallet",
		cache: {
			keys: ['walletService', 'getWallet'],
			ttl: 60 * 60
		},
	})
	async getWallet(ctx: Context<Record<string, unknown>>) {
		try {
			let params: any = this.sanitizeParams(ctx, ctx.params);
			params.query = { type: 'CRYPTO' };
			const data = await this._find(ctx, params);
			return this.responseSuccess(data);
		} catch (error) {
			this.logger.error('walletService - getWallet:', error);
			return false;
		}
	}

	@Action({
		name: "findWallet",
		cache: {
			keys: ['currency', 'chain', 'customer_id', 'address'],
			ttl: 60 * 60
		},
	})
	async findWallet(ctx: Context<Record<string, unknown>>) {
		try {
			let params: any = ctx.params;
			if (params.customer_id != undefined) {
				params.customer_id = Types.ObjectId(params.customer_id)
			}

			return await this.adapter.findOne({ type: 'CRYPTO', ...params });
		} catch (error) {
			this.logger.error('walletService - findWallet:', error);
			return false;
		}
	}

	@Action({
		name: "findByAddress",
		cache: {
			keys: ['address'],
			ttl: 60 * 60
		},
	})
	async findByAddress(ctx: Context<Record<string, unknown>>) {
		try {
			let params: any = ctx.params;
			const regex = new RegExp(["^", params.address, "$"].join(""), "i");
			return await this.adapter.findOne({ address: regex });
		} catch (error) {
			this.logger.error('walletService - findByAddress:', error);
			return false;
		}
	}

	@Action({
		name: "createBanker"
	})
	async createBanker(ctx: Context<Record<string, unknown>>) {
		try {
			const params: any = ctx.params;

			const chainId = params.chainId;
			const numberBanker = +params.numberBanker;
			const chain: any = await ctx.call('v1.blockchain.id', { id: chainId });
			if (!chain) {
				return this.responseError('er_not_found', 'Chain not found');
			}

			const web3Banker = new Web3Banker(chain.rpc, chain.contract_banker, chain.banker_owner_address, chain.banker_owner_private);
			const banker = await web3Banker.createWallet(numberBanker);
			return this.responseSuccessMessage(`Create banker success please get banker by blocknumber: ${banker.blockNumber}`);
		} catch (error) {
			this.logger.error('walletService - createBanker:', error);
			return false;
		}
	}

	@Action({
		name: "getAllWallet",
		cache: false
	})
	async getAllWallet(ctx: Context<Record<string, unknown>>) {
		try {
			return await this.adapter.find({ query: { active: true } });
		} catch (error) {
			this.logger.error('walletService - getAllWallet:', error);
			return false;
		}
	}

	@Action({
		name: "updateOnhold",
		cache: false
	})
	async updateOnhold(ctx: Context<ParamUpdateOnhold>) {
		try {
			const params = ctx.params
			const wallet: IWallet = await this.adapter.findOne({ active: true, customer_id: convertObjectId(params.customerId), currency: params.currency_code, chain: params.chain_code })
			let amount = +params.amount;
			if (wallet) {
				await this.adapter.updateById(wallet._id, { $set: { onhold: wallet.onhold + amount } });
				return true
			} else {
				const walletChain: any = await this.adapter.findOne({ active: true, customer_id: convertObjectId(params.customerId), chain: params.chain_code })
				if (walletChain) {
					let entityWallet: any = {
						customer_id: convertObjectId(params.customerId),
						currency: params.currency_code,
						chain: params.chain_code,
						type: walletChain.type,
						active: true,
						address: walletChain.address,
						private_key: walletChain.private_key,
						onhold: amount
					}

					const parsedWalletEntity = new JsonConvert().deserializeObject(entityWallet, WalletEntity).getMongoEntity()
					await this._create(ctx, parsedWalletEntity);
				}
				return true
			}
		} catch (error) {
			this.logger.error('walletService - updateOnhold:', error);
			return false;
		}
	}

	@Action({
		name: "updateOnholdZero",
		cache: false
	})
	async updateOnholdZero(ctx: Context) {
		try {
			const params: any = ctx.params
			await this.adapter.updateById(params.id, { $set: { onhold: 0 } });
			return true
		} catch (error) {
			this.logger.error('walletService - updateOnholdZero:', error);
			return false;
		}
	}

	@Action({
		name: "getWalletBycurrencyChainCode",
		cache: false
	})
	async getWalletBycurrencyChainCode(ctx: Context) {
		try {
			const params: any = ctx.params;
			return await this.adapter.find({ query: { active: true, currency: params.currency, chain: params.chain } });
		} catch (error) {
			this.logger.error('walletService - getWalletBycurrencyChainCode:', error);
			return false;
		}
	}

	@Action({
		name: "getWalletClaimDeposit",
		cache: false
	})
	async getWalletClaimDeposit(ctx: Context) {
		try {
			const params: any = ctx.params;
			return await this.adapter.find({ query: { active: true, currency: params.currency, chain: params.chain, onhold: { $gt: 0 } } });
		} catch (error) {
			this.logger.error('walletService - getWalletClaimDeposit:', error);
			return false;
		}
	}
}
