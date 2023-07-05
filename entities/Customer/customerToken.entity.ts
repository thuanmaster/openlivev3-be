/* eslint-disable no-underscore-dangle */
import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull} from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface ICustomerToken  {
	_id: ObjectIdNull;
	customer_id: ObjectId;
	os: string;
	token: string;
	device_id: string;
    active: Boolean | false;
	createdAt: number | null;
	updatedAt: number | null;
	expired_at: number | null;
}

@JsonObject('CustomerToken')
export class CustomerTokenEntity implements ICustomerToken {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('customer_id', String)
	public customer_id = '';

	@JsonProperty('os', String)
	public os = '';

	@JsonProperty('token', String)
	public token = '';

	@JsonProperty('device_id', String)
	public device_id = '';

	@JsonProperty('active', Boolean, true)
	public active = false;

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	@JsonProperty('expired_at', Number, false)
	public expired_at = moment().unix();

	public getMongoEntity() {
		const result: ICustomerToken = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
