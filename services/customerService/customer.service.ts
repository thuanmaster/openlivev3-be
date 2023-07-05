'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import {
	Action,
	Delete,
	Get,
	Method,
	Post,
	Put,
	Service,
	Event,
} from '@ourparentcenter/moleculer-decorators-extended';
import bcrypt from 'bcryptjs';
import { dbCustomerMixin, eventsCustomerMixin, generateCodeAny } from '../../mixins/dbMixins';
import {
	MoleculerDBService,
	RestOptions,
	CustomersServiceOptions,
	CustomersServiceSettingsOptions,
	CustomerCreateParamsValidator,
	CustomerParamsVerifyMessageValidator,
	CustomerCreateParams,
	VerifyMessageParams,
	ActiveAccountParams,
	LoginParams,
	TypeCode,
	VerifyLoginParams,
	ForgotPasswordParams,
	ForgotPasswordParamsValidator,
	RequestForgotPasswordParams,
	RequestForgotPasswordParamsValidator,
	ParamResolveToken,
	UpdateProfileParams,
	UpdateProfileParamsValidator,
	ParamCheckRole,
	CustomerRole,
	ParamUpdate2FA,
	CustomerEvent,
	ActiveAccountParamsValidator,
	SystemCommissionType,
	SettingTypes,
	ParamVerifyUpdateWalletAddress,
	VerifyUpdateWalletAddressValidator,
} from '../../types';
import { CustomValidator } from '../../validators';
import { CustomerEntity, ICustomer } from '../../entities';
import { JsonConvert } from 'json2typescript';
import { convertObjectId, encryptPassword } from '../../mixins/dbMixins/helpers.mixin';
import moment from 'moment';
import { Otplib, BotTelegram, recursiveUtil } from '../../libraries';
import { Web3Token } from '../../libraries';
import _ from 'lodash';

@Service<CustomersServiceOptions>({
	name: 'customer',
	version: 1,
	mixins: [dbCustomerMixin, eventsCustomerMixin],
	settings: {
		idField: '_id',
		pageSize: 10,
		rest: '/v1/customer',
		fields: [
			'_id',
			'email',
			'wallet_address',
			'ref_code',
			'status',
			'status_2fa',
			'status_kyc',
			'sub_user_id',
			'sponsor_id',
			'sponsor_floor',
			'level_commission',
			'active_package',
			'createdAt',
			'updatedAt',
		],
	},
})
export default class CustomerService extends MoleculerDBService<
	CustomersServiceSettingsOptions,
	ICustomer
