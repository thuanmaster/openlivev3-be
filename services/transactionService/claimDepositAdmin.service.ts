import moleculer, { ActionParams, Context } from 'moleculer';
import {
	Action,
	Delete,
	Get,
	Method,
	Post,
	Put,
	Service,
} from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters } from 'moleculer-db';
import { dbClaimDepositMixin, eventsClaimDepositMixin, generateCode } from '../../mixins/dbMixins';
import * as _ from 'lodash';
import {
	CrawlDepositParams,
	CrawlDepositParamsValidator,
	MoleculerDBService,
	RestOptions,
	ClaimDepositAdminServiceOptions,
	ClaimDepositAdminServiceSettingsOptions,
} from '../../types';

import {
	IBlockChain,
	IChainWallet,
	ICurrency,
	ICurrencyAttr,
	IClaimDeposit,
	ClaimDepositEntity,
} from '../../entities';
import { CustomValidator } from '../../validators';
import { Web3Deposit, Web3Token } from '../../libraries';
import { decodeString, delay } from '../../mixins/dbMixins/helpers.mixin';
import { JsonConvert } from 'json2typescript';

@Service<ClaimDepositAdminServiceOptions>({
	name: 'admin.ClaimDeposit',
	version: 1,
	mixins: [dbClaimDepositMixin, eventsClaimDepositMixin],
	settings: {
		idField: '_id',
		pageSize: 10,
		rest: '/v1/admin/ClaimDeposit',
		fields: [
			'_id',
			'currency',
			'chain',
			'total_amount',
			'admin_claim',
			'list_crawl',
			'createdAt',
			'updatedAt',
		],
	},
})
export default class ClaimDepositAdminService extends MoleculerDBService<
	ClaimDepositAdminServiceSettingsOptions,
	IClaimDeposit
