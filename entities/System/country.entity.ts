/* eslint-disable no-underscore-dangle */
import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';
export interface ICountry {
	_id: ObjectIdNull;
	code: string;
	title: string;
	phone_code: string;
	createdAt: number | null;
	updatedAt: number | null;
}

@JsonObject('Country')
export class CountryEntity implements ICountry {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('code', String, true)
	public code = '';

	@JsonProperty('title', String)
	public title = '';

	@JsonProperty('phone_code', String, true)
	public phone_code = '';

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	@JsonProperty('deletedAt', Number, true)
	public deletedAt = null;

	public getMongoEntity() {
		const result: ICountry = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
