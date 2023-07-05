'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbInvestmentMixin, eventsInvestmentMixin } from '../../mixins/dbMixins';
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
	RestOptions,
	InvestmentServiceOptions,
	InvestmentServiceSettingsOptions,
	actionTransaction,
	paymentMethod,
	statusTransaction,
	ParamBonusActive24H,
	SettingTypes,
	ParamBonusTokenInvest,
	ParamSignInvestment,
	ParamSignInvestmentValidator,
	ParamMetaDataNft,
} from '../../types';
import { ICurrency, IInvestment, IInvestPackage, InvestmentEntity } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters } from 'moleculer-db';
import {
	convertObjectId,
	generateCode,
	delay,
	convertNonDecimal,
	convertDecimal,
} from '../../mixins/dbMixins/helpers.mixin';
import { BotTelegram, Web3Token, PDFHelper, Web3MintNFT } from '../../libraries';
import moment from 'moment';
import { CustomValidator } from '../../validators';
@Service<InvestmentServiceOptions>({
	name: 'investment',
	version: 1,
	mixins: [dbInvestmentMixin, eventsInvestmentMixin],
	settings: {
		rest: '/v1/investment',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'package_id',
			'customer_id',
			'price_invest',
			'price_usd_invest',
			'currency_invest',
			'currency_method_pay_id',
			'bonus_token',
			'currency_bonus_token',
			'dividend_rate',
			'nft_id',
			'nft_image',
			'nft_video',
			'customer_sign_address',
			'customer_sign_date',
			'customer_sign_message',
			'customer_sign_signature',
			'admin_sign_address',
			'admin_sign_date',
			'admin_sign_message',
			'admin_sign_signature',
			'total_bonus_percent',
			'link_contract',
			'status',
			'createdAt',
			'updatedAt',
		],
	},
})
export default class InvestmentService extends MoleculerDBService<
	InvestmentServiceSettingsOptions,
	IInvestment