> {
	/**
	 *  @swagger
	 *
	 *  /v1/admin/ClaimDeposit/list:
	 *    get:
	 *      tags:
	 *      - "Admin ClaimDeposit"
	 *      summary: get list ClaimDeposit
	 *      description: get list ClaimDeposit
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
	 *          description: get list ClaimDeposit
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
			let query: any = {};
			params.query = query;
			const data = await this._list(ctx, { ...params, sort: { createdAt: -1 } });

			const dataHistoryClaim = data.rows;
			let rows: any = [];

			for (let i = 0; i < dataHistoryClaim.length; i++) {
				let historyClaim: any = dataHistoryClaim[i];

				const user: any = await ctx.call('v1.admin.user.findById', {
					user_id: historyClaim.admin_claim,
				});

				if (user) {
					historyClaim.admin_name_claim = user.fullname;
				}

				rows.push(historyClaim);
			}

			data.rows = rows;

			return this.responseSuccess(data);
		} catch (error) {
			this.logger.error('ClaimDepositService - list', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/ClaimDeposit/crawlDeposit:
	 *    post:
	 *      tags:
	 *      - "Admin ClaimDeposit"
	 *      summary: crawlDeposit
	 *      description: crawlDeposit
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - currency_id
	 *              - blockchain_id
	 *            properties:
	 *              currency_id:
	 *                type: string
	 *                default: currency_id
	 *              blockchain_id:
	 *                type: string
	 *                default: blockchain_id
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: crawlDeposit
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/crawlDeposit', {
		name: 'crawlDeposit',
		middleware: ['authAdmin'],
		cache: false,
	})
	async crawlDeposit(ctx: Context<CrawlDepositParams>) {
		try {
			const user: any = await ctx.call('v1.admin.user.resolveTokenHeader');
			if (!user) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, CrawlDepositParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const blockchain: IBlockChain = await ctx.call('v1.blockchain.id', {
				id: entity.blockchain_id,
			});
			if (!blockchain) {
				return this.responseError('err_not_found', 'Blockchain not found');
			}

			const currency: ICurrency = await ctx.call('v1.currency.find', {
				currency_id: entity.currency_id,
			});
			if (!currency) {
				return this.responseError('err_not_found', 'Currency not found');
			}

			const currencyAttr: ICurrencyAttr = await ctx.call('v1.currencyAttr.find', {
				currency_id: currency._id,
				chain_id: blockchain._id,
			});
			if (!currencyAttr) {
				return this.responseError('err_not_found', 'Currency not found');
			}

			await ctx.call('v1.claimDepositQueue.claimDeposit', {
				blockchain_id: entity.blockchain_id,
				currency_id: currency._id,
				user_id: user._id,
			});
			return this.responseSuccessMessage('Claim deposit processing');
		} catch (error) {
			this.logger.error('ClaimDepositService - crawlDeposit', error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'create',
		cache: false,
	})
	async create(ctx: Context) {
		try {
			let entityCreate: any = ctx.params;
			const parsedEntity = new JsonConvert()
				.deserializeObject(entityCreate, ClaimDepositEntity)
				.getMongoEntity();
			return await this._create(ctx, parsedEntity);
		} catch (error) {
			this.logger.error('ClaimDepositService - create', error);
			return false;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/ClaimDeposit/crawlDepositOld:
	 *    post:
	 *      tags:
	 *      - "Admin ClaimDeposit"
	 *      summary: crawlDeposit
	 *      description: crawlDeposit
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - currency_id
	 *              - blockchain_id
	 *            properties:
	 *              currency_id:
	 *                type: string
	 *                default: currency_id
	 *              blockchain_id:
	 *                type: string
	 *                default: blockchain_id
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: crawlDepositOld
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/crawlDepositOld', {
		name: 'crawlDepositOld',
		middleware: ['authAdmin'],
		cache: false,
	})
	async crawlDepositOld(ctx: Context<CrawlDepositParams>) {
		try {
			const user: any = await ctx.call('v1.admin.user.resolveTokenHeader');
			if (!user) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, CrawlDepositParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const blockchain: IBlockChain = await ctx.call('v1.blockchain.id', {
				id: entity.blockchain_id,
			});
			if (!blockchain) {
				return this.responseError('err_not_found', 'Blockchain not found');
			}

			const currency: ICurrency = await ctx.call('v1.currency.find', {
				currency_id: entity.currency_id,
			});
			if (!currency) {
				return this.responseError('err_not_found', 'Currency not found');
			}

			const currencyAttr: ICurrencyAttr = await ctx.call('v1.currencyAttr.find', {
				currency_id: currency._id,
				chain_id: blockchain._id,
			});
			if (!currencyAttr) {
				return this.responseError('err_not_found', 'Currency not found');
			}

			const web3Deposit = new Web3Deposit(
				blockchain.rpc,
				currencyAttr.contract,
				JSON.parse(currencyAttr.abi),
			);

			const wallets: any = await ctx.call('v1.wallet.getWalletBycurrencyChainCode', {
				chain: blockchain.code,
				currency: currency.code,
			});
			if (wallets.length > 0) {
				let walletCrawls = [];
				const walletChain: IChainWallet = await ctx.call('v1.chainWallet.getWalletChain', {
					chainId: blockchain._id?.toString(),
				});
				if (!walletChain) {
					return this.responseError('err_not_found', 'Chain wallet not found');
				}

				for (let i = 0; i < wallets.length; i++) {
					let wallet = wallets[i];
					let balance = await web3Deposit.getBalanceOf(wallet.address);
					balance = +balance;
					if (balance >= currency.min_crawl) {
						wallet.balance = balance;
						walletCrawls.push(wallet);
						await web3Deposit.sendAmountFeeChain(
							wallet.address,
							0.005,
							walletChain.privateKey,
						);
						await delay(500);
					}
				}
				if (walletCrawls.length > 0) {
					const addressRecevie: string = await this.broker.call('v1.setting.getByKey', {
						key: 'WALLET_RECEVIE_DEPOSIT',
					});
					let addressError: any = [];
					if (addressRecevie != null) {
						let total_amount = 0;
						let list_crawl: any = [];
						for (let i = 0; i < walletCrawls.length; i++) {
							const walletCrawl = walletCrawls[i];
							const address = walletCrawl.address;
							const private_key = decodeString(walletCrawl.private_key);
							const crawDeposit = await web3Deposit.crawDeposit(
								private_key,
								address,
								addressRecevie,
								walletCrawl.balance,
							);
							if (crawDeposit != false) {
								total_amount += walletCrawl.balance;
								list_crawl.push({
									address,
									value: walletCrawl.balance,
									txHash: crawDeposit.transactionHash,
								});
							} else {
								addressError.push(address);
							}
							await delay(500);
						}
						const dataCreate = {
							currency: currency.code,
							chain: blockchain.code,
							total_amount: total_amount,
							admin_claim: user._id.toString(),
							list_crawl,
						};

						const parsedTransactionEntity = new JsonConvert()
							.deserializeObject(dataCreate, ClaimDepositEntity)
							.getMongoEntity();
						await this._create(ctx, parsedTransactionEntity);
						if (addressError.length > 0) {
							return this.responseSuccessMessage(
								'Crawl token success, has wallet address error please crawl one more time',
							);
						} else {
							return this.responseSuccessMessage('Crawl token success');
						}
					} else {
						return this.responseError('err_not_found', 'Wallet recevie not found');
					}
				} else {
					return this.responseError('err_not_found', 'Wallets not found');
				}
			} else {
				return this.responseError('err_not_found', 'Wallets not found');
			}
		} catch (error) {
			this.logger.error('ClaimDepositService - crawlDeposit', error);
			return this.responseUnkownError();
		}
	}
}
