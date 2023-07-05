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
	actionTransaction,
	paymentMethod,
	statusTransaction,
	InvestmentAdminServiceOptions,
	InvestmentAdminServiceSettingsOptions,
	DividendInvestParams,
	DividendInvestParamsValidator,
	ParamSignInvestment,
	ParamSignInvestmentValidator,
	SettingTypes,
} from '../../types';
import { ICurrency, IInvestment, IInvestPackage, InvestmentEntity } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters } from 'moleculer-db';
import {
	convertNonDecimal,
	convertObjectId,
	generateCode,
} from '../../mixins/dbMixins/helpers.mixin';
import { BotTelegram, Web3MintNFT, Web3Token, PDFHelper } from '../../libraries';
import { CustomValidator } from '../../validators';
import moment from 'moment';
const ExcelJS = require('exceljs');

@Service<InvestmentAdminServiceOptions>({
	name: 'admin.investment',
	version: 1,
	mixins: [dbInvestmentMixin, eventsInvestmentMixin],
	settings: {
		rest: '/v1/admin/investment',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'package_id',
			'customer_id',
			'price_invest',
			'price_usd_invest',
			'currency_invest',
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
export default class InvestmentAdminService extends MoleculerDBService<
	InvestmentAdminServiceSettingsOptions,
	IInvestment
> {
	/**
	 *  @swagger
	 *
	 *  /v1/admin/investment/list:
	 *    get:
	 *      tags:
	 *      - "Admin Investment"
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
	 *        - name: status_sign
	 *          description: status sign
	 *          in: query
	 *          type: boolean
	 *          example : true
	 *          default : true
	 *        - name: status_mint
	 *          description: status mint
	 *          in: query
	 *          type: boolean
	 *          example : true
	 *          default : true
	 *        - name: status_image
	 *          description: status mint
	 *          in: query
	 *          type: boolean
	 *          example : true
	 *          default : true
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

			if (params.status_sign == 'false') {
				query.admin_sign_message = '';
			}

			if (params.status_sign == 'true') {
				query.admin_sign_message = { $ne: '' };
			}

			if (params.status_mint == 'false') {
				query.nft_id = 0;
			}

			if (params.status_mint == 'true') {
				query.nft_id = { $ne: 0 };
			}

			if (params.status_image == 'false') {
				query.nft_image = '';
			}

			if (params.status_image == 'true') {
				query.nft_image = { $ne: '' };
			}

			params.query = query;
			let investments: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			return this.responseSuccess(investments);
		} catch (error) {
			this.logger.error('InvestmentAdminService - list', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/investment/detail:
	 *    get:
	 *      tags:
	 *      - "Admin Investment"
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
		middleware: ['authAdmin'],
		cache: false,
	})
	async detail(ctx: Context) {
		try {
			let params: any = ctx.params;

			let investment: any = await this.adapter.findById(params.investment_id);
			if (investment == null) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.deletedAt != null) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			return this.responseSuccess(investment);
		} catch (error) {
			this.logger.error('InvestmentService - detail', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/investment/dividend:
	 *    post:
	 *      tags:
	 *      - "Admin Investment"
	 *      summary: dividend Investment
	 *      description: dividend Investment
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
	 *              - total_amount
	 *            properties:
	 *              total_amount:
	 *                type: integer
	 *                default: 10000000000000000
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: dividend Investment
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/dividend', {
		name: 'dividend',
		middleware: ['authAdmin'],
		cache: false,
	})
	async dividend(ctx: Context<DividendInvestParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, DividendInvestParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const investments: IInvestment[] = await this.adapter.find({
				query: { deletedAt: null, status: true },
			});
			if (investments && investments.length > 0) {
				for (let i = 0; i < investments.length; i++) {
					const investment = investments[i];

					const currency: ICurrency = await ctx.call('v1.currency.find', {
						currency_id: investment.currency_invest,
					});
					if (!currency) {
						return this.responseError(
							'err_not_found',
							'Currency invest not found or not active.',
						);
					}

					const balance: number = await ctx.call('v1.transaction.getBalance', {
						currency_code: currency.code,
						customer_id: investment.customer_id,
					});

					const amount = entity.total_amount * (investment.dividend_rate / 100);
					const amountUsd = amount * currency.usd_rate;
					const codeTransaction = generateCode(20);
					let entityCreate = {
						customer: convertObjectId(investment.customer_id.toString()),
						currency: currency.code,
						chain: '',
						action: actionTransaction.DIVIDEND,
						amount: amount,
						amount_usd: amountUsd,
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
				}
			}
			return this.responseSuccess({ message: 'Sent dividend success' });
		} catch (error) {
			this.logger.error('InvestmentAdminService - invest', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/investment/mintNft:
	 *    post:
	 *      tags:
	 *      - "Admin Investment"
	 *      summary: mintNft Investment
	 *      description: mintNft Investment
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
	 *                default: 632d701495fd9546a85195db
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: mintNft Investment
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/mintNft', {
		name: 'mintNft',
		middleware: ['authAdmin'],
		cache: false,
	})
	async mintNft(ctx: Context) {
		try {
			const user: any = await ctx.call('v1.admin.user.resolveTokenHeader');
			if (!user) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}

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
				$set: { nft_id: +nextNftId, admin_mint_nft: user._id.toString() },
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
	/**
	 *  @swagger
	 *
	 *  /v1/admin/investment/updateImageNft:
	 *    post:
	 *      tags:
	 *      - "Admin Investment"
	 *      summary: updateImageNft Investment
	 *      description: updateImageNft Investment
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
	 *                default: 632d701495fd9546a85195db
	 *              avatar:
	 *                type: string
	 *                default: 632d701495fd9546a85195db
	 *              video:
	 *                type: string
	 *                default: 632d701495fd9546a85195db
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: updateImageNft Investment
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/updateImageNft', {
		name: 'updateImageNft',
		middleware: ['authAdmin'],
		cache: false,
	})
	async updateImageNft(ctx: Context) {
		try {
			const user: any = await ctx.call('v1.admin.user.resolveTokenHeader');
			if (!user) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}

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

			if (investment.nft_image != '') {
				return this.responseError('err_not_found', 'Investment image nft updated.');
			}

			let avatar = '';
			const checkFileAvatar: any = await ctx.call('v1.files.find', { id: entity.avatar });
			if (checkFileAvatar.status == 'error') {
				return checkFileAvatar;
			} else {
				avatar = checkFileAvatar.data.full_link;
			}

			let video = '';
			const checkFileVideo: any = await ctx.call('v1.files.find', { id: entity.video });
			if (checkFileVideo.status == 'error') {
				return checkFileVideo;
			} else {
				video = checkFileVideo.data.full_link;
			}

			await this.adapter.updateById(investment._id, {
				$set: { nft_image: avatar, nft_video: video, admin_image_nft: user._id.toString() },
			});
			return this.responseSuccess({ message: 'Update image nft success' });
		} catch (error) {
			this.logger.error('InvestmentAdminService - updateImageNft', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/investment/signInvest:
	 *    post:
	 *      tags:
	 *      - "Admin Investment"
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
	 *          description: sign Investment
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/signInvest', {
		name: 'signInvest',
		middleware: ['authAdmin'],
		cache: false,
	})
	async signInvest(ctx: Context<ParamSignInvestment>) {
		try {
			const user: any = await ctx.call('v1.admin.user.resolveTokenHeader');
			if (!user) {
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

			if (investment.status == false) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			if (investment.admin_sign_message != '') {
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

			const checkVerifyMessage = await web3Token.verifyMessage(
				entity.address,
				entity.message.toString(),
				entity.signature,
			);
			if (!checkVerifyMessage) {
				return this.responseError('err_verify_fail', 'Verify message fail.');
			}

			const entityUpdate = {
				admin_sign_address: entity.address,
				admin_sign_date: moment().unix(),
				admin_sign_message: entity.message,
				admin_sign_signature: entity.signature,
				admin_sign_id: user._id.toString(),
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
	 *  /v1/admin/investment/resendCommission:
	 *    post:
	 *      tags:
	 *      - "Admin Investment"
	 *      summary: resend Commission
	 *      description: resend Commission
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
	 *          description: resendCommission
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/resendCommission', {
		name: 'resendCommission',
		middleware: ['authAdmin'],
		cache: false,
	})
	async resendCommission(ctx: Context<ParamSignInvestment>) {
		try {
			const user: any = await ctx.call('v1.admin.user.resolveTokenHeader');
			if (!user) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
			const entity = ctx.params;
			const investment: IInvestment = await this.adapter.findById(entity.investment_id);
			if (!investment) {
				return this.responseError('err_not_found', 'Investment not found.');
			}

			await ctx.call('v1.directCommission.commissionInvest', { investment_id: entity.investment_id })
			return this.responseSuccessMessage('Resend investment commission success');
		} catch (error) {
			this.logger.error('InvestmentService - resendCommission', error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/investment/reSubmitSAFT:
	 *    post:
	 *      tags:
	 *      - "Admin Investment"
	 *      summary: reSubmitSAFT
	 *      description: reSubmitSAFT
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
	 *          description: reSubmitSAFT
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/reSubmitSAFT', {
		name: 'reSubmitSAFT',
		middleware: ['authAdmin'],
		cache: false,
	})
	async reSubmitSAFT(ctx: Context) {
		try {
			const entity: any = ctx.params;

			const investment: IInvestment = await this.adapter.findById(entity.investment_id);
			if (!investment) {
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

			const customer = await ctx.call('v1.customer.findById', { customer_id: investment.customer_id })
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
		name: 'reportTotal',
		cache: false,
	})
	async reportTotal(ctx: Context) {
		try {
			const investments: any = await this.adapter.find({ query: { deletedAt: null } });
			const workbook = new ExcelJS.Workbook();
			let worksheet = workbook.addWorksheet("Sheet 1");
			worksheet.columns = [
				{ header: "Fullname", key: "full_name" },
				{ header: "Phone Number", key: "phone_number" },
				{ header: "Email", key: "email" },
				{ header: "Wallet Address", key: "wallet_address" },
				{ header: "Title NFT", key: "title_nft" },
				{ header: "Dividend rate", key: "dividend_rate" },
				{ header: "Created at", key: "created_at" },
			];
			for (let i = 0; i < investments.length; i++) {
				const investment = investments[i]
				const investPackage: IInvestPackage = await ctx.call('v1.investPackage.findById', {
					invest_package_id: investment.package_id,
				});
				const customer: any = await ctx.call('v1.customer.findById', {
					customer_id: investment.customer_id,
				});
				worksheet.addRow({
					full_name: customer.profile.fistname + " " + customer.profile.lastname,
					phone_number: customer.profile.phone_number,
					email: customer.email,
					wallet_address: customer.wallet_address,
					title_nft: investPackage.title,
					dividend_rate: investment.dividend_rate,
					created_at: moment.unix(investment.createdAt).format('H:i:s DD-MM-YYYY')
				})
			}
			const fileName = moment().unix() + "-report-investment.xlsx";
			workbook.xlsx.writeFile("./public/" + fileName)
			return this.responseSuccessMessage('Submit SAFT contract success');

		} catch (error) {
			this.logger.error('InvestmentService - reportTotal', error);
			return this.responseUnkownError();
		}
	}
}
