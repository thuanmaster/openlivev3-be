'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service, Event } from '@ourparentcenter/moleculer-decorators-extended';
import bcrypt from 'bcryptjs';
import { dbCustomerMixin, eventsCustomerMixin, generateCodeAny } from '../../mixins/dbMixins';
import {
    MoleculerDBService,
    RestOptions,
    CustomerAdminServiceOptions,
    CustomerAdminServiceSettingsOptions,
    CustomerAdminUpdateParams,
    CustomerAdminUpdateParamsValidator,
    CustomerStatus,
    CustomerAdminCreateParams,
    CustomerAdminCreateParamsValidator,
    CustomerRole,
    SystemCommissionType
} from '../../types';
import { CustomValidator } from '../../validators';
import { CustomerEntity, ICustomer, IInvestment, IInvestPackage } from '../../entities';
import { JsonConvert } from 'json2typescript';
import { checkFieldExist, delay, encryptPassword } from '../../mixins/dbMixins/helpers.mixin';
import moment from 'moment';
import { DbContextParameters } from 'moleculer-db';
const ExcelJS = require('exceljs');
import { BotTelegram } from '../../libraries';
import _ from 'lodash';
@Service<CustomerAdminServiceOptions>({
    name: 'admin.customer',
    version: 1,
    mixins: [dbCustomerMixin, eventsCustomerMixin],
    settings: {
        idField: '_id',
        pageSize: 10,
        rest: '/v1/admin/customer',
        fields: [
            '_id',
            'email',
            'status',
            'wallet_address',
            'lock_status',
            'status_2fa',
            'gg2fa',
            'sponsor_id',
            'sponsor_floor',
            'ref_code',
            'status_kyc',
            'createdAt',
            'updatedAt',
        ]
    },
})

export default class CustomerAdminService extends MoleculerDBService<CustomerAdminServiceSettingsOptions, ICustomer> {

