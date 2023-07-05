/* eslint-disable no-underscore-dangle */
import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';

export interface ICustomerProfile {
	_id: ObjectIdNull;
	customer_id: ObjectId;
	description: string;
	phone_number: string;
	phone_code: string;
	country: string;
	fistname: string;
	lastname: string;
	avatar: string;
	address: string;
	birthday: string | null;
	createdAt: number | null;
	updatedAt: number | null;
}

@JsonObject('CustomerProfile')
export class CustomerProfileEntity implements ICustomerProfile {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('customer_id', String)
	public customer_id = '';

	@JsonProperty('description', String, true)
	public description = '';

	@JsonProperty('phone_number', String, true)
	public phone_number = '';

	@JsonProperty('phone_code', String, true)
	public phone_code = '';

	@JsonProperty('country', String)
	public country = '';

	@JsonProperty('fistname', String, true)
	public fistname = '';

	@JsonProperty('lastname', String, true)
	public lastname = '';

	@JsonProperty('address', String, true)
	public address = '';

	@JsonProperty('avatar', String, true)
	public avatar = '';

	@JsonProperty('birthday', String, true)
	public birthday = '';

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	public getMongoEntity() {
		const result: ICustomerProfile = {
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
