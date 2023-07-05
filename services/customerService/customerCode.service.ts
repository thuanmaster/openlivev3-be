'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbCustomerCodeMixin, eventsCustomerCodeMixin, generateCode } from '../../mixins/dbMixins';
import moment from 'moment';
import { CustomerCodeEntity, ICustomerCode } from '../../entities';
import {
	CustomerCodesServiceSettingsOptions,
	MoleculerDBService,
	ParamCheckCustomerCode,
	ParamCustomerCode,
	TypeCode,
	CheckCustomerCodeValidator,
	CheckCreateCustomerCodeValidator,
} from '../../types';
import { JsonConvert } from 'json2typescript';
import { CustomValidator } from '../../validators';
import { Config } from '../../common';

@Service({
	name: 'CustomerCode',
	version: 1,
	mixins: [dbCustomerCodeMixin, eventsCustomerCodeMixin],
})
export default class CustomerCodeService extends MoleculerDBService<
	CustomerCodesServiceSettingsOptions,
	ICustomerCode
> {
	@Action({
		name: 'CreateCustomerCode',
		cache: false,
	})
	async CreateCustomerCode(ctx: Context<ParamCustomerCode>) {
		try {
			const params = ctx.params;
			const validate = new CustomValidator().validate(
				params,
				CheckCreateCustomerCodeValidator,
			);
			if (validate !== true) {
				return this.responseErrorData('err_validate', validate.message, validate.data);
			}

			const code = generateCode(6);
			const checkCode: any = await this.adapter.findOne({
				customer_id: params.customer_id.toString(),
				type: params.typeCode,
			});
			if (checkCode) {
				const createdAt = moment.unix(checkCode.createdAt).add(1, 'minutes').unix();
				const now = moment().unix();
				if (now > createdAt) {
					this.adapter.removeById(checkCode._id);
				} else {
					return this.responseError(
						'err_request_too_often',
						'Requested too often, please try again later',
					);
				}
			}

			let entity = {
				customer_id: params.customer_id.toString(),
				code: code,
				type: params.typeCode,
				expired_at: moment().add(30, 'minutes').unix(),
			};
			const parsedEntity = new JsonConvert()
				.deserializeObject(entity, CustomerCodeEntity)
				.getMongoEntity();
			await this._create(ctx, parsedEntity);
			await ctx.call('v1.mail.sendMailCode', {
				code,
				email: params.email,
				fullname: params.fullname,
				type: params.typeCode,
				subject: 'Email verify code',
			});
			return this.responseSuccessMessage('Create code success');
		} catch (e) {
			this.logger.error(e);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'CheckCode',
		cache: false,
	})
	async CheckCustomerCode(ctx: Context<ParamCheckCustomerCode>) {
		try {
			const params = ctx.params;
			const validate = new CustomValidator().validate(params, CheckCustomerCodeValidator);
			if (validate !== true) {
				return false;
			}

			if (params.code == '123456' && Config.NODE_ENV == 'development') {
				return true;
			}

			const checkCode: any = await this.adapter.findOne({
				customer_id: params.customer_id.toString(),
				code: params.code,
				type: params.typeCode,
			});
			if (checkCode) {
				this.adapter.removeById(checkCode._id);
				const expire = checkCode.expired_at;
				const currentTime = moment().unix();
				if (currentTime < expire) {
					return true;
				} else {
					return false;
				}
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error(e);
			return false;
		}
	}
}