    /**
         *  @swagger
         *
         *  /v1/admin/customer/list:
         *    get:
         *      tags:
         *      - "Admin Customer"
         *      summary: list user
         *      description: list user
         *      security:
         *        - Bearer: []
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
         *        - name: email
         *          description: email
         *          in: query
         *          required: false
         *          type: string
         *          example : linhdev92@gmail.com
         *        - name: ref_code
         *          description: ref_code
         *          in: query
         *          required: false
         *          type: string
         *          example : ref_code
         *        - name: status
         *          description: status
         *          in: query
         *          required: false
         *          type: string
         *          example : NORMAL
         *        - name: status_kyc
         *          description: status_kyc
         *          in: query
         *          required: false
         *          type: number
         *          example : 1
         *        - name: diamond_list
         *          description: customer id diamond list
         *          in: query
         *          required: false
         *          type: string
         *          example : 63da948cc1526df66134af65
         *      responses:
         *        200:
         *          description: list success
         *        403:
         *          description: Server error
         */
    @Get<RestOptions>('/list', {
        name: 'list',
        middleware: ['authAdmin'],
        cache: false
    })
    async list(ctx: Context<DbContextParameters>) {
        try {
            let params: any = this.sanitizeParams(ctx, ctx.params);
            let query: any = {}

            if (params.email != undefined) {
                query.email = new RegExp(params.email);
            }

            if (params.status != undefined) {
                query.lock_status = params.status;
            }

            if (params.ref_code != undefined && params.ref_code != "") {
                query.ref_code = params.ref_code;
            }

            if (params.status_kyc != undefined) {
                query.status_kyc = +params.status_kyc;
            }

            if (checkFieldExist(params.diamond_list)) {
                query.sponsor_id = params.diamond_list;
            }
            params.query = query
            const data = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
            return this.responseSuccess(data);
        } catch (error) {
            this.logger.error('customer.service - logout:' + error)
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/customer/sumary-floor:
     *    get:
     *      tags:
     *      - "Admin Customer"
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
        middleware: ['authAdmin'],
        cache: false,
    })
    async getSumaryFloor(ctx: Context) {
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

    /**
     *  @swagger
     *
     *  /v1/admin/customer/detail:
     *    get:
     *      tags:
     *      - "Admin Customer"
     *      summary: detail Customer
     *      description: detail Customer
     *      security:
     *        - Bearer: []
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - name: customer_id
     *          description: customer_id
     *          in: query
     *          required: true
     *          type: string
     *          example : 1
     *          default : 1
     *      responses:
     *        200:
     *          description: get detail Customer success
     *        403:
     *          description: Server error
     */
    @Get<RestOptions>('/detail', {
        name: 'detail',
        middleware: ['authAdmin'],
        cache: false
    })
    async detail(ctx: Context<DbContextParameters>) {
        try {
            let params: any = ctx.params;

            let customer: any = await this.adapter.findById(params.customer_id);
            if (customer) {
                const kyc: any = await ctx.call('v1.customer.kyc.findByCustomerId', { customer_id: customer._id });
                const profile: any = await ctx.call('v1.CustomerProfile.id', { customer_id: customer._id });
                customer.kyc = kyc
                customer.profile = profile
                customer.sponsor = await ctx.call('v1.customer.findById', { customer_id: customer.sponsor_id })
                return this.responseSuccess(customer);
            } else {
                return this.responseError('err_not_found', 'Customer not found.');
            }

        } catch (error) {
            this.logger.error('customerAdmin.service - detail:' + error)
            return this.responseUnkownError();
        }
    }
    /**
     *  @swagger
     *
     *  /v1/admin/customer/report:
     *    get:
     *      tags:
     *      - "Admin Customer"
     *      summary: report Customer
     *      description: report Customer
     *      security:
     *        - Bearer: []
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      parameters:
     *        - name: customer_id
     *          description: customer_id
     *          in: query
     *          required: true
     *          type: string
     *          example : 1
     *          default : 1
     *      responses:
     *        200:
     *          description: get report Customer success
     *        403:
     *          description: Server error
     */
    @Get<RestOptions>('/report', {
        name: 'report',
        middleware: ['authAdmin'],
        cache: false
    })
    async report(ctx: Context<DbContextParameters>) {
        try {
            let params: any = ctx.params;

            let customer: any = await this.adapter.findById(params.customer_id);
            if (customer) {
                const totalF1 = await this.adapter.count({
                    query: { sponsor_id: customer._id.toString() },
                });
                const total_volume = await ctx.call('v1.investmentStatistic.totalTeamVolumn', { customer_id: params.customer_id })
                const total_member = await ctx.call('v1.investmentStatistic.totalTeamMember', { customer_id: params.customer_id })
                let total_vesting: any = await ctx.call('v1.transaction.reportTotal', { customer_id: params.customer_id, action: 'BONUS_TOKEN_INVEST', currency: "OPV" })
                total_vesting = _.sumBy(total_vesting, 'sumAmount');
                let total_commission: any = await ctx.call('v1.transaction.reportTotal', { customer_id: params.customer_id, currency: "OP" })
                total_commission = _.sumBy(total_commission, 'sumAmount');

                return this.responseSuccess({ totalF1, total_volume, total_member, total_vesting, total_commission });
            } else {
                return this.responseError('err_not_found', 'Customer not found.');
            }

        } catch (error) {
            this.logger.error('customerAdmin.service - detail:' + error)
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/customer/create:
     *    post:
     *      tags:
     *      - "Admin Customer"
     *      summary: create Customer
     *      description: create Customer
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
     *              password:
     *                type: string
     *                default: 1234567890
     *                description: password 
     *              phone_number:
     *                type: string
     *                default: 09090909
     *                description: phone_number 
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
     *              status:
     *                type: boolean
     *                default: true
     *                description: status  
     *              sponsor_email:
     *                type: date
     *                default: linhdev92@gmail.com
     *                description: sponsor_email 
     *      consumes:
     *        - application/json
     *      responses:
     *        200:
     *          description: update profile success
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/create', {
        name: 'create',
        middleware: ['authAdmin'],
        cache: false
    })
    async create(ctx: Context<CustomerAdminCreateParams>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, CustomerAdminCreateParamsValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const sponsor_email = entity.sponsor_email;
            let sponsor: any = null;
            if (sponsor_email != null) {
                sponsor = await this.adapter.findOne({ email: sponsor_email });
                if (!sponsor) {
                    return this.responseError('err_not_found', 'Sponsor not found.');
                }
            }

            const checkCountryCode = await ctx.call('v1.country.CheckCode', { code: entity.country });
            if (!checkCountryCode) {
                return this.responseError('err_not_found', 'Country not exsited in system.')
            }

            const foundCustomer = await this.adapter.findOne({ email: entity.email });
            if (foundCustomer) {
                return this.responseError('err_data_existed', 'Email Exist in system.')
            }

            let entityCustomer: any = {
                email: entity.email,
                password: encryptPassword(entity.password),
                status: true,
                ref_code: generateCodeAny(12),
                roles: [CustomerRole.USER]
            }

            if (sponsor != null) {
                entityCustomer.sponsor_id = sponsor._id.toString();
            }
            const parsedCustomerEntity = new JsonConvert().deserializeObject(entityCustomer, CustomerEntity).getMongoEntity()

            const customer = await this._create(ctx, parsedCustomerEntity);
            if (customer) {
                let entityProfile: any = {
                    phone_number: entity.phone_number,
                    country: entity.country,
                    fistname: entity.fistname,
                    lastname: entity.lastname,
                    address: entity.address,
                    customer_id: customer._id
                }
                await ctx.call('v1.CustomerProfile.CreateProfile', entityProfile);
            }
            return this.responseSuccessMessage("Create customer success");
        } catch (error) {
            this.logger.error('CustomerAdminService - create:' + error)
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/customer/update:
     *    put:
     *      tags:
     *      - "Admin Customer"
     *      summary: update Customer
     *      description: update Customer
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
     *              - customer_id
     *            properties:
     *              customer_id:
     *                type: string
     *                default: 09090909
     *                description: customer_id 
     *              email:
     *                type: string
     *                default: linhdev92@gmail.com
     *                description: email 
     *              password:
     *                type: string
     *                default: 1234567890
     *                description: password 
     *              phone_number:
     *                type: string
     *                default: 09090909
     *                description: phone_number 
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
     *              status:
     *                type: boolean
     *                default: true
     *                description: status 
     *              lock_status:
     *                type: string
     *                default: NORMAL
     *                description: status 
     *              birthday:
     *                type: date
     *                default: 1992-12-22
     *                description: birthday 
     *              sponsor_email:
     *                type: date
     *                default: linhdev92@gmail.com
     *                description: sponsor_email 
     *      consumes:
     *        - application/json
     *      responses:
     *        200:
     *          description: update profile success
     *        403:
     *          description: Server error
     */
    @Put<RestOptions>('/update', {
        name: 'update',
        middleware: ['authAdmin'],
        cache: false
    })
    async update(ctx: Context<CustomerAdminUpdateParams>) {
        try {
            const customValidator = new CustomValidator();
            const entity = ctx.params;
            const validate = customValidator.validate(entity, CustomerAdminUpdateParamsValidator)
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }
            let customer: any = await ctx.call('v1.customer.findById', { customer_id: entity.customer_id });
            if (customer) {
                let entityCustomer: any = {};
                let entityProfile: any = {}

                if (entity.country) {
                    const checkCountryCode = await ctx.call('v1.country.CheckCode', { code: entity.country });
                    if (!checkCountryCode) {
                        return this.responseError('err_not_found', 'Country not exsited in system.')
                    } else {
                        entityProfile.country = entity.country;
                    }
                }

                if (entity.email) {
                    const checkEmail: any = await ctx.call('v1.customer.findByEmail', { email: entity.email });
                    if (checkEmail) {
                        if (checkEmail.email != customer.email) {
                            return this.responseError('err_data_existed', 'Email Exist in system.')
                        }
                    } else {
                        entityCustomer.email = entity.email;
                    }
                }
                if (entity.sponsor_email) {
                    const checkSponsorEmail: any = await ctx.call('v1.customer.findByEmail', { email: entity.sponsor_email });
                    if (!checkSponsorEmail) {
                        return this.responseError('err_not_found', 'Sponsor Email not exsited in system.')
                    } else {
                        entityCustomer.sponsor_id = checkSponsorEmail._id.toString();
                    }
                }

                if (entity.password) {
                    entityCustomer.password = encryptPassword(entity.password);
                }

                if (entity.lock_status) {
                    const lock_status: any = CustomerStatus;
                    if (lock_status[entity.lock_status] == undefined) {
                        return this.responseError('err_not_found', 'Status not exist');
                    } else {
                        entityCustomer.lock_status = entity.lock_status;
                    }
                }

                if (entity.status) {
                    entityCustomer.status = entity.status;
                }

                if (entity.phone_number) {
                    entityProfile.phone_number = entity.phone_number;
                }
                if (entity.fistname) {
                    entityProfile.fistname = entity.fistname;
                }
                if (entity.lastname) {
                    entityProfile.lastname = entity.lastname;
                }
                if (entity.address) {
                    entityProfile.address = entity.address;
                }

                if (entity.birthday) {
                    entityProfile.birthday = moment(entity.birthday).format('YYYY-MM-DD');
                }

                await ctx.call('v1.customer.update', { id: customer._id, entity: entityCustomer });
                await ctx.call('v1.CustomerProfile.updateProfile', { id: customer.profile._id, entity: entityProfile });
                return this.responseSuccess({ message: 'Update customer success' });

            } else {
                return this.responseError('err_not_found', 'Customer not found.');
            }
        } catch (error) {
            this.logger.error('CustomerAdminService - update:' + error)
            return this.responseUnkownError();
        }
    }


    /**
     *  @swagger
     *
     *  /v1/admin/customer/kyc/approve:
     *    post:
     *      tags:
     *      - "Admin Customer"
     *      summary: approve kyc Customer
     *      description: approve kyc Customer
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
     *              - customer_id
     *            properties:
     *              customer_id:
     *                type: string
     *                default: 09090909
     *                description: customer_id 
     *      consumes:
     *        - application/json
     *      responses:
     *        200:
     *          description: approve kyc success
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/kyc/approve', {
        name: 'kyc.approve',
        middleware: ['authAdmin'],
        cache: false
    })
    async kycApprove(ctx: Context) {
        try {
            const entity: any = ctx.params;
            let customer: any = await ctx.call('v1.customer.findById', { customer_id: entity.customer_id });
            if (customer) {
                const kyc: any = await ctx.call('v1.customer.kyc.findByCustomerId', { customer_id: entity.customer_id });
                if (!kyc) {
                    return this.responseError('err_not_found', 'Customer has not requested kyc.');
                }

                if (customer.status_kyc == 1) {
                    await ctx.call('v1.customer.update', { id: customer._id, entity: { status_kyc: 2 } });
                    await ctx.call('v1.customer.kyc.update', { id: kyc._id, entity: { status: 2 } });
                    await ctx.call('v1.mail.sendMailKYC', { email: customer.email, fullname: customer.profile.firstname, type: 'ACCPETED', subject: 'KYC Accepted' });
                    await ctx.call('v1.systemCommission.commission', { customer_id: customer._id.toString(), type: SystemCommissionType.BONUS_KYC })
                    return this.responseSuccess({ message: 'Approve kyc customer success' });
                } else if (customer.status_kyc == 2) {
                    return this.responseError('err_not_found', `Customer's kyc has been accepted.`);
                } else if (customer.status_kyc == 3) {
                    return this.responseError('err_not_found', `Customer's kyc has been rejected.`);
                } else {
                    return this.responseError('err_not_found', 'Customer has not requested kyc.');
                }

            } else {
                return this.responseError('err_not_found', 'Customer not found.');
            }
        } catch (error) {
            this.logger.error('CustomerAdminService - approve kyc:' + error)
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/customer/kyc/reject:
     *    post:
     *      tags:
     *      - "Admin Customer"
     *      summary: reject kyc Customer
     *      description: reject kyc Customer
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
     *              - customer_id
     *              - reason
     *            properties:
     *              customer_id:
     *                type: string
     *                default: 09090909
     *                description: customer_id 
     *              reason:
     *                type: string
     *                default: reason
     *                description: reason 
     *      consumes:
     *        - application/json
     *      responses:
     *        200:
     *          description: reject kyc success
     *        403:
     *          description: Server error
     */

    @Post<RestOptions>('/kyc/reject', {
        name: 'kyc.reject',
        middleware: ['authAdmin'],
        cache: false
    })
    async kycReject(ctx: Context) {
        try {
            const entity: any = ctx.params;
            let customer: any = await ctx.call('v1.customer.findById', { customer_id: entity.customer_id });
            if (customer) {
                const kyc: any = await ctx.call('v1.customer.kyc.findByCustomerId', { customer_id: entity.customer_id });
                if (!kyc) {
                    return this.responseError('err_not_found', 'Customer has not requested kyc.');
                }

                if (customer.status_kyc == 1) {
                    await ctx.call('v1.customer.update', { id: customer._id, entity: { status_kyc: 3 } });
                    await ctx.call('v1.customer.kyc.update', { id: kyc._id, entity: { status: 3, reason: entity.reason } });
                    await ctx.call('v1.mail.sendMailKYC', { email: customer.email, fullname: customer.profile.firstname, type: 'REJECTED', subject: 'KYC Reject' });
                    return this.responseSuccess({ message: 'Reject kyc customer success' });
                } else if (customer.status_kyc == 2) {
                    return this.responseError('err_not_found', `Customer's kyc has been accepted.`);
                } else if (customer.status_kyc == 3) {
                    return this.responseError('err_not_found', `Customer's kyc has been rejected.`);
                } else {
                    return this.responseError('err_not_found', 'Customer has not requested kyc.');
                }
            } else {
                return this.responseError('err_not_found', 'Customer not found.');
            }
        } catch (error) {
            this.logger.error('CustomerAdminService - reject kyc:' + error)
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/customer/changeParent:
     *    post:
     *      tags:
     *      - "Admin Customer"
     *      summary: changeParent
     *      description: changeParent
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
     *              - customer_id
     *              - sponsor_new
     *            properties:
     *              customer_id:
     *                type: string
     *                default: 09090909
     *                description: customer_id 
     *              sponsor_new:
     *                type: string
     *                default: 09090909
     *                description: sponsor_new 
     *      consumes:
     *        - application/json
     *      responses:
     *        200:
     *          description: changeParent
     *        403:
     *          description: Server error
     */

    @Post<RestOptions>('/changeParent', {
        name: 'changeParent',
        middleware: ['authAdmin'],
        cache: false
    })
    async changeParent(ctx: Context) {
        try {
            const user: any = await ctx.call('v1.admin.user.resolveTokenHeader');
            if (!user) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }
            const entity: any = ctx.params;
            let customer: any = await ctx.call('v1.customer.findById', { customer_id: entity.customer_id });
            if (customer) {
                const findF1 = await this.adapter.findOne({ sponsor_id: entity.customer_id });
                if (findF1) {
                    return this.responseError('err_not_found', 'Customer has child, please contact admin support.');
                }

                if (entity.sponsor_new == entity.customer_id) {
                    return this.responseError('err_not_found', 'Customer not found.');
                } else {
                    const sponsor: any = await this.adapter.findById(entity.sponsor_new)
                    if (sponsor) {
                        const dateTime = moment.unix(customer.createdAt);
                        const month = dateTime.format('M')
                        const year = dateTime.format('YYYY')
                        const investments: IInvestment[] = await ctx.call('v1.investment.getInvestByCustomer', { customer_id: entity.customer_id });
                        await delay(1000)
                        await ctx.call('v1.investmentStatistic.removeData', {
                            customer_id: entity.customer_id,
                            month: +month,
                            year: +year,
                            action: "active_account"
                        });
                        for (let i = 0; i < investments.length; i++) {
                            const investment = investments[i];
                            const dateTime = moment.unix(investment.createdAt);
                            const month = dateTime.format('M')
                            const year = dateTime.format('YYYY')
                            await ctx.call('v1.investmentStatistic.removeData', {
                                customer_id: entity.customer_id,
                                month: +month,
                                year: +year,
                                action: "investment",
                                amount_invest_usd: investment.price_usd_invest
                            });
                            await delay(1000)
                        }
                        await this.adapter.updateById(entity.customer_id, { $set: { sponsor_id: entity.sponsor_new, sponsor_floor: sponsor.sponsor_floor + 1 } })
                        await delay(1000)
                        for (let i = 0; i < investments.length; i++) {
                            const investment = investments[i];
                            const dateTime = moment.unix(investment.createdAt);
                            const month = dateTime.format('M')
                            const year = dateTime.format('YYYY')
                            await ctx.call('v1.investmentStatistic.updateData', {
                                customer_id: entity.customer_id,
                                month: +month,
                                year: +year,
                                action: "investment",
                                amount_invest_usd: investment.price_usd_invest
                            });
                            await delay(1000)
                        }

                        await delay(1000)
                        await ctx.call('v1.investmentStatistic.updateData', {
                            customer_id: entity.customer_id,
                            month: +month,
                            year: +year,
                            action: "active_account"
                        });

                        BotTelegram.sendMessageNewUser(`Customer: ${customer.email} change sponsor to : ${sponsor.email} by admin ${user.email}`);
                        return this.responseSuccess({ message: 'Change parent customer success' });
                    } else {
                        return this.responseError('err_not_found', 'Sponsor not found.');
                    }
                }
            } else {
                return this.responseError('err_not_found', 'Customer not found.');
            }
        } catch (error) {
            this.logger.error('CustomerAdminService - reject kyc:' + error)
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/admin/customer/reset2fa:
     *    post:
     *      tags:
     *      - "Admin Customer"
     *      summary: reset 2fa
     *      description: reset 2fa
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
     *              - customer_id
     *            properties:
     *              customer_id:
     *                type: string
     *                default: 6336e61aa2155a001422aebd
     *                description: customer_id 
     *      consumes:
     *        - application/json
     *      responses:
     *        200:
     *          description: reset 2fa
     *        403:
     *          description: Server error
     */

    @Post<RestOptions>('/reset2fa', {
        name: 'reset2fa',
        middleware: ['authAdmin'],
        cache: false
    })
    async reset2fa(ctx: Context) {
        try {
            const user: any = await ctx.call('v1.admin.user.resolveTokenHeader');
            if (!user) {
                return this.responseError('err_auth_fail', 'Token expired.');
            }
            const entity: any = ctx.params;
            let customer: any = await ctx.call('v1.customer.findById', { customer_id: entity.customer_id });
            if (customer) {
                await this.adapter.updateById(entity.customer_id, { $set: { gg2fa: "", status_2fa: 0 } });
                await ctx.call('v1.mail.reset2Fa', {
                    email: customer.email,
                    fullname: customer.profile.fistname,
                    subject: 'Security Verification Reset Successfully'
                });
                return this.responseSuccess({ message: 'Reset 2FA customer success' });
            } else {
                return this.responseError('err_not_found', 'Customer not found.');
            }
        } catch (error) {
            this.logger.error('CustomerAdminService - reset2fa:' + error)
            return this.responseUnkownError();
        }
    }

    @Action({
        name: 'reportTotal',
        cache: false,
    })
    async reportTotal(ctx: Context) {
        try {
            const customers: any = await this.adapter.find({ query: { status: true } });
            const workbook = new ExcelJS.Workbook();
            let worksheet = workbook.addWorksheet("Sheet 1");
            worksheet.columns = [
                { header: "Fullname", key: "full_name" },
                { header: "Phone Number", key: "phone_number" },
                { header: "Email", key: "email" },
                { header: "Wallet Address", key: "wallet_address" },
                { header: "Title NFT", key: "title_nft" },
            ];
            for (let i = 0; i < customers.length; i++) {
                let customer = customers[i];
                const profile: any = await ctx.call('v1.CustomerProfile.id', {
                    customer_id: customer._id,
                });
                customer.profile = profile;
                const investments: any = await ctx.call('v1.investment.getInvestByCustomer', { customer_id: customer._id });
                if (investments.length > 0) {
                    for (let k = 0; k < investments.length; k++) {
                        const investment = investments[k]
                        const investPackage: IInvestPackage = await ctx.call('v1.investPackage.findById', {
                            invest_package_id: investment.package_id,
                        });
                        worksheet.addRow({
                            full_name: customer.profile.fistname + " " + customer.profile.lastname,
                            phone_number: customer.profile.phone_number,
                            email: customer.email,
                            wallet_address: customer.wallet_address,
                            title_nft: investPackage.title
                        })
                    }

                } else {
                    worksheet.addRow({
                        full_name: customer.profile.fistname + " " + customer.profile.lastname,
                        phone_number: customer.profile.phone_number,
                        email: customer.email,
                        wallet_address: customer.wallet_address,
                        title_nft: ""
                    })
                }
            }
            const fileName = moment().unix() + "-report-customer.xlsx";
            workbook.xlsx.writeFile("./public/" + fileName)
            return this.responseSuccessMessage('Export customer success');

        } catch (error) {
            this.logger.error('CustomerAdminService - reportTotal', error);
            return this.responseUnkownError();
        }
    }
}
