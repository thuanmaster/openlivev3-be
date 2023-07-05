'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Get, Method, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbCustomerKYCMixin, eventsCustomerKYCMixin } from '../../mixins/dbMixins';
import { CustomerKYCServiceOptions, CustomerKYCServiceSettingsOptions, MoleculerDBService, RestOptions, KycRequestParams, KycRequestValidator } from '../../types';
import { CustomerKYCEntity, ICustomerKYC } from '../../entities';
import { CustomValidator } from '../../validators/CustomValidator';
import { Otplib, BotTelegram } from '../../libraries';
import moment from 'moment';
import { JsonConvert } from 'json2typescript';

@Service<CustomerKYCServiceOptions>({
    name: 'customer.kyc',
    version: 1,
    mixins: [dbCustomerKYCMixin, eventsCustomerKYCMixin],
    settings: {
        idField: '_id',
        pageSize: 10,
        rest: '/v1/customer',
        fields: [
            '_id', 'customer_id', 'type', 'number', 'image_back', 'image_front', 'image_selfie', 'reason', 'status', 'createdAt'
        ]
    },
})
export default class CustomerKYCService extends MoleculerDBService<CustomerKYCServiceSettingsOptions, ICustomerKYC> {

    /**
     *  @swagger
     *
     *  /v1/customer/kyc/request:
     *    post:
     *      tags:
     *      - "Customers"
     *      summary: Request KYC
     *      description: Request KYC
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
     *              - number
     *              - type
     *              - country_code
     *              - image_front
     *              - image_back
     *              - image_selfie   
     *              - fistname   
     *              - lastname   
     *              - birthday   
     *            properties:
     *              number:
     *                type: string
     *                default: 123456
     *              type:
     *                type: string
     *                default: "PASSPORT"
     *              image_front:
     *                type: string
     *                default: 123456
     *              image_back:
     *                type: string
     *                default: 123456
     *              image_selfie:
     *                type: string
     *                default: 123456
     *              country_code:
     *                type: string
     *                default: "VN"
     *              fistname:
     *                type: string
     *                default: fistname
     *              lastname:
     *                type: string
     *                default: lastname
     *              birthday:
     *                type: date
     *                default: 1992-12-22
     *      responses:
     *        200:
     *          description: Request KYC success
     *        403:
     *          description: Server error
     */
    @Post<RestOptions>('/kyc/request', {
        name: 'request',
        middleware: ['auth', 'captcha'],
        cache: false
    })
    async request(ctx: Context<KycRequestParams>) {
        try {
            let customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            const params = ctx.params;
            const validate = (new CustomValidator()).validate(params, KycRequestValidator);
            if (validate !== true) {
                return this.responseErrorData('err_validate', validate.message, validate.data);
            }

            const checkKyc: any = await this.adapter.findOne({ customer_id: customer._id });
            if (checkKyc && checkKyc.status == 1) {
                return this.responseError('err_data_existed', 'Kyc is being processed');
            }

            if (checkKyc && checkKyc.status == 2) {
                return this.responseError('err_approved', 'Kyc approved');
            }

            const checkCountryCode = await ctx.call('v1.country.CheckCode', { code: params.country_code });
            if (!checkCountryCode) {
                return this.responseError('err_not_found', 'Country not exsited in system.')
            }

            const checkIdNumber: any = await this.adapter.findOne({ number: params.number, type: params.type });
            if (checkIdNumber) {
                if (checkIdNumber.customer_id != customer._id.toString()) {
                    return this.responseError('err_data_existed', 'ID number or passport exsited in system.');
                }
            }

            let image_front: string = "";
            let image_back: string = "";
            let image_selfie: string = "";
            const checkFileFront: any = await ctx.call('v1.files.find', { id: params.image_front });
            if (checkFileFront.status == "error") {
                return checkFileFront;
            } else {
                image_front = checkFileFront.data.full_link;
            }

            const checkFileBack: any = await ctx.call('v1.files.find', { id: params.image_back });
            if (checkFileBack.status == "error") {
                return checkFileBack;
            } else {
                image_back = checkFileBack.data.full_link;
            }

            const checkFileSelfie: any = await ctx.call('v1.files.find', { id: params.image_selfie });
            if (checkFileSelfie.status == "error") {
                return checkFileSelfie;
            } else {
                image_selfie = checkFileSelfie.data.full_link;
            }

            const entityProfile = {
                country: params.country_code,
                fistname: params.fistname,
                lastname: params.lastname,
                birthday: moment(params.birthday).format('YYYY-MM-DD')
            }
            await ctx.call('v1.CustomerProfile.updateProfile', { id: customer.profile._id, entity: entityProfile });

            const entityKyc = {
                number: params.number,
                customer_id: customer._id,
                type: params.type,
                image_front: image_front,
                image_back: image_back,
                image_selfie: image_selfie,
                status: 1
            }
            BotTelegram.sendMessageKYC(`REQUESTED KYC by - Customer email: ${customer.email} -- Customer ID: ${customer._id} at ${moment().format("YYYY-MM-DD HH:mm:ss")} - Selfied Card`, image_selfie);
            if (checkKyc && checkKyc.status == 3) {
                await this.adapter.updateById(checkKyc._id, { $set: entityKyc });
                await ctx.call('v1.mail.sendMailKYC', { email: customer.email, fullname: customer.profile.firstname, type: 'CONFIRM', subject: 'KYC Verified' });
                await ctx.call('v1.customer.update', { id: customer._id, entity: { status_kyc: 1 } })
                await ctx.call('v1.files.delete', { id: params.image_back });
                await ctx.call('v1.files.delete', { id: params.image_front });
                await ctx.call('v1.files.delete', { id: params.image_selfie });
                return this.responseSuccessMessage('Update kyc success');
            } else {
                const parsedEntity = new JsonConvert().deserializeObject(entityKyc, CustomerKYCEntity).getMongoEntity()
                const kyc = await this._create(ctx, parsedEntity);
                await ctx.call('v1.mail.sendMailKYC', { email: customer.email, fullname: customer.profile.firstname, type: 'CONFIRM', subject: 'KYC Verified' });
                await ctx.call('v1.customer.update', { id: customer._id, entity: { status_kyc: 1 } })
                await ctx.call('v1.files.delete', { id: params.image_back });
                await ctx.call('v1.files.delete', { id: params.image_front });
                await ctx.call('v1.files.delete', { id: params.image_selfie });
                return this.responseSuccessDataMessage('Request kyc success', kyc);
            }
        } catch (error) {
            this.logger.error(error)
            return this.responseUnkownError();
        }
    }

