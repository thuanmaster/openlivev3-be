/* eslint-disable no-underscore-dangle */
import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull, CustomerRole, CustomerStatus } from '../../types';
import { Config } from '../../common';
import moment from 'moment';
import { CustomerRoleConverter } from '../../converters/customer-role.converter';
export interface ICustomer {
	_id: ObjectIdNull;
	password: string;
	email: string;
	wallet_address: string;
	ref_code: string;
	gg2fa: string;
	roles: CustomerRole[];
	status_2fa: number;
	status_kyc: number;
	lock_status: string;
	sponsor_id: string;
	sponsor_floor: number;
	level_commission: number;
	sub_user_id: string;
	active_package: Boolean | false;
	status: Boolean | false;
	createdAt: number | null;
	updatedAt: number | null;
}

@JsonObject('Customer')
export class CustomerEntity implements ICustomer {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('password', String, false)
	public password = '';

	@JsonProperty('wallet_address', String, false)
	public wallet_address = '';

	@JsonProperty('email', String, false)
	public email = '';

	@JsonProperty('gg2fa', String, true)
	public gg2fa = '';

	@JsonProperty('ref_code', String, true)
	public ref_code = '';

	@JsonProperty('sub_user_id', String, true)
	public sub_user_id = '';

	@JsonProperty('sponsor_id', String, true)
	public sponsor_id = '';

	@JsonProperty('sponsor_floor', Number, true)
	public sponsor_floor = 0;

	@JsonProperty('status_2fa', Number, true)
	public status_2fa = 0;

	@JsonProperty('status_kyc', Number, true)
	public status_kyc = 0;

	@JsonProperty('level_commission', Number, true)
	public level_commission = 0;

	@JsonProperty('roles', CustomerRoleConverter)
	public roles = [CustomerRole.USER];

	@JsonProperty('status', Boolean, true)
	public status = false;

	@JsonProperty('active_package', Boolean, true)
	public active_package = false;

	@JsonProperty('lock_status', String, true)
	public lock_status = CustomerStatus.NORMAL;

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	public getMongoEntity() {
		const result: ICustomer = {
			...this,
			_id: this._id && (this._id as Types.ObjectId).toString(),
		};
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
