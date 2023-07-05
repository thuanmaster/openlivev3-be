/* eslint-disable no-underscore-dangle */
import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface ISetting {
	_id: ObjectIdNull;
	key: string;
	value: string;
	createdAt: number | null;
	updatedAt: number | null;
}

@JsonObject('Setting')
export class SettingEntity implements ISetting {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('key', String, false)
	public key = '';

	@JsonProperty('value', String, false)
	public value = "";
	
	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	public getMongoEntity() {
		const result: ISetting = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