    /**
     *  @swagger
     *
     *  /v1/customer/kyc/find:
     *    get:
     *      tags:
     *      - "Customers"
     *      summary: find KYC
     *      description: find KYC
     *      produces:
     *        - application/json
     *      consumes:
     *        - application/json
     *      security:
     *        - Bearer: [] 
     *      responses:
     *        200:
     *          description: find KYC success
     *        403:
     *          description: Server error
     */
    @Get<RestOptions>('/kyc/find', {
        name: 'find',
        middleware: ['auth'],
        cache: false
    })
    async find(ctx: Context) {
        try {
            let customer: any = await ctx.call('v1.customer.resolveTokenHeader');
            const kyc = await this.adapter.findOne({ customer_id: customer._id });
            return this.responseSuccess(kyc);
        } catch (error) {
            return this.responseUnkownError();
        }
    }


    @Action({
        name: 'update',
        cache: false
    })
    async update(ctx: Context) {
        try {
            const params: any = ctx.params
            await this.adapter.updateById(params.id, { $set: params.entity });
            return true;
        } catch (e) {
            this.logger.error('CustomerKYCService update', e);
            return false;
        }
    }


    @Action({
        name: 'findByCustomerId',
        cache: false
    })
    async findByCustomerId(ctx: Context<string, Record<string, any>>) {
        try {
            const params: any = ctx.params;
            return await this.adapter.findOne({ customer_id: params.customer_id.toString() });

        } catch (e) {
            this.logger.error('CustomerKYCService findByCustomerId:', e);
            return false;
        }
    }

    @Action({
        name: 'cancelKycCustomer',
        cache: false
    })
    async cancelKycCustomer(ctx: Context<string, Record<string, any>>) {
        try {
            const listKycs: any = await this.adapter.find({ query: { status: 1, createdAt: { $gt: 1667918159 } } });
            for (let i = 0; i < listKycs.length; i++) {
                const listKyc = listKycs[i]
                await this.adapter.updateById(listKyc._id, { $set: { status: 3 } });
                await ctx.call('v1.customer.update', { id: listKyc.customer_id, entity: { status_kyc: 3 } })
            }
            return true;
        } catch (e) {
            this.logger.error('CustomerKYCService cancelKycCustomer:', e);
            return false;
        }
    }


}
