/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull} from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface ICustomerHistory  {
	_id: ObjectIdNull;
	customer_id: ObjectId;
	ip: string;
	os: string;
	action: string;
	device_id: string;
	last_login: number | null;
	createdAt: number | null;
	updatedAt: number | null;
}

@JsonObject('CustomerHistory')
export class CustomerHistoryEntity implements ICustomerHistory {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('customer_id', Any, true)
	public customer_id = '';

	@JsonProperty('ip', String)
	public ip = '';
	@JsonProperty('action', String)
	public action = '';

	@JsonProperty('device_id', String)
	public device_id = '';

	@JsonProperty('os', String)
	public os = '';

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();
	
	@JsonProperty('last_login', Number, true)
	public last_login = moment().unix();

	public getMongoEntity() {
		const result: ICustomerHistory = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