> {
	/**
	 *  @swagger
	 *
	 *  /v1/customer/signup:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: signup new customer
	 *      description: signup new customer
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - email
	 *              - password
	 *              - phone_number
	 *              - country
	 *              - fistname
	 *              - lastname
	 *            properties:
	 *              email:
	 *                type: string
	 *                default: linhdev92@gmail.com
	 *                description: email
	 *              wallet_address:
	 *                type: string
	 *                default: '0x4FE06902Fa26c4Ca1b67353eFfd461D47a9452De'
	 *                description: wallet_address
	 *              password:
	 *                type: string
	 *                default: 1234567890
	 *                description: password
	 *              country:
	 *                type: string
	 *                default: VN
	 *                description: country
	 *              fistname:
	 *                type: string
	 *                default: fistname
	 *                description: fistname
	 *              lastname:
	 *                type: string
	 *                default: lastname
	 *                description: lastname
	 *              sponsorKey:
	 *                type: string
	 *                default: sponsorKey
	 *                description: sponsorKey
	 *              phone_number:
	 *                type: string
	 *                default: 1234567890
	 *                description: phone_number
	 *              phone_code:
	 *                type: string
	 *                default: +84
	 *                description: phone_code
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: signup success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/signup', {
		name: 'signup',
		middleware: ['captcha'],
		cache: false,
	})
	async signup(ctx: Context<CustomerCreateParams>) {
		try {
			const rpcBlockChain: string = await this.broker.call('v1.setting.getByKey', {
				key: 'RPC_BLOCKCHAIN_SIGN_MESSAGE',
			});
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, CustomerCreateParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const sponsorKey = entity.sponsorKey;
			let sponsor: any = null;
			if (sponsorKey != null && sponsorKey != '') {
				sponsor = await ctx.call('v1.customer.findBySponsorKey', { ref_code: sponsorKey });
				if (!sponsor) {
					return this.responseError('err_not_found', 'Sponsor not found.');
				} else {
					if (sponsor.status == false) {
						return this.responseError('err_not_found', 'Sponsor not found.');
					}
				}
			}

			const checkCountryCode = await ctx.call('v1.country.CheckCode', {
				code: entity.country,
			});
			if (!checkCountryCode) {
				return this.responseError('err_data_existed', 'Country not exsited in system.');
			}

			const foundCustomerByEmail = await this.adapter.findOne({
				email: entity.email.toLowerCase(),
			});
			if (foundCustomerByEmail) {
				return this.responseError('err_data_existed', 'Email Exist in the system.');
			}

			const web3Token = new Web3Token(rpcBlockChain);
			const checkIsAddress = await web3Token.isAddress(entity.wallet_address);

			if (checkIsAddress) {
				const foundCustomerByWalletAddress = await this.adapter.findOne({
					wallet_address: entity.wallet_address,
				});
				if (foundCustomerByWalletAddress) {
					return this.responseError(
						'err_data_existed',
						'Wallet address Exist in the system.',
					);
				}
			} else {
				return this.responseError(
					'err_wrong_address',
					'Wallet address is not in the correct format.',
				);
			}

			let entityCustomer: any = {
				email: entity.email.toLowerCase(),
				wallet_address: entity.wallet_address,
				password: encryptPassword(entity.password),
				status: false,
				sponsor_floor: 0,
				ref_code: generateCodeAny(12),
				roles: [CustomerRole.USER],
			};

			if (sponsor != null) {
				entityCustomer.sponsor_id = sponsor._id.toString();
				entityCustomer.sponsor_floor = sponsor.sponsor_floor + 1;
			} else {
				const sponsorTopId: string = await this.broker.call('v1.setting.getByKey', {
					key: SettingTypes.ID_SPONSOR_TOP,
				});
				if (sponsorTopId != null) {
					const sponsorTop: ICustomer = await this.adapter.findById(sponsorTopId);
					if (sponsorTop) {
						entityCustomer.sponsor_id = sponsorTop._id?.toString();
						entityCustomer.sponsor_floor = sponsorTop.sponsor_floor + 1;
					}
				}
			}

			const parsedCustomerEntity = new JsonConvert()
				.deserializeObject(entityCustomer, CustomerEntity)
				.getMongoEntity();

			const customer = await this._create(ctx, parsedCustomerEntity);
			if (customer) {
				const entityProfile = {
					phone_number: entity.phone_number,
					phone_code: entity.phone_code,
					country: entity.country,
					fistname: entity.fistname,
					lastname: entity.lastname,
					customer_id: customer._id,
				};
				const entityCode = {
					email: entity.email.toLowerCase(),
					customer_id: customer._id,
					fullname: entity.fistname,
					typeCode: TypeCode.ACTIVECODE,
				};

				await ctx.call('v1.CustomerProfile.CreateProfile', entityProfile);
				await ctx.call('v1.CustomerCode.CreateCustomerCode', entityCode);
			}
			return this.responseSuccessMessage(
				'Signup success, Please check your email get active code.',
			);
		} catch (error) {
			this.logger.error('customer.service - signup:' + error);
			return this.responseError('err_signup_account', 'Signup has error');
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/active-account:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: active account
	 *      description: active account
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - email
	 *              - code
	 *            properties:
	 *              email:
	 *                type: string
	 *                default: linhdev92@gmail.com
	 *                description: email
	 *              code:
	 *                type: string
	 *                default: code
	 *                description: code
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: Active account success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/active-account', {
		name: 'active-account',
		middleware: ['captcha'],
		cache: false,
	})
	async activeAccount(ctx: Context<ActiveAccountParams>) {
		try {
			const params = ctx.params;
			const customValidator = new CustomValidator();
			const validate = customValidator.validate(params, ActiveAccountParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const customer: any = await this.adapter.findOne({
				email: params.email.toLowerCase(),
				status: false,
			});
			if (customer) {
				const checkCode = await ctx.call('v1.CustomerCode.CheckCode', {
					customer_id: customer._id,
					code: params.code,
					typeCode: TypeCode.ACTIVECODE,
				});
				if (checkCode) {
					await this._update(ctx, { _id: customer._id, status: true });
					const profile: any = await ctx.call('v1.CustomerProfile.id', {
						customer_id: customer._id,
					});
					await ctx.call('v1.mail.welcome', {
						email: customer.email,
						fullname: profile.fistname,
						subject: 'Register Successfully',
						wallet_address: customer.wallet_address,
					});
					await ctx.call('v1.systemCommission.commission', {
						customer_id: customer._id.toString(),
						type: SystemCommissionType.BONUS_ACTIVE,
					});
					await ctx.call('v1.investmentStatistic.createDataEmpty', {
						customer_id: customer._id.toString(),
					});
					await ctx.call('v1.investmentStatistic.updateData', {
						customer_id: customer._id.toString(),
						action: 'active_account',
					});
					BotTelegram.sendMessageNewUser(
						`New user active email: ${customer.email} --id: ${customer._id}`,
					);
					return this.responseSuccessMessage('Active account success');
				} else {
					return this.responseError('err_code_expired', 'Active code expire.');
				}
			} else {
				return this.responseError('err_not_found', 'Customer not found.');
			}
		} catch (error) {
			this.logger.error('customer.service - activeAccount:' + error);
			return this.responseError('err_active_account', 'Active Account has error');
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/resend-active-code:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: resend active code
	 *      description: resend active code
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - email
	 *            properties:
	 *              email:
	 *                type: string
	 *                default: linhdev92@gmail.com
	 *                description: email
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: Active account success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/resend-active-code', {
		name: 'resend-active-code',
		middleware: ['captcha'],
		cache: false,
	})
	async resendActiveCode(ctx: Context<ActiveAccountParams>) {
		try {
			const params = ctx.params;
			const customer: any = await this.adapter.findOne({
				email: params.email.toLowerCase(),
				status: false,
			});
			if (customer) {
				const profile: any = await ctx.call('v1.CustomerProfile.id', {
					customer_id: customer._id,
				});
				if (profile) {
					const entityCode = {
						email: customer.email,
						customer_id: customer._id.toString(),
						fullname: profile.fistname,
						typeCode: TypeCode.ACTIVECODE,
					};
					const check: any = await ctx.call(
						'v1.CustomerCode.CreateCustomerCode',
						entityCode,
					);
					if (check.status == 'success') {
						return this.responseSuccessMessage('Resend active code success');
					} else {
						return check;
					}
				} else {
					return this.responseError('err_not_found', 'Customer not found.');
				}
			} else {
				return this.responseError('err_not_found', 'Customer not found.');
			}
		} catch (error) {
			this.logger.error('customer.service - resendActiveCode:' + error);
			return this.responseError('err_unknown', 'Resend active code has error');
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/login:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: login customer
	 *      description: login customer
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - email
	 *              - password
	 *            properties:
	 *              email:
	 *                type: string
	 *                default: linhdev92@gmail.com
	 *                description: email
	 *              password:
	 *                type: string
	 *                default: 1234567890
	 *                description: password
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: login success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/login', {
		name: 'login',
		middleware: ['captcha'],
		cache: false,
	})
	async login(ctx: Context<LoginParams>) {
		try {
			const params = ctx.params;
			const customer: any = await this.adapter.findOne({ email: params.email.toLowerCase() });
			if (customer) {
				if (customer.status) {
					const valid = await bcrypt.compare(params.password, customer.password);
					if (valid) {
						let message: string = '';
						let is_email: boolean = false;
						let is_2fa: boolean = false;
						if (customer.status_2fa == 1) {
							is_2fa = true;
							message = 'Enter the 6-digit code from Google Authenticator';
						} else {
							is_email = true;
							message = 'Enter the 6-digit code from Email';
							const profile: any = await ctx.call('v1.CustomerProfile.id', {
								customer_id: customer._id,
							});
							const entityCode = {
								email: customer.email,
								customer_id: customer._id.toString(),
								fullname: profile.fistname,
								typeCode: TypeCode.LOGINCODE,
							};

							await ctx.call('v1.CustomerCode.CreateCustomerCode', entityCode);
						}

						return this.responseSuccess({
							is_email,
							is_2fa,
							message,
							token: customer._id,
						});
					} else {
						return this.responseError('err_auth_fail', 'Email or password is wrong.');
					}
				} else {
					return this.responseErrorData(
						'err_email_active_required',
						'You have not activated your account.',
						{ screen: 'verify_acount' },
					);
				}
			} else {
				return this.responseError('err_not_found', 'Email or password wrong.');
			}
		} catch (error) {
			this.logger.error('customer.service - login:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/verify-login:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: verify login customer
	 *      description: verify login customer
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - token
	 *              - code
	 *              - os
	 *              - device_id
	 *            properties:
	 *              token:
	 *                type: string
	 *                default: "6238a50f1671544cc8c537a7"
	 *                description: token
	 *              code:
	 *                type: string
	 *                default: "12345678"
	 *                description: code
	 *              os:
	 *                type: string
	 *                default: IOS
	 *                description: os
	 *              device_id:
	 *                type: string
	 *                default: 1234567890
	 *                description: device_id
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: verify login success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/verify-login', {
		name: 'verify-login',
		middleware: ['captcha'],
		cache: false,
	})
	async verifyLogin(ctx: Context<VerifyLoginParams>) {
		try {
			const params = ctx.params;
			const meta: any = ctx.meta;
			const customer: any = await this.adapter.findById(params.token);
			if (customer) {
				let entityToken = {
					customer_id: customer._id,
					os: params.os,
					device_id: params.device_id,
				};
				if (customer.status_2fa == 1) {
					const otpLib = new Otplib();
					const verifyToken = otpLib.verifyToken(customer.gg2fa, params.code);
					if (verifyToken) {
						const token = await ctx.call('v1.CustomerToken.CreateToken', entityToken);
						if (token != false) {
							ctx.emit('customerHistory.create', {
								customer_id: customer._id,
								device_id: params.device_id,
								os: params.os,
								ip: meta.clientIp,
								action: 'LOGIN',
							});
							return this.responseSuccess({ message: 'Login success', token });
						} else {
							return this.responseError('err_code_expired', 'Verify code expire.');
						}
					} else {
						return this.responseError('err_code_expired', 'Verify code expire.');
					}
				} else {
					const checkCode = await ctx.call('v1.CustomerCode.CheckCode', {
						customer_id: customer._id,
						code: params.code,
						typeCode: TypeCode.LOGINCODE,
					});
					if (checkCode) {
						const token = await ctx.call('v1.CustomerToken.CreateToken', entityToken);
						if (token != false) {
							ctx.emit('customerHistory.create', {
								customer_id: customer._id,
								device_id: params.device_id,
								os: params.os,
								ip: meta.clientIp,
								action: 'LOGIN',
							});
							return this.responseSuccess({ message: 'Login success', token });
						} else {
							return this.responseError('err_code_expired', 'Verify code expire.');
						}
					} else {
						return this.responseError('err_code_expired', 'Verify code expire.');
					}
				}
			} else {
				return this.responseError('err_not_found', 'Customer not found.');
			}
		} catch (error) {
			this.logger.error('customer.service - login:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/resend-login-code:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: resend login code
	 *      description: resend login code
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - token
	 *            properties:
	 *              token:
	 *                type: string
	 *                default: "6238a50f1671544cc8c537a7"
	 *                description: token
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: resend login success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/resend-login-code', {
		name: 'resend-login-code',
		middleware: ['captcha'],
		cache: false,
	})
	async resendLoginCode(ctx: Context) {
		try {
			const params: any = ctx.params;
			const customer: any = await this.adapter.findById(params.token);
			if (customer) {
				if (customer.status == false) {
					return this.responseError(
						'err_active_account',
						'The account has not been activated.',
					);
				}

				if (customer.status_2fa == 1) {
					return this.responseError(
						'err_status_2fa_active',
						'The account has 2FA enabled.',
					);
				}

				const profile: any = await ctx.call('v1.CustomerProfile.id', {
					customer_id: customer._id,
				});
				if (profile) {
					const entityCode = {
						email: customer.email,
						customer_id: customer._id.toString(),
						fullname: profile.fistname,
						typeCode: TypeCode.LOGINCODE,
					};
					const check: any = await ctx.call(
						'v1.CustomerCode.CreateCustomerCode',
						entityCode,
					);
					if (check.status == 'success') {
						return this.responseSuccessMessage('Resend login code success');
					} else {
						return check;
					}
				} else {
					return this.responseError('err_not_found', 'Customer not found.');
				}
			} else {
				return this.responseError('err_not_found', 'Customer not found.');
			}
		} catch (error) {
			this.logger.error('customer.service - resendActiveCode:' + error);
			return this.responseError('err_unknown', 'Resend active code has error');
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/request-forgot-password:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: request forgot password
	 *      description: request forgot password
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - email
	 *            properties:
	 *              email:
	 *                type: string
	 *                default: linhdev92@gmail.com
	 *                description: email
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: request forgot password success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/request-forgot-password', {
		name: 'request-forgot-password',
		middleware: ['captcha'],
		cache: false,
	})
	async requestForgotPassword(ctx: Context<RequestForgotPasswordParams>) {
		try {
			const params = ctx.params;
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, RequestForgotPasswordParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}
			const customer: any = await this.adapter.findOne({
				email: params.email.toLowerCase(),
				status: true,
			});
			if (customer) {
				const profile: any = await ctx.call('v1.CustomerProfile.id', {
					customer_id: customer._id,
				});
				if (profile) {
					const entityCode = {
						email: customer.email,
						customer_id: customer._id.toString(),
						fullname: profile.fistname,
						typeCode: TypeCode.FORGOTPASSWORD,
					};

					const check: any = await ctx.call(
						'v1.CustomerCode.CreateCustomerCode',
						entityCode,
					);
					if (check.status == 'success') {
						return this.responseSuccessMessage('Send Change Password code success');
					} else {
						return check;
					}
				} else {
					return this.responseError('err_not_found', 'Customer not found.');
				}
			} else {
				return this.responseError('err_not_found', 'Customer not found.');
			}
		} catch (error) {
			this.logger.error('customer.service - requestForgotPassword:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/forgot-password:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: Forgot password
	 *      description: Forgot password
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - in: body
	 *          name: params
	 *          schema:
	 *            type: object
	 *            required:
	 *              - email
	 *              - code
	 *              - new_password
	 *            properties:
	 *              email:
	 *                type: string
	 *                default: linhdev92@gmail.com
	 *                description: email
	 *              code:
	 *                type: string
	 *                default: 123456
	 *                description: code
	 *              new_password:
	 *                type: string
	 *                default: 1234567890
	 *                description: new password
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: request forgot password success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/forgot-password', {
		name: 'forgot-password',
		middleware: ['captcha'],
		cache: false,
	})
	async forgotPassword(ctx: Context<ForgotPasswordParams>) {
		try {
			const params = ctx.params;
			const customValidator = new CustomValidator();
			const validate = customValidator.validate(params, ForgotPasswordParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}
			const customer: any = await this.adapter.findOne({
				email: params.email.toLowerCase(),
				status: true,
			});
			if (customer) {
				const profile: any = await ctx.call('v1.CustomerProfile.id', {
					customer_id: customer._id,
				});
				if (profile) {
					const checkCode = await ctx.call('v1.CustomerCode.CheckCode', {
						customer_id: customer._id,
						code: params.code,
						typeCode: TypeCode.FORGOTPASSWORD,
					});
					if (checkCode) {
						await this._update(ctx, {
							_id: customer._id,
							password: encryptPassword(params.new_password),
						});
						const meta: any = ctx.meta;
						const token = meta.authorization;
						this.broker.cacher?.clean('customer.resolveToken.' + token);
						return this.responseSuccessMessage('Update password success');
					} else {
						return this.responseError(
							'err_code_expired',
							'Forgot password code expire.',
						);
					}
				} else {
					return this.responseError('err_not_found', 'Customer not found.');
				}
			} else {
				return this.responseError('err_not_found', 'Customer not found.');
			}
		} catch (error) {
			this.logger.error('customer.service - forgotPassword:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/logout:
	 *    get:
	 *      tags:
	 *      - "Customers"
	 *      summary: logout Customer
	 *      description: logout Customer
	 *      security:
	 *        - Bearer: []
	 *      parameters:
	 *        - in: query
	 *          name: type
	 *          type: string
	 *          default: all
	 *          description: type logout
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: logout success
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/logout', {
		name: 'logout',
		middleware: ['auth'],
		cache: false,
	})
	async logout(ctx: Context<string, Record<string, any>>) {
		try {
			const params: any = ctx.params;
			const token = ctx.meta.authorization;
			const customer: any = await ctx.call('v1.customer.resolveToken', { token });
			if (customer) {
				await ctx.call('v1.CustomerToken.deleteToken', {
					token: token,
					customer_id: customer._id,
					type: params.type,
				});
				this.broker.cacher?.clean('customer.resolveToken.' + token);
				return this.responseSuccess({ message: 'Logout success' });
			} else {
				return this.responseError('err_not_found', 'Customer not found');
			}
		} catch (error) {
			this.logger.error('customer.service - logout:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/profile:
	 *    get:
	 *      tags:
	 *      - "Customers"
	 *      summary: profile Customer
	 *      description: profile Customer
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: logout success
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/profile', {
		name: 'profile',
		middleware: ['auth'],
		cache: false,
	})
	async profile(ctx: Context<string, Record<string, any>>) {
		try {
			const token = ctx.meta.authorization;
			let customer: any = await ctx.call('v1.customer.resolveToken', { token });
			if (customer) {
				const profile: any = await ctx.call('v1.CustomerProfile.id', {
					customer_id: customer._id,
				});
				if (profile) {
					customer.profile = profile;
				}
				if (customer.status == false) {
					delete customer.ref_code;
				}
				return this.responseSuccess(customer);
			} else {
				return this.responseError('err_not_found', 'Customer not found');
			}
		} catch (error) {
			this.logger.error('customer.service - profile:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/report:
	 *    get:
	 *      tags:
	 *      - "Customers"
	 *      summary: Customer report
	 *      description: Customer report
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: Customer report
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/report', {
		name: 'report',
		middleware: ['auth'],
		cache: false,
	})
	async report(ctx: Context<string, Record<string, any>>) {
		try {
			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (!customer) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}

			const countF1 = await this.adapter.count({
				query: { sponsor_id: customer._id.toString() },
			});
			return this.responseSuccess({ countF1 });
		} catch (error) {
			this.logger.error('customer.service - report:' + error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'resolveTokenHeader',
		cache: false,
	})
	async resolveTokenHeader(ctx: Context<string, Record<string, any>>) {
		try {
			const token = ctx.meta.authorization;
			const checkToken: any = await ctx.call('v1.CustomerToken.resolveToken', {
				token: token,
			});
			if (checkToken) {
				let customer: any = await this.adapter.findById(checkToken.customer_id);
				if (customer) {
					const profile: any = await ctx.call('v1.CustomerProfile.id', {
						customer_id: customer._id,
					});
					customer.profile = profile;
					return customer;
				} else {
					return false;
				}
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error resolving token Header', ctx.meta.authorization, e);
			return false;
		}
	}

	@Action({
		name: 'resolveToken',
		cache: false,
	})
	async resolveToken(ctx: Context<ParamResolveToken>) {
		try {
			const params = ctx.params;
			const checkToken: any = await ctx.call('v1.CustomerToken.resolveToken', {
				token: params.token,
			});
			if (checkToken) {
				return this._get(ctx, { id: checkToken.customer_id });
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error resolving token', ctx.params.token, e);
			return false;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/update-profile:
	 *    put:
	 *      tags:
	 *      - "Customers"
	 *      summary: update profile Customer
	 *      description: update profile Customer
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
	 *              - phone_number
	 *              - country
	 *              - fistname
	 *              - lastname
	 *              - birthday
	 *              - address
	 *            properties:
	 *              phone_number:
	 *                type: string
	 *                default: 09090909
	 *                description: phone_number
	 *              phone_code:
	 *                type: string
	 *                default: +84
	 *                description: phone_code
	 *              country:
	 *                type: string
	 *                default: VI
	 *                description: country
	 *              fistname:
	 *                type: string
	 *                default: fistname
	 *                description: fistname
	 *              lastname:
	 *                type: string
	 *                default: lastname
	 *                description: lastname
	 *              address:
	 *                type: string
	 *                default: address
	 *                description: address
	 *              avatar:
	 *                type: string
	 *                default: avatar
	 *                description: avatar
	 *              birthday:
	 *                type: date
	 *                default: 1992-12-22
	 *                description: birthday
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: update profile success
	 *        403:
	 *          description: Server error
	 */
	@Put<RestOptions>('/update-profile', {
		name: 'update-profile',
		middleware: ['auth', 'captcha'],
		cache: false,
	})
	async updateProfile(ctx: Context<UpdateProfileParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;

			const validate = customValidator.validate(entity, UpdateProfileParamsValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const checkCountryCode: any = await ctx.call('v1.country.CheckCode', {
				code: entity.country,
			});
			if (!checkCountryCode) {
				return this.responseError('err_not_found', 'Country not exsited in system.');
			}

			let customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (customer) {
				if (entity.wallet_address != '' && entity.wallet_address != null) {
					const regex = new RegExp(['^', entity.wallet_address, '$'].join(''), 'i');
					const checkWalletAddress: any = await this.adapter.findOne({
						wallet_address: regex,
					});
					if (checkWalletAddress) {
						if (checkWalletAddress._id.toString() != customer._id.toString()) {
							return this.responseError(
								'err_data_existed',
								'Wallet address existed in the system.',
							);
						} else {
							await this.adapter.updateById(customer._id, {
								$set: { wallet_address: entity.wallet_address },
							});
						}
					}
				}
				const profile: any = await ctx.call('v1.CustomerProfile.id', {
					customer_id: customer._id,
				});
				if (profile) {
					let checkFile: any = null;
					if (entity.avatar != null) {
						checkFile = await ctx.call('v1.files.find', { id: entity.avatar });
						if (checkFile.status == 'error') {
							return checkFile;
						}
					}
					let entityProfile: any = {
						phone_number: entity.phone_number,
						phone_code: entity.phone_code,
						country: entity.country,
						fistname: entity.fistname,
						lastname: entity.lastname,
						address: entity.address,
						birthday: moment(entity.birthday).format('YYYY-MM-DD'),
					};

					if (checkFile != null) {
						entityProfile.avatar = checkFile.data.full_link;
						await ctx.call('v1.files.delete', { id: entity.avatar });
					}

					const checkUpdate = await ctx.call('v1.CustomerProfile.updateProfile', {
						id: profile._id,
						entity: entityProfile,
					});
					if (checkUpdate) {
						const meta: any = ctx.meta;
						const token = meta.authorization;
						this.broker.cacher?.clean('customer.resolveToken.' + token);
						return this.responseSuccess({ message: 'Update profile success' });
					} else {
						return this.responseError('err_update_profile', 'Update profile failed.');
					}
				} else {
					return this.responseError('err_not_found', 'Customer not found.');
				}
			} else {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
		} catch (error) {
			this.logger.error('customer.service - updateProfile:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/update-wallet-address:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: update-wallet-address Customer
	 *      description: update-wallet-address Customer
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
	 *              - wallet_address
	 *            properties:
	 *              wallet_address:
	 *                type: string
	 *                default: 0x1b6d272A7cC15284918d13609a6B37057b0Cf7E3
	 *                description: wallet address
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: update profile success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/update-wallet-address', {
		name: 'update-wallet-address',
		middleware: ['auth', 'captcha'],
		cache: false,
	})
	async updateWalletAddress(ctx: Context) {
		try {
			const entity: any = ctx.params;
			let customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (customer) {
				if (customer.status_2fa != 1) {
					return this.responseError(
						'err_status_2fa_active',
						'Update wallet address require 2FA.',
					);
				}
				if (entity.wallet_address != '' && entity.wallet_address != null) {
					const regex = new RegExp(['^', entity.wallet_address, '$'].join(''), 'i');
					const checkWalletAddress: any = await this.adapter.findOne({
						wallet_address: regex,
					});
					if (checkWalletAddress) {
						if (checkWalletAddress._id.toString() != customer._id.toString()) {
							return this.responseError(
								'err_data_existed',
								'Wallet address existed in the system.',
							);
						}
					}
					const entityCode = {
						email: customer.email,
						customer_id: customer._id,
						fullname: customer.profile.fistname,
						typeCode: TypeCode.UPDATE_WALLET_ADDRESS,
					};
					await ctx.call('v1.CustomerCode.CreateCustomerCode', entityCode);
					return this.responseSuccessMessage('Please check your email get code.');
				} else {
					return this.responseError('err_not_found', 'Wallet address is required.');
				}
			} else {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
		} catch (error) {
			this.logger.error('customer.service - updateProfile:' + error);
			return this.responseUnkownError();
		}
	}
	/**
	 *  @swagger
	 *
	 *  /v1/customer/resend-email-update-wallet-address:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: resend-email-update-wallet-address Customer
	 *      description: resend-email-update-wallet-address Customer
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: resend-email-update-wallet-address success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/resend-email-update-wallet-address', {
		name: 'resend-email-update-wallet-address',
		middleware: ['auth', 'captcha'],
		cache: false,
	})
	async resendEmailUpdateWalletAddress(ctx: Context) {
		try {
			let customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (customer) {
				if (customer.status_2fa != 1) {
					return this.responseError(
						'err_status_2fa_active',
						'Update wallet address require 2FA.',
					);
				}
				const entityCode = {
					email: customer.email,
					customer_id: customer._id.toString(),
					fullname: customer.profile.fistname,
					typeCode: TypeCode.UPDATE_WALLET_ADDRESS,
				};
				const check: any = await ctx.call('v1.CustomerCode.CreateCustomerCode', entityCode);
				if (check.status == 'success') {
					return this.responseSuccessMessage('Resend update wallet address code success');
				} else {
					return check;
				}
			} else {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
		} catch (error) {
			this.logger.error('customer.service - resendEmailUpdateWalletAddress:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/verify-update-wallet-address:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: verify-update-wallet-address Customer
	 *      description: verify-update-wallet-address Customer
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
	 *              - wallet_address
	 *              - email_code
	 *              - 2fa_code
	 *            properties:
	 *              wallet_address:
	 *                type: string
	 *                default: 0x1b6d272A7cC15284918d13609a6B37057b0Cf7E3
	 *                description: wallet address
	 *              code_email:
	 *                type: string
	 *                default: 123456
	 *                description: email_code
	 *              code_2fa:
	 *                type: string
	 *                default: 123456
	 *                description: 2fa_code
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: verify-update-wallet-address success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/verify-update-wallet-address', {
		name: 'verify-update-wallet-address',
		middleware: ['auth', 'captcha'],
		cache: false,
	})
	async verifyUpdateWalletAddress(ctx: Context<ParamVerifyUpdateWalletAddress>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, VerifyUpdateWalletAddressValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			let customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (customer) {
				if (customer.status_2fa != 1) {
					return this.responseError(
						'err_status_2fa_active',
						'Update wallet address require 2FA.',
					);
				}

				if (entity.wallet_address != '' && entity.wallet_address != null) {
					const regex = new RegExp(['^', entity.wallet_address, '$'].join(''), 'i');
					const checkWalletAddress: any = await this.adapter.findOne({
						wallet_address: regex,
					});
					if (checkWalletAddress) {
						if (checkWalletAddress._id.toString() != customer._id.toString()) {
							return this.responseError(
								'err_data_existed',
								'Wallet address existed in the system.',
							);
						}
					}

					const otpLib = new Otplib();
					const verifyAuth = otpLib.verifyToken(
						customer.gg2fa,
						entity.code_2fa.toString(),
					);
					if (!verifyAuth) {
						return this.responseError('err_code_expired', 'Verify code expire.');
					}

					const checkCode = await ctx.call('v1.CustomerCode.CheckCode', {
						customer_id: customer._id,
						code: entity.code_email,
						typeCode: TypeCode.UPDATE_WALLET_ADDRESS,
					});
					if (!checkCode) {
						return this.responseError('err_code_expired', 'Verify code expire.');
					}
					await this.adapter.updateById(customer._id, {
						$set: { wallet_address: entity.wallet_address },
					});

					return this.responseSuccessMessage('Update wallet address success');
				} else {
					return this.responseError('err_not_found', 'Wallet address is required.');
				}
			} else {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
		} catch (error) {
			this.logger.error('customer.service - updateProfile:' + error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'checkRole',
		cache: {
			keys: ['customer', 'checkRole'],
			ttl: 30 * 60, // 0,5 hour
		},
	})
	async checkRole(ctx: Context<ParamCheckRole>) {
		try {
			const params = ctx.params;
			const checkToken: any = await ctx.call('v1.CustomerToken.resolveToken', {
				token: params.token,
			});
			if (checkToken) {
				const customer: any = await this._get(ctx, { id: checkToken.customer_id });
				if (customer) {
					const roles = customer.roles;
					const role = params.role;
					if (roles.includes(role)) {
						return true;
					} else {
						return false;
					}
				} else {
					return false;
				}
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error checkRole', ctx.params.token, e);
			return false;
		}
	}

	@Action({
		name: 'customerUpdate2FA',
		cache: false,
	})
	async customerUpdate2FA(ctx: Context<ParamUpdate2FA>) {
		try {
			const params = ctx.params;
			const customer: any = await this._get(ctx, { id: params.customer_id });
			if (customer) {
				let dataUpdate: any = {
					_id: params.customer_id,
				};
				if (params.code != null) {
					dataUpdate.gg2fa = params.code;
				}
				if (params.status != null) {
					dataUpdate.status_2fa = params.status;
				}
				const meta: any = ctx.meta;
				const token = meta.authorization;
				this.broker.cacher?.clean('customer.resolveToken.' + token);
				return await this._update(ctx, dataUpdate);
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error customerUpdate2FA', e);
			return false;
		}
	}

	@Action({
		name: 'update',
		cache: false,
	})
	async updateCustomer(ctx: Context) {
		try {
			const params: any = ctx.params;
			await this.adapter.updateById(params.id, { $set: params.entity });
			return true;
		} catch (e) {
			this.logger.error('Error updatecustomer', e);
			return false;
		}
	}

	@Action({
		name: 'findById',
		cache: false,
	})
	async findById(ctx: Context) {
		try {
			const params: any = ctx.params;
			let customer: any = await this.adapter.findById(params.customer_id);
			if (customer) {
				const profile: any = await ctx.call('v1.CustomerProfile.id', {
					customer_id: customer._id,
				});
				customer.profile = profile;
				return customer;
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('customerService findById:', e);
			return false;
		}
	}

	@Action({
		name: 'findByEmail',
		cache: false,
	})
	async findByEmail(ctx: Context<string, Record<string, any>>) {
		try {
			const params: any = ctx.params;
			let customer: any = await this.adapter.findOne({ email: params.email });
			if (customer) {
				const profile: any = await ctx.call('v1.CustomerProfile.id', {
					customer_id: customer._id,
				});
				customer.profile = profile;
				return customer;
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('customerService findById:', e);
			return false;
		}
	}

	@Action({
		name: 'findBySponsorKey',
		cache: {
			keys: ['ref_code'],
			ttl: 30 * 60, // 0,5 hour
		},
	})
	async findBySponsorKey(ctx: Context<string, Record<string, any>>) {
		try {
			const params: any = ctx.params;
			let customer: any = await this.adapter.findOne({
				ref_code: params.ref_code,
				status: true,
			});
			if (customer) {
				return customer;
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('customerService findBySponsorKey:', e);
			return false;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/2fa/create:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: Create 2FA
	 *      description: Create 2FA
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      security:
	 *        - Bearer: []
	 *      responses:
	 *        200:
	 *          description: Create 2FA success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/2fa/create', {
		name: '2fa.create',
		middleware: ['auth', 'captcha'],
		cache: false,
	})
	async create(ctx: Context) {
		try {
			let customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (customer) {
				if (customer.gg2fa == '' || customer.status_2fa == 0) {
					const otpLib = new Otplib();
					const code = otpLib.generateUniqueSecret();
					const update = await ctx.call('v1.customer.customerUpdate2FA', {
						customer_id: customer._id,
						code,
						status: 0,
					});
					if (update) {
						const data = otpLib.generateCode(customer.email, code);
						return this.responseSuccess({ data, code });
					} else {
						return this.responseError(
							'err_update_2fa',
							'Update google authenticator error',
						);
					}
				} else {
					return this.responseError(
						'err_create_2fa',
						'Customer already has google authenticator.',
					);
				}
			} else {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
		} catch (error) {
			this.logger.error('customerKYC.service - create2FA:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/2fa/verify:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: verify 2FA
	 *      description: verify 2FA
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
	 *              - token
	 *            properties:
	 *              token:
	 *                type: string
	 *                default: 123456
	 *                description: token
	 *      responses:
	 *        200:
	 *          description: verify 2FA success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/2fa/verify', {
		name: '2fa.verify',
		middleware: ['auth', 'captcha'],
		cache: false,
	})
	async verify(ctx: Context) {
		try {
			const params: any = ctx.params;
			let customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (customer) {
				if (customer.gg2fa != '') {
					const verifyToken = await ctx.call('v1.customer.CheckToken2FA', {
						gg2fa: customer.gg2fa,
						token: params.token,
					});
					if (verifyToken) {
						const update = await ctx.call('v1.customer.customerUpdate2FA', {
							customer_id: customer._id,
							status: 1,
						});
						if (update) {
							return this.responseSuccess({
								message: 'Verify google authenticator success',
							});
						} else {
							return this.responseError(
								'err_update_2fa',
								'Update google authenticator error',
							);
						}
					} else {
						return this.responseError(
							'err_2fa_expire',
							'Token google authenticator expired',
						);
					}
				} else {
					return this.responseError(
						'err_update_2fa',
						"Customer don't enable google authenticator.",
					);
				}
			} else {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
		} catch (error) {
			this.logger.error('customerKYC.service - login:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/verify-message:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: verify message
	 *      description: verify message
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
	 *              - address
	 *              - signature
	 *              - message
	 *              - os
	 *              - device_id
	 *            properties:
	 *              address:
	 *                type: string
	 *                default: '0x4FE06902Fa26c4Ca1b67353eFfd461D47a9452De'
	 *                description: address
	 *              signature:
	 *                type: string
	 *                default: '123123123'
	 *                description: signature
	 *              message:
	 *                type: number
	 *                default: '123123123'
	 *                description: message
	 *              os:
	 *                type: string
	 *                default: 'IOS'
	 *                description: os
	 *              device_id:
	 *                type: string
	 *                default: '1234567890'
	 *                description: device_id
	 *      responses:
	 *        200:
	 *          description: verify message success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/verify-message', {
		name: 'verify-message',
		middleware: ['captcha'],
		cache: false,
	})
	async verifyMessage(ctx: Context<VerifyMessageParams>) {
		try {
			const customValidator = new CustomValidator();
			const entity = ctx.params;
			const validate = customValidator.validate(entity, CustomerParamsVerifyMessageValidator);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}
			const rpcBlockChain: string = await this.broker.call('v1.setting.getByKey', {
				key: SettingTypes.RPC_BLOCKCHAIN_SIGN_MESSAGE,
			});
			const web3Token = new Web3Token(rpcBlockChain);
			const checkIsAddress = await web3Token.isAddress(entity.address);

			const customer: any = await this.adapter.findOne({
				wallet_address: entity.address,
			});

			if (!checkIsAddress) {
				return this.responseError(
					'err_wrong_address',
					'Wallet address is not in the correct format.',
				);
			}

			if (!customer) {
				return this.responseError(
					'err_data_existed',
					'Wallet address not existed in the system.',
				);
			}

			if (!customer.status) {
				return this.responseErrorData(
					'err_email_active_required',
					'You have not activated your account.',
					{ screen: 'verify_acount', email: customer.email },
				);
			}

			const timestamp = +entity.message;
			const now = moment();
			const timeMessage = moment.unix(timestamp);
			const diff = now.diff(timeMessage, 'minutes');
			if (diff < 0 || diff > 5 || isNaN(diff)) {
				return this.responseError('err_verify_fail', 'Verify message fail.');
			}

			const checkVerifyMessage = await web3Token.verifyMessage(
				entity.address,
				entity.message.toString(),
				entity.signature,
			);

			if (checkVerifyMessage) {
				let entityToken = {
					customer_id: customer._id,
					os: entity.os,
					device_id: entity.device_id,
				};
				const meta: any = ctx.meta;
				const token = await ctx.call('v1.CustomerToken.CreateToken', entityToken);
				if (token != false) {
					ctx.emit('customerHistory.create', {
						customer_id: customer._id,
						device_id: entity.device_id,
						os: entity.os,
						ip: meta.clientIp,
						action: 'LOGIN',
					});
					return this.responseSuccess({ message: 'Login success', token });
				} else {
					return this.responseError('err_verify_code', 'Verify has error.');
				}
			} else {
				return this.responseError('err_verify_fail', 'Verify message fail.');
			}
		} catch (error) {
			this.logger.error('verify message error: ' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/2fa/update:
	 *    post:
	 *      tags:
	 *      - "Customers"
	 *      summary: update statis 2FA
	 *      description: update status 2FA
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
	 *              - token
	 *              - status
	 *            properties:
	 *              token:
	 *                type: string
	 *                default: 123456
	 *                description: token
	 *              status:
	 *                type: boolean
	 *                default: true
	 *                description: tostatusken
	 *      responses:
	 *        200:
	 *          description: update status 2FA success
	 *        403:
	 *          description: Server error
	 */
	@Post<RestOptions>('/2fa/update', {
		name: '2fa.update',
		middleware: ['auth', 'captcha'],
		cache: false,
	})
	async update(ctx: Context) {
		try {
			const params: any = ctx.params;
			let customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (customer) {
				if (customer.gg2fa != '') {
					const verifyToken = await ctx.call('v1.customer.CheckToken2FA', {
						gg2fa: customer.gg2fa,
						token: params.token,
					});
					if (verifyToken) {
						const update = await ctx.call('v1.customer.customerUpdate2FA', {
							customer_id: customer._id,
							status: params.status == true ? 1 : 2,
						});
						if (update) {
							return this.responseSuccess({
								message: 'Update google authenticator success',
							});
						} else {
							return this.responseError(
								'err_update_2fa',
								'Update google authenticator error',
							);
						}
					} else {
						return this.responseError(
							'err_2fa_expire',
							'Token google authenticator expired',
						);
					}
				} else {
					return this.responseError(
						'err_update_2fa',
						"Customer don't enable google authenticator.",
					);
				}
			} else {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
		} catch (error) {
			this.logger.error('customerKYC updateStatus2FA:' + error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'CheckToken2FA',
		cache: false,
	})
	async CheckToken2FA(ctx: Context) {
		try {
			const params: any = ctx.params;
			const otpLib = new Otplib();
			const verifyToken = otpLib.verifyToken(params.gg2fa, params.token);

			if (verifyToken) {
				return true;
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error CheckToken2FA', e);
			return false;
		}
	}

	@Action({
		name: 'totalCustomer',
		cache: false,
	})
	async totalCustomer(ctx: Context) {
		try {
			const params: any = ctx.params;
			let query: any = { status: true };
			if (
				params.from_date != undefined &&
				params.from_date != '' &&
				params.to_date != undefined &&
				params.to_date != ''
			) {
				query.createdAt = {
					$gte: params.from_date,
					$lt: params.to_date,
				};
			}
			return await this._count(ctx, { query });
		} catch (e) {
			this.logger.error('Error totalCustomer', e);
			return false;
		}
	}

	@Action({
		name: 'customerSubAccounnt',
		cache: false,
	})
	async customerSubAccounnt(ctx: Context) {
		try {
			let query: any = { status: { $exists: true } };
			return await this._find(ctx, { query });
		} catch (e) {
			this.logger.error('Error customerSubAccounnt', e);
			return false;
		}
	}

	@Action({
		name: 'getParentCustomer',
		cache: false,
	})
	async getParentCustomer(ctx: Context) {
		try {
			const params: any = ctx.params;
			const customer = await this.adapter.findById(params.customer_id);
			if (customer) {
				let query: any = { sponsor_floor: { $lt: customer.sponsor_floor } };
				const customers = await this._find(ctx, { query });
				return recursiveUtil.getParentCustomer(customers, customer.sponsor_id, [], 1);
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error getParentCustomer', e);
			return false;
		}
	}

	@Action({
		name: 'findParentF1',
		cache: false,
	})
	async findParentF1(ctx: Context) {
		try {
			const params: any = ctx.params;
			const customer = await this.adapter.findById(params.customer_id);
			if (customer) {
				return this.adapter.findById(customer.sponsor_id);
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error('Error findParentF1', e);
			return false;
		}
	}

	@Action({
		name: 'getChildLevelCustomer',
		cache: false,
	})
	async getChildLevelCustomer(ctx: Context) {
		try {
			const params: any = ctx.params;
			let query: any = { sponsor_floor: { $gt: params.sponsor_floor } };
			const customers = await this._find(ctx, { query });
			return recursiveUtil.getChildLevelCustomer(
				customers,
				params.customer_id,
				0,
				+params.level,
			);
		} catch (e) {
			this.logger.error('Error getChildLevelCustomer', e);
			return false;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/getListF1:
	 *    get:
	 *      tags:
	 *      - "Customers"
	 *      summary: get List F1 Customer
	 *      description: get List F1 Customer
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - name: customer_id
	 *          description: customer_id
	 *          in: query
	 *          required: false
	 *          type: string
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: get List F1 Customer
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/getListF1', {
		name: 'getListF1',
		middleware: ['auth'],
		cache: false,
	})
	async getListF1(ctx: Context<string, Record<string, any>>) {
		try {
			const params: any = ctx.params;
			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (!customer) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
			let customer_id = customer._id.toString();
			if (params.customer_id != '' && params.customer_id != null && params.customer_id != undefined) {
				customer_id = params.customer_id;
			}
			const listF1 = await this._find(ctx, { query: { sponsor_id: customer_id } });
			return this.responseSuccess({ listF1 });
		} catch (error) {
			this.logger.error('customer.service - getListF1:' + error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/getProfile:
	 *    get:
	 *      tags:
	 *      - "Customers"
	 *      summary: get profile Customer
	 *      description: get profile Customer
	 *      security:
	 *        - Bearer: []
	 *      produces:
	 *        - application/json
	 *      parameters:
	 *        - name: customer_id
	 *          description: customer_id
	 *          in: query
	 *          required: false
	 *          type: string
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: get profile Customer
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/getProfile', {
		name: 'getProfile',
		middleware: ['auth'],
		cache: false,
	})
	async getProfile(ctx: Context<string, Record<string, any>>) {
		try {
			const params: any = ctx.params;
			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (!customer) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}

			if (params.customer_id != '' && params.customer_id != null && params.customer_id != undefined) {
				const customer = await this.adapter.findById(params.customer_id);
				if (customer) {
					const profile: any = await ctx.call('v1.CustomerProfile.id', {
						customer_id: customer._id,
					});
					if (profile) {
						customer.profile = profile;
					}
					if (customer.status == false) {
						delete customer.ref_code;
					}
					return this.responseSuccess(customer);
				} else {
					return this.responseError('err_not_found', 'Customer not found');
				}
			} else {
				return this.responseError('err_not_found', 'Customer not found');
			}
		} catch (error) {
			this.logger.error('customer.service - getProfile:' + error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'updateLevel',
		cache: false,
	})
	async updateLevel(ctx: Context) {
		try {
			const params: any = ctx.params;
			return await this.adapter.updateById(params.customer_id, {
				$set: { level_commission: params.level },
			});
		} catch (error) {
			this.logger.error('customer.service - updateLevel', error);
			return false;
		}
	}

	@Action({
		name: 'getAll',
		cache: false,
	})
	async getAll(ctx: Context) {
		try {
			return await this.adapter.find({ query: { status: true } });
		} catch (error) {
			this.logger.error('customer.service - getAll', error);
			return false;
		}
	}

	@Action({
		name: 'getAllF1',
		cache: false,
	})
	async getAllF1(ctx: Context) {
		try {
			const params: any = ctx.params;
			return await this._find(ctx, { query: { sponsor_id: params.customer_id } });
		} catch (error) {
			this.logger.error('customer.service - getAllF1', error);
			return false;
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/customer/sumary-floor:
	 *    get:
	 *      tags:
	 *      - "Customers"
	 *      summary: get sumary floor Customer
	 *      description: get sumary floor Customer
	 *      security:
	 *        - Bearer: []
	 *      parameters:
	 *        - name: customer_id
	 *          description: customer_id
	 *          in: query
	 *          required: false
	 *          type: string
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: get List F1 Customer
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/sumary-floor', {
		name: 'sumary-floor',
		middleware: ['auth'],
		cache: false,
	})
	async getSumaryFloor(ctx: Context) {
		try {
			const customer: any = await ctx.call('v1.customer.resolveTokenHeader');
			if (!customer) {
				return this.responseError('err_auth_fail', 'Token expired.');
			}
			const params: any = ctx.params;
			let customer_id = customer._id.toString();
			if (params.customer_id != undefined && params.customer_id != "" && params.customer_id != null) {
				customer_id = params.customer_id
			}
			let result: any = []
			const listF1s = await this._find(ctx, { query: { sponsor_id: customer_id } });
			const listIdF1s = _.map(listF1s, '_id');
			const totalInvestF1: number = await ctx.call('v1.investmentStatistic.totalInvestCustomers', {
				customer_id: listIdF1s,
			});

			let dataF1: any = {
				floor: 1,
				total_member: listF1s.length,
				total_commission: totalInvestF1 * (8 / 100),
				total_volume: totalInvestF1
			};
			result.push(dataF1);
			let dataF2: any = {
				floor: 2,
				total_member: 0,
				total_commission: 0,
				total_volume: 0,
			};
			let listF12: any = [];
			if (listIdF1s.length > 0) {
				listF12 = await this._find(ctx, {
					query: { sponsor_id: { $in: listIdF1s } },
				});
				if (listF12.length > 0) {
					const listIdF2s = _.map(listF12, '_id');
					const totalInvestF2: number = await ctx.call('v1.investmentStatistic.totalInvestCustomers', {
						customer_id: listIdF2s,
					});
					dataF2.total_member = listF12.length;
					dataF2.total_volume = totalInvestF2
					dataF2.total_commission = totalInvestF2 * (3 / 100);
				}
			}
			result.push(dataF2);
			let listF13: any = [];
			let dataF3: any = {
				floor: 3,
				total_member: 0,
				total_commission: 0,
				total_volume: 0,
			};
			if (listF12.length > 0) {
				const listIdF2s = _.map(listF12, '_id');
				listF13 = await this._find(ctx, {
					query: { sponsor_id: { $in: listIdF2s } },
				});
				if (listF13.length > 0) {
					const listIdF3s = _.map(listF13, '_id');
					const totalInvestF3: number = await ctx.call('v1.investmentStatistic.totalInvestCustomers', {
						customer_id: listIdF3s,
					});

					dataF3.total_member = listF13.length;
					dataF3.total_volume = totalInvestF3
					dataF3.total_commission = totalInvestF3 * (1 / 100);
				}
			}
			result.push(dataF3);
			return this.responseSuccess({ result });
		} catch (error) {
			this.logger.error('customer.service - getSumaryFloor:' + error);
			return this.responseUnkownError();
		}
		
	}
	
	@Action({
		name: 'reportSumaryFloor',
		cache: false
	})
	async reportSumaryFloor(ctx: Context) {
		try {
			const params: any = ctx.params;
			let customer_id = params.customer_id.toString();
			let result: any = []
			const listF1s = await this._find(ctx, { query: { sponsor_id: customer_id } });
			const listIdF1s = _.map(listF1s, '_id');
			const totalInvestF1: number = await ctx.call('v1.investmentStatistic.totalInvestCustomers', {
				customer_id: listIdF1s,
			});

			let dataF1: any = {
				floor: 1,
				total_member: listF1s.length,
				total_commission: totalInvestF1 * (6 / 100),
				total_volume: totalInvestF1
			};
			result.push(dataF1);
			let dataF2: any = {
				floor: 2,
				total_member: 0,
				total_commission: 0,
				total_volume: 0,
			};
			let listF12: any = [];
			if (listIdF1s.length > 0) {
				listF12 = await this._find(ctx, {
					query: { sponsor_id: { $in: listIdF1s } },
				});
				if (listF12.length > 0) {
					const listIdF2s = _.map(listF12, '_id');
					const totalInvestF2: number = await ctx.call('v1.investmentStatistic.totalInvestCustomers', {
						customer_id: listIdF2s,
					});
					dataF2.total_member = listF12.length;
					dataF2.total_volume = totalInvestF2
					dataF2.total_commission = totalInvestF2 * (2 / 100);
				}
			}
			result.push(dataF2);
			let listF13: any = [];
			let dataF3: any = {
				floor: 3,
				total_member: 0,
				total_commission: 0,
				total_volume: 0,
			};
			if (listF12.length > 0) {
				const listIdF2s = _.map(listF12, '_id');
				listF13 = await this._find(ctx, {
					query: { sponsor_id: { $in: listIdF2s } },
				});
				if (listF13.length > 0) {
					const listIdF3s = _.map(listF13, '_id');
					const totalInvestF3: number = await ctx.call('v1.investmentStatistic.totalInvestCustomers', {
						customer_id: listIdF3s,
					});

					dataF3.total_member = listF13.length;
					dataF3.total_volume = totalInvestF3
					dataF3.total_commission = totalInvestF3 * (1 / 100);
				}
			}
			result.push(dataF3);
			return this.responseSuccess({ result });
		} catch (error) {
			this.logger.error('customer.service - getSumaryFloor:' + error);
			return this.responseUnkownError();
		}
	}
}