> {
	/**
	 *  @swagger
	 *
	 *  /v1/investment/list:
	 *    get:
	 *      tags:
	 *      - "Investment"
	 *      summary: get list Investment
	 *      description: get list Investment
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
	 *        - name: customer_id
	 *          description: customer_id
	 *          in: query
	 *          type: string
	 *        - name: package_id
	 *          description: package_id
	 *          in: query
	 *          type: string
	 *        - name: order
	 *          description: order
	 *          in: query
	 *          type: string
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: get list Investment
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
			let params: any = this.sanitizeParams(ctx, ctx.params);
			let query: any = {
				deletedAt: null,
			};

			const customer_id = params.customer_id;
			if (customer_id != undefined && customer_id != null) {
				query.customer_id = convertObjectId(customer_id.toString());
			} else {
				query.customer_id = convertObjectId(customer._id.toString());
			}

			const package_id = params.package_id;
			if (package_id != undefined && package_id != null) {
				query.package_id = convertObjectId(package_id.toString());
			}

			const order = params.order;
			if (order != undefined && order != null) {
				query.order = order;
			}

			if (params.status != undefined) {
				query.status = params.status == 'true' ? true : false;
			} else {
				query.status = true;
			}

			params.query = query;
			let investments: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			const dataInvestments = investments.rows;
			let dataRows: any = [];
			for (let i = 0; i < dataInvestments.length; i++) {
				let row: any = dataInvestments[i];
				const packageData: IInvestPackage = await ctx.call('v1.investPackage.findById', {
					invest_package_id: row.package_id,
				});
				row.package = packageData;
				dataRows.push(row);
			}
			investments.rows = dataRows;
			return this.responseSuccess(investments);
		} catch (error) {
			this.logger.error('InvestmentService - list', error);
			return this.responseUnkownError();
		}
	}
	/**
	 *  @swagger
	 *
	 *  /v1/investment/detail:
	 *    get:
	 *      tags:
	 *      - "Investment"
	 *      summary: detail Investment
	 *      description: detail Investment
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: investment_id
	 *          description: investment_id
	 *          in: query
	 *          required: true
	 *          type: string
	 *          example : 6333fc1b85e387279dad7f96
	 *          default : 6333fc1b85e387279dad7f96
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: detail Investment
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/detail', {
		name: 'detail',
		middleware: ['auth'],
		cache: false,
	})
	async detail(ctx: Context) {
		try {
			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (!customer) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
			let params: any = ctx.params;

			let investment: any = await this.adapter.findById(params.investment_id);
			if (investment == null) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.deletedAt != null) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.customer_id.toString() != customer._id.toString()) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			const packageData: IInvestPackage = await ctx.call('v1.investPackage.findById', {
				invest_package_id: investment.package_id,
			});
			investment.package = packageData;
			return this.responseSuccess(investment);
		} catch (error) {
			this.logger.error('InvestmentService - detail', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/investment/invest:
	 *    post:
	 *      tags:
	 *      - "Investment"
	 *      summary: invest InvestPackage
	 *      description: invest InvestPackage
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
	 *                default: Invest Package ID
	 *              currency_method_pay_code:
	 *                type: string
	 *                default: USDT
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: invest InvestPackage
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/invest', {
		name: 'invest',
		middleware: ['auth', 'captcha'],
		cache: false,
	})
	async invest(ctx: Context) {
		try {
			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (!customer) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
			await delay(500);
			const params: any = ctx.params;
			const packageData: IInvestPackage = await ctx.call('v1.investPackage.findById', {
				invest_package_id: params.invest_package_id,
			});
			if (!packageData) {
				return this.responseError('err_not_found', 'Package not found.');
			}

			if (packageData.status == false) {
				return this.responseError('err_not_found', 'Package not found.');
			}

			const currency: ICurrency = await ctx.call('v1.currency.find', {
				currency_id: packageData.currency_invest,
			});
			if (!currency) {
				return this.responseError(
					'err_not_found',
					'Currency invest not found or not active.',
				);
			}
			let currency_method_pay: any = null;
			const currency_method_pay_code = params.currency_method_pay_code;

			if (Array.isArray(packageData.currency_method_pay)) {
				if (packageData.currency_method_pay.includes(currency_method_pay_code)) {
					currency_method_pay = await ctx.call('v1.currency.findByCode', {
						code: currency_method_pay_code,
					});
				} else {
					return this.responseError('err_not_found', 'Currency invest not support.');
				}
			} else {
				return this.responseError(
					'err_not_found',
					'Currency invest not found or not active.',
				);
			}

			if (currency_method_pay == null) {
				return this.responseError(
					'err_not_found',
					'Currency invest not found or not active.',
				);
			}

			const balance: number = await ctx.call('v1.transaction.getBalance', {
				currency_code: currency_method_pay_code,
				customer_id: customer._id,
			});

			const price_usd_invest = packageData.price_invest * +currency.usd_rate;
			const price_invest = price_usd_invest / currency_method_pay.usd_rate;

			if (balance < price_invest) {
				return this.responseError(
					'err_balance_not_enough',
					'The balance in the wallets is not enough for invest.',
				);
			}

			const codeInvest = generateCode(20);
			let entityInvest = {
				code: codeInvest,
				customer_id: convertObjectId(customer._id.toString()),
				package_id: convertObjectId(params.invest_package_id),
				price_invest: packageData.price_invest,
				price_usd_invest: price_usd_invest,
				currency_invest: convertObjectId(packageData.currency_invest.toString()),
				currency_method_pay_id: convertObjectId(currency_method_pay._id.toString()),
				bonus_token: packageData.bonus_token,
				currency_bonus_token: packageData.currency_bonus_token,
				dividend_rate: packageData.dividend_rate,
				total_bonus_percent: 0,
				status: true,
			};
			const parsedOrderEntity = new JsonConvert()
				.deserializeObject(entityInvest, InvestmentEntity)
				.getMongoEntity();
			const investment: any = await this._create(ctx, parsedOrderEntity);

			if (investment) {
				const codeTransaction = generateCode(20);
				let entityCreate = {
					customer: convertObjectId(customer._id.toString()),
					currency: currency_method_pay_code,
					chain: '',
					action: actionTransaction.INVESTMENT,
					amount: price_invest,
					amount_usd: price_usd_invest,
					fee: 0,
					balance: balance - price_invest,
					balanceBefore: balance,
					payment_method: paymentMethod.CRYPTO,
					txhash: codeTransaction,
					from: '',
					to: '',
					order: investment._id.toString(),
					status: statusTransaction.COMPLETED,
				};
				await ctx.call('v1.transaction.create', entityCreate);
				await delay(500);
				await ctx.call('v1.investment.bonusOPParent', {
					investment_id: investment._id.toString(),
				});
				await delay(500);
				await ctx.call('v1.customer.update', {
					id: customer._id,
					entity: { active_package: true },
				});
				await ctx.call('v1.investmentQueue.directCommission', {
					investment_id: investment._id.toString(),
				});
				await ctx.call('v1.investmentQueue.mintNft', {
					investment_id: investment._id.toString(),
				});
				await ctx.call('v1.investmentStatistic.updateData', {
					customer_id: customer._id.toString(),
					action: 'investment',
					amount_invest_usd: price_usd_invest,
				});
				await ctx.call('v1.mail.investSuccess', {
					email: customer.email,
					fullname: customer.profile.fistname,
					subject: 'Investment package success',
					wallet_address: customer.wallet_address,
					package_name: packageData.title,
					package_price_usd: convertNonDecimal(price_usd_invest, 18),
				});

				const now = moment();
				if (
					packageData.amount &&
					packageData.from_date <= now.unix() &&
					packageData.to_date >= now.unix() &&
					packageData.currency_buy.includes(currency_method_pay_code)
				) {
					await ctx.call('v1.investment.bonusInvestBuy', {
						investment_id: investment._id.toString(),
						invest_package_id: params.invest_package_id,
						price_usd_invest: price_usd_invest
					});
				}

				return this.responseSuccessDataMessage('Create invest success', investment);
			} else {
				BotTelegram.sendMessageError(`PackageService - stake: ${entityInvest}`);
				return this.responseError('err_unknown', 'Has error invest');
			}
		} catch (error) {
			this.logger.error('InvestmentService - invest', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/investment/signInvest:
	 *    post:
	 *      tags:
	 *      - "Investment"
	 *      summary: sign Investment
	 *      description: sign Investment
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
	 *              - investment_id
	 *              - address
	 *              - signature
	 *              - message
	 *            properties:
	 *              investment_id:
	 *                type: string
	 *                default: 630d853e005ddf0012f0229e
	 *                summary: Investment ID
	 *              address:
	 *                type: string
	 *                default: 0x1b6d272A7cC15284918d13609a6B37057b0Cf7E3
	 *                summary: address sign message
	 *              signature:
	 *                type: string
	 *                default: 630d853e005ddf0012f0229e
	 *                summary: signature sign message
	 *              message:
	 *                type: string
	 *                default: 630d853e005ddf0012f0229e
	 *                summary: message is Investment ID
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: invest InvestPackage
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/signInvest', {
		name: 'signInvest',
		middleware: ['auth', 'captcha'],
		cache: false,
	})
	async signInvest(ctx: Context<ParamSignInvestment>) {
		try {
			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (!customer) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, ParamSignInvestmentValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const investment: IInvestment = await this.adapter.findById(entity.investment_id);
			if (!investment) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.customer_id.toString() != customer._id.toString()) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.status == false) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.customer_sign_message != '') {
				return this.responseError('err_not_found', 'Investment signed.');
			}

			if (entity.message != entity.investment_id) {
				return this.responseError('err_not_found', 'Verify message fail.');
			}

			const rpcBlockChain: string = await ctx.call('v1.setting.getByKey', {
				key: SettingTypes.RPC_BLOCKCHAIN_SIGN_MESSAGE,
			});
			const web3Token = new Web3Token(rpcBlockChain);
			const checkIsAddress = await web3Token.isAddress(entity.address);
			if (!checkIsAddress) {
				return this.responseError(
					'err_wrong_address',
					'Sign address is not in the correct format.',
				);
			}

			if (customer.wallet_address.toLowerCase() != entity.address.toLowerCase()) {
				return this.responseError(
					'err_data_existed',
					'Sign address not existed in the system.',
				);
			}
			const checkVerifyMessage = await web3Token.verifyMessage(
				entity.address,
				entity.message.toString(),
				entity.signature,
			);
			if (!checkVerifyMessage) {
				return this.responseError('err_verify_fail', 'Verify message fail.');
			}

			const entityUpdate = {
				customer_sign_address: entity.address,
				customer_sign_date: moment().unix(),
				customer_sign_message: entity.message,
				customer_sign_signature: entity.signature,
			};

			await this.adapter.updateById(entity.investment_id, { $set: entityUpdate });
			return this.responseSuccessMessage('Sign investment success');
		} catch (error) {
			this.logger.error('InvestmentService - signInvest', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/investment/submitSAFT:
	 *    post:
	 *      tags:
	 *      - "Investment"
	 *      summary: submitSAFT Investment
	 *      description: submitSAFT Investment
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
	 *              - investment_id
	 *            properties:
	 *              investment_id:
	 *                type: string
	 *                default: 630d853e005ddf0012f0229e
	 *                summary: Investment ID
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: submitSAFT InvestPackage
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/submitSAFT', {
		name: 'submitSAFT',
		middleware: ['auth', 'captcha'],
		cache: false,
	})
	async submitSAFT(ctx: Context) {
		try {
			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (!customer) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}

			const entity: any = ctx.params;

			const investment: IInvestment = await this.adapter.findById(entity.investment_id);
			if (!investment) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.customer_id.toString() != customer._id.toString()) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.status == false) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.customer_sign_message == '') {
				return this.responseError(
					'err_not_found',
					'Investment has not been signed by you.',
				);
			}

			if (investment.admin_sign_message == '') {
				return this.responseError(
					'err_not_found',
					'Investment has not been signed by admin.',
				);
			}
			if (investment.nft_id == 0) {
				return this.responseError('err_not_found', 'Investment has not been minted NFT.');
			}

			if (investment.link_contract != '') {
				return this.responseError(
					'err_not_found',
					'Investment has been submited SAFT contract.',
				);
			}

			const pdfHelper = new PDFHelper();
			const saftContract: any = await pdfHelper.generateSaftContractPdf(investment, customer);
			if (saftContract != null) {
				await this.adapter.updateById(investment._id, {
					$set: { link_contract: saftContract.full_path },
				});
				return this.responseSuccessMessage('Submit SAFT contract success');
			}

			return this.responseSuccessMessage('Submit SAFT contract success');
		} catch (error) {
			this.logger.error('InvestmentService - submitSAFT', error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'bonusActive24H',
		cache: false,
	})
	async bonusActive24H(ctx: Context<ParamBonusActive24H>) {
		try {
			const BONUS_ACTIVE_24H_CURRENCY: string = await this.broker.call(
				'v1.setting.getByKey',
				{ key: SettingTypes.BONUS_ACTIVE_24H_CURRENCY },
			);
			const BONUS_ACTIVE_24H_VALUE: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.BONUS_ACTIVE_24H_VALUE,
			});
			if (BONUS_ACTIVE_24H_VALUE == null || BONUS_ACTIVE_24H_CURRENCY == null) {
				return true;
			}

			const params = ctx.params;
			const investment: IInvestment = await this.adapter.findById(params.investment_id);
			if (investment) {
				const parent: any = await ctx.call('v1.customer.findParentF1', {
					customer_id: investment.customer_id.toString(),
				});
				if (parent) {
					const investmentParent: IInvestment = await this.adapter.findOne({
						customer_id: convertObjectId(parent._id.toString()),
					});
					if (investmentParent) {
						const createdAtInvest = moment(investment.createdAt * 1000);
						const createdAtInvestParent = moment(investmentParent.createdAt * 1000);
						const diffHour = createdAtInvest.diff(createdAtInvestParent, 'hours');
						if (diffHour <= 24 && diffHour >= 0) {
							const currency: ICurrency = await ctx.call('v1.currency.find', {
								currency_id: BONUS_ACTIVE_24H_CURRENCY,
							});
							const balance: number = await ctx.call('v1.transaction.getBalance', {
								currency_code: currency.code,
								customer_id: parent._id.toString(),
							});
							const rate = +BONUS_ACTIVE_24H_VALUE;
							const amountUsd = investment.price_usd_invest * (rate / 100);
							const amountCurrency = amountUsd / currency.usd_rate;
							const codeTransaction = generateCode(20);
							let entityCreate = {
								customer: convertObjectId(parent._id.toString()),
								currency: currency.code,
								chain: '',
								action: actionTransaction.BONUS_ACTIVE_24H,
								amount: amountCurrency,
								amount_usd: amountUsd,
								fee: 0,
								balance: balance + amountCurrency,
								balanceBefore: balance,
								payment_method: paymentMethod.CRYPTO,
								txhash: codeTransaction,
								from: '',
								to: '',
								order: params.investment_id.toString(),
								status: statusTransaction.COMPLETED,
							};
							await ctx.call('v1.transaction.create', entityCreate);
						}
					}
				}
			}
			return true;
		} catch (error) {
			this.logger.error('InvestmentService - bonusActive24H', error);
			return false;
		}
	}

	@Action({
		name: 'bonusOPParent',
		cache: false,
	})
	async bonusOPParent(ctx: Context<ParamBonusTokenInvest>) {
		try {
			const params: any = ctx.params;
			const investment: IInvestment = await this.adapter.findById(params.investment_id);
			if (!investment) {
				return this.responseError('err_not_found', 'Investment not found.');
			}
			const parent: any = await ctx.call('v1.customer.findParentF1', {
				customer_id: investment.customer_id,
			});

			if (parent) {
				if (parent.status_kyc == 2) {
					const amount = +convertDecimal(50, 18);
					const currencyCode = 'OP';
					const currency: ICurrency = await ctx.call('v1.currency.findByCode', {
						code: currencyCode,
					});
					if (currency) {
						const amount_usd = amount * +currency.usd_rate;
						const balance: number = await ctx.call('v1.transaction.getBalance', {
							currency_code: currency.code,
							customer_id: parent._id,
						});
						const codeTransaction = generateCode(20);
						let entityCreate = {
							customer: convertObjectId(parent._id.toString()),
							currency: currencyCode,
							chain: '',
							action: actionTransaction.BONUS_OP_INVEST,
							amount: amount,
							amount_usd: amount_usd,
							fee: 0,
							balance: balance + amount,
							balanceBefore: balance,
							payment_method: paymentMethod.CRYPTO,
							txhash: codeTransaction,
							from: '',
							to: '',
							order: params.investment_id.toString(),
							status: statusTransaction.COMPLETED,
						};
						return await ctx.call('v1.transaction.create', entityCreate);
					}
				}
			}

			return true;
		} catch (error) {
			this.logger.error('InvestmentService - bonusOPParent', error);
			return false;
		}
	}

	@Action({
		name: 'findById',
		cache: {
			keys: ['investment_id'],
			ttl: 60 * 60,
		},
	})
	async findById(ctx: Context) {
		try {
			const params: any = ctx.params;
			const investment: any = await this.adapter.findById(
				convertObjectId(params.investment_id.toString()),
			);
			if (investment) {
				if (investment.deletedAt != null) {
					return false;
				} else {
					return investment;
				}
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error('InvestmentService - findById', error);
			return false;
		}
	}

	@Action({
		name: 'getAllInvest',
		cache: false,
	})
	async getAllInvest(ctx: Context) {
		try {
			return await this.adapter.find({ query: { status: true } });
		} catch (error) {
			this.logger.error('InvestmentService - getAllInvest', error);
			return false;
		}
	}

	@Action({
		name: 'getInvestByCustomer',
		cache: false,
	})
	async getInvestByCustomer(ctx: Context) {
		try {
			const params: any = ctx.params;
			return await this.adapter.find({
				query: { customer_id: convertObjectId(params.customer_id) },
			});
		} catch (error) {
			this.logger.error('InvestmentService - getInvestByCustomer', error);
			return false;
		}
	}

	@Action({
		name: 'metaDataNft',
		cache: false,
	})
	async metaDataNft(ctx: Context<ParamMetaDataNft>) {
		try {
			const params = ctx.params;
			const tokenMint: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.TOKEN_MINT_NFT,
			});

			if (params.contract != tokenMint || params.nft_id == 0 || params.nft_id == undefined) {
				return this.responseError('err_not_found', 'NFT not found');
			}
			const nft: IInvestment = await this.adapter.findOne({ nft_id: +params.nft_id });
			if (nft) {
				const packageData: IInvestPackage = await ctx.call('v1.investPackage.findById', {
					invest_package_id: nft.package_id,
				});
				const customer: any = await ctx.call('v1.customer.findById', {
					customer_id: nft.customer_id,
				});
				let attributes: any = [
					{ trait_type: 'Invest Price', value: convertNonDecimal(nft.price_invest, 18) },
					{ trait_type: 'OPV Bonus', value: convertNonDecimal(nft.bonus_token, 18) },
					{ trait_type: 'Devident', value: `${nft.dividend_rate}%` },
					{
						trait_type: 'Owner Name',
						value: customer.profile.fistname + ' ' + customer.profile.lastname,
					},
					{ trait_type: 'Owner Address', value: customer.profile.address },
				];

				if (packageData.meta_data != undefined && packageData.meta_data != null) {
					if (Array.isArray(packageData.meta_data)) {
						const meta_datas = packageData.meta_data;
						for (let i = 0; i < meta_datas.length; i++) {
							const meta_data = meta_datas[i];
							attributes.push({ trait_type: meta_data.key, value: meta_data.value });
						}
					}
				}

				let data: any = {
					id: nft.nft_id,
					name: packageData.title,
					description: packageData.description,
					image: nft.nft_image != '' ? nft.nft_image : packageData.avatar,
					animation_url: nft.nft_video != '' ? nft.nft_video : packageData.video,
					attributes,
				};
				return this.responseSuccessNon(data);
			} else {
				return this.responseError('err_not_found', 'NFT not found');
			}
		} catch (error) {
			this.logger.error('InvestmentService - metaDataNft', error);
			return this.responseError('err_not_found', 'NFT not found');
		}
	}

	@Action({
		name: 'mintNft',
		cache: false,
	})
	async mintNft(ctx: Context) {
		try {
			const entity: any = ctx.params;
			const investmentId = entity.investment_id;
			if (investmentId == undefined || investmentId == null || investmentId == '') {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			const investment: IInvestment = await this.adapter.findById(investmentId);
			if (!investment) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.status == false) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.nft_id != 0) {
				return this.responseError('err_not_found', 'Investment minted nft.');
			}

			const investPackage: IInvestPackage = await ctx.call('v1.investPackage.findById', {
				invest_package_id: investment.package_id,
			});
			if (!investPackage) {
				return this.responseError('err_not_found', 'Package not found.');
			}

			const customer: any = await ctx.call('v1.customer.findById', {
				customer_id: investment.customer_id,
			});
			if (!customer) {
				return this.responseError('err_not_found', 'Customer not found.');
			}

			const tokenMintRpc: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.TOKEN_MINT_NFT_RPC,
			});
			const tokenMintAbi: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.TOKEN_ABI_MINT_NFT,
			});
			const tokenMint: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.TOKEN_MINT_NFT,
			});
			const web3TokenMint = new Web3MintNFT(
				tokenMintRpc,
				tokenMint,
				JSON.parse(tokenMintAbi),
				'',
				'',
			);
			const nextNftId = await web3TokenMint.getNextNFTId();
			if (nextNftId == false) {
				return this.responseError('err_not_found', 'get next nft id fail.');
			}

			const contractMintAddress: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.CONTRACT_MINT_NFT_TARGET_ADDRESS,
			});
			const contractMintPrivateKey: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.CONTRACT_MINT_NFT_TARGET_PRIVATE_KEY,
			});
			const contractMintRpc: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.CONTRACT_MINT_NFT_RPC,
			});
			const contractMintAbi: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.CONTRACT_ABI_MINT_NFT,
			});
			const contractMint: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.CONTRACT_MINT_NFT,
			});
			const linkScan: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.LINK_SCAN_MINT_NFT,
			});
			const web3ContractMint = new Web3MintNFT(
				contractMintRpc,
				contractMint,
				JSON.parse(contractMintAbi),
				contractMintPrivateKey,
				contractMintAddress,
			);
			const mintNFTBatch = await web3ContractMint.mintNFTBatch(
				customer.wallet_address,
				1,
				investPackage.rare,
			);
			if (mintNFTBatch == false) {
				return this.responseError(
					'err_not_found',
					'Has error when mint NFT please try again.',
				);
			}
			await this.adapter.updateById(investment._id, {
				$set: { nft_id: +nextNftId, admin_mint_nft: '' },
			});
			await ctx.call('v1.mail.mintNftSuccess', {
				email: customer.email,
				nft_id: +nextNftId,
				fullname: customer.profile.fistname,
				subject: 'Mint NFT success',
				wallet_address: customer.wallet_address,
				package_name: investPackage.title,
				link_dapp: linkScan + '/token/' + tokenMint + '?a=' + nextNftId,
				package_price_usd: convertNonDecimal(investment.price_usd_invest, 18),
			});

			return this.responseSuccess({ message: 'Mint nft success' });
		} catch (error) {
			this.logger.error('InvestmentAdminService - mintNFT', error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'bonusInvest',
		cache: false,
	})
	async bonusInvest(ctx: Context) {
		try {
			const investments: InvestmentEntity[] = await this.adapter.find({
				query: { total_bonus_percent: { $lt: 100 }, status: true },
			});
			for (let i = 0; i < investments.length; i++) {
				const now = moment();
				const investment = investments[i];
				const createdAt = moment.unix(investment.createdAt);
				const diffDay = now.diff(createdAt, 'days');
				const divMonth = (diffDay - 1) / 30;
				const countTransaction: any = await ctx.call('v1.transaction.countTransaction', {
					order: investment._id?.toString(),
					customer: investment.customer_id.toString(),
					action: [actionTransaction.BONUS_TOKEN_INVEST],
				});
				const nextTimes = +countTransaction + 1;
				if (
					(Number.isInteger(divMonth) && divMonth >= 1) ||
					(nextTimes < divMonth && divMonth >= 1)
				) {
					await delay(1000);
					const checkTransacion = await ctx.call('v1.transaction.findByQuery', {
						order: investment._id?.toString(),
						customer: investment.customer_id.toString(),
						action: actionTransaction.BONUS_TOKEN_INVEST,
						createdAt: {
							$gt: now.startOf('month').unix(),
							$lt: now.endOf('month').unix(),
						},
					});
					if (!checkTransacion || nextTimes < divMonth) {
						if (divMonth >= 1) {
							let percentBonus = 0.03;
							if (nextTimes == 1) {
								percentBonus = 0.08;
							}

							if (nextTimes == 32) {
								percentBonus = 0.02;
							}

							if (nextTimes == 33) {
								return false;
							}

							const amount = investment.bonus_token * percentBonus;
							const currency_bonus_token: ICurrency = await ctx.call(
								'v1.currency.find',
								{
									currency_id: investment.currency_bonus_token,
								},
							);

							const amount_usd = amount * +currency_bonus_token.usd_rate;

							const balance: number = await ctx.call('v1.transaction.getBalance', {
								currency_code: currency_bonus_token.code,
								customer_id: investment.customer_id,
							});
							const codeTransaction = generateCode(20);
							let entityCreate = {
								customer: convertObjectId(investment.customer_id.toString()),
								currency: currency_bonus_token.code,
								chain: '',
								action: actionTransaction.BONUS_TOKEN_INVEST,
								amount: amount,
								amount_usd: amount_usd,
								fee: 0,
								balance: balance + amount,
								balanceBefore: balance,
								payment_method: paymentMethod.CRYPTO,
								txhash: codeTransaction,
								from: '',
								to: '',
								order: investment._id?.toString(),
								status: statusTransaction.COMPLETED,
							};

							await ctx.call('v1.transaction.create', entityCreate);
							await this.adapter.updateById(investment._id, {
								$set: {
									total_bonus_percent:
										investment.total_bonus_percent + percentBonus * 100,
								},
							});
						}
					}
				}
			}
			return true;
		} catch (error) {
			this.logger.error('InvestmentAdminService - bonusInvest', error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'bonusInvestItem',
		cache: false,
	})
	async bonusInvestItem(ctx: Context) {
		try {
			const now = moment();
			const investment: IInvestment = await this.adapter.findById('6333fc1b85e387279dad7f96');
			const createdAt = moment.unix(investment.createdAt);
			const diffDay = now.diff(createdAt, 'days');
			const divMonth = (diffDay - 1) / 30;
			const countTransaction: any = await ctx.call('v1.transaction.countTransaction', {
				order: investment._id?.toString(),
				customer: investment.customer_id.toString(),
				action: [actionTransaction.BONUS_TOKEN_INVEST],
			});
			console.log('createdAt:', createdAt);
			console.log('now:', now);
			console.log(countTransaction);
			console.log(divMonth);

			const nextTimes = +countTransaction + 1;
			console.log(nextTimes);
			if (
				(Number.isInteger(divMonth) && divMonth >= 1) ||
				(nextTimes < divMonth && divMonth >= 1)
			) {
				await delay(1000);
				const checkTransacion = await ctx.call('v1.transaction.findByQuery', {
					order: investment._id?.toString(),
					customer: investment.customer_id.toString(),
					action: actionTransaction.BONUS_TOKEN_INVEST,
					createdAt: { $gt: now.startOf('month').unix(), $lt: now.endOf('month').unix() },
				});
				console.log(checkTransacion);

				if (!checkTransacion || nextTimes < divMonth) {
					console.log(nextTimes);

					if (divMonth >= 1) {
						console.log(2222);

						let percentBonus = 0.03;
						if (nextTimes == 1) {
							percentBonus = 0.08;
						}

						if (nextTimes == 32) {
							percentBonus = 0.02;
						}

						if (nextTimes == 33) {
							return false;
						}

						const amount = investment.bonus_token * percentBonus;
						const currency_bonus_token: ICurrency = await ctx.call('v1.currency.find', {
							currency_id: investment.currency_bonus_token,
						});

						const amount_usd = amount * +currency_bonus_token.usd_rate;

						const balance: number = await ctx.call('v1.transaction.getBalance', {
							currency_code: currency_bonus_token.code,
							customer_id: investment.customer_id,
						});

						const codeTransaction = generateCode(20);
						let entityCreate = {
							customer: convertObjectId(investment.customer_id.toString()),
							currency: currency_bonus_token.code,
							chain: '',
							action: actionTransaction.BONUS_TOKEN_INVEST,
							amount: amount,
							amount_usd: amount_usd,
							fee: 0,
							balance: balance + amount,
							balanceBefore: balance,
							payment_method: paymentMethod.CRYPTO,
							txhash: codeTransaction,
							from: '',
							to: '',
							order: investment._id?.toString(),
							status: statusTransaction.COMPLETED,
						};
						// await ctx.call('v1.transaction.create', entityCreate);
						// console.log(entityCreate);

						// await this.adapter.updateById(investment._id, {
						// 	$set: {
						// 		total_bonus_percent:
						// 			investment.total_bonus_percent + percentBonus * 100,
						// 	},
						// });
					}
				}
			}
			return true;
		} catch (error) {
			this.logger.error('InvestmentAdminService - bonusInvest', error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'updateInvest12',
		cache: false,
	})
	async updateInvest12(ctx: Context) {
		try {
			const now = moment();
			const investments: InvestmentEntity[] = await this.adapter.find({
				query: {
					createdAt: {
						$gt: now.startOf('month').unix(),
						$lt: now.endOf('month').unix(),
					},
				},
			});
			for (let i = 0; i < investments.length; i++) {
				const investment = investments[i];
				const investmentStatistic: any = await ctx.call(
					'v1.investmentStatistic.findStatisticData',
					{ month: 12, year: 2022, customer_id: investment.customer_id },
				);
				if (!investmentStatistic) {
					await ctx.call('v1.investmentStatistic.updateData', {
						customer_id: investment.customer_id.toString(),
						action: 'investment',
						amount_invest_usd: investment.price_usd_invest,
					});
				}
			}
			return true;
		} catch (error) {
			this.logger.error('InvestmentAdminService - bonusInvest', error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'bonusInvestBuy',
		cache: false,
	})
	async bonusInvestBuy(ctx: Context) {
		try {
			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');

			let params: any = ctx.params;
			const investPackage: IInvestPackage = await ctx.call('v1.investPackage.findById', {
				invest_package_id: params.invest_package_id,
			});

			const currency_bonus_token: ICurrency = await ctx.call('v1.currency.find', {
				currency_id: investPackage.currency,
			});

			const price_usd_invest = +params.price_usd_invest;
			const price_invest = price_usd_invest / currency_bonus_token.usd_rate;

			let amount = investPackage.amount;
			if (investPackage.amount_type === 0) {
				amount = price_invest * (investPackage.amount / 100);
			}

			const amount_usd = amount * +currency_bonus_token.usd_rate;

			const balance: number = await ctx.call('v1.transaction.getBalance', {
				currency_code: currency_bonus_token.code,
				customer_id: customer._id.toString(),
			});

			const codeTransaction = generateCode(20);
			let entityCreate = {
				customer: customer._id,
				currency: currency_bonus_token.code,
				chain: '',
				action: actionTransaction.BONUS_TOKEN_BUY_INVEST,
				amount: amount,
				amount_usd: amount_usd,
				fee: 0,
				balance: balance + amount,
				balanceBefore: balance,
				payment_method: paymentMethod.CRYPTO,
				txhash: codeTransaction,
				from: '',
				to: '',
				order: params.investment_id,
				status: statusTransaction.COMPLETED,
			};

			await ctx.call('v1.transaction.create', entityCreate);
			return true;
		} catch (error) {
			this.logger.error('InvestmentService - bonusInvestBuy', error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'countInvestment',
		cache: false
	})
	async countInvestment(ctx: Context) {
		try {
			const params: any = ctx.params;
			let query: any = {
				deletedAt: null
			}

			if (params.customer_id != undefined && params.customer_id != null) {
				query.customer_id = convertObjectId(params.customer_id)
			}
			if (params.from_date != undefined && params.from_date != "" && params.to_date != undefined && params.to_date != "") {
				query.createdAt = {
					$gte: +params.from_date,
					$lt: +params.to_date
				};
			}
			return await this._count(ctx, { query });
		} catch (error) {
			this.logger.error("InvestmentService - countInvestment", error)
			return false;
		}
	}
}
