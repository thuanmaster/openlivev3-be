/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface ICustomerKYC {
	_id: ObjectIdNull;
	customer_id: ObjectId;
	number: string;
	type: string;
	image_front: string;
	image_back: string;
	image_selfie: string;
	reason: string | null;
	status: number;
	createdAt: number | null;
	updatedAt: number | null;
}

@JsonObject('CustomerKYC')
export class CustomerKYCEntity implements ICustomerKYC {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('customer_id', Any, false)
	public customer_id = '';

	@JsonProperty('number', String, false)
	public number = '';

	@JsonProperty('type', String, false)
	public type ="";

	@JsonProperty('image_front', String, false)
	public image_front = '';

	@JsonProperty('image_back', String, false)
	public image_back = '';
	
	@JsonProperty('image_selfie', String, false)
	public image_selfie = '';

	@JsonProperty('reason', String, true)
	public reason = '';

	@JsonProperty('status', Number, false)
	public status = 0;

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	public getMongoEntity() {
		const result: ICustomerKYC = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
