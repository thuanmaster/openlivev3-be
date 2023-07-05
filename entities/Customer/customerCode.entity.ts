/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface ICustomerCode {
	_id: ObjectIdNull;
	customer_id: ObjectId;
	code: string;
	type: string;
	createdAt: number | null;
	updatedAt: number | null;
	expired_at: number | null;
}

@JsonObject('CustomerCode')
export class CustomerCodeEntity implements ICustomerCode {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('customer_id', Any, false)
	public customer_id = '';

	@JsonProperty('code', String, false)
	public code = '';

	@JsonProperty('type', String, false)
	public type ="";

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	@JsonProperty('expired_at', Number, false)
	public expired_at = moment().unix();

	public getMongoEntity() {
		const result: ICustomerCode = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
