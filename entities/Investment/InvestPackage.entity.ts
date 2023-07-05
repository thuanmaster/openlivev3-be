/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';

export interface IInvestPackage {
	_id: ObjectIdNull;
	title: string;
	description: string;
	avatar: string;
	video: string;
	rare: number;
	price_invest: number;
	currency_invest: ObjectId;
	currency_method_pay: any;
	bonus_token: number;
	currency_bonus_token: ObjectId;
	dividend_rate: number;
	meta_data: any;
	status: boolean;
	amount: number;
	amount_type: number;
	currency: ObjectId;
	from_date: number;
	to_date: number;
	currency_buy: any;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
}

@JsonObject('InvestPackage')
export class InvestPackageEntity implements IInvestPackage {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('title', String, false)
	public title = '';

	@JsonProperty('video', String, true)
	public video = '';

	@JsonProperty('avatar', String, true)
	public avatar = '';

	@JsonProperty('description', String, true)
	public description = '';

	@JsonProperty('rare', Number, true)
	public rare = 0;

	@JsonProperty('price_invest', Number, true)
	public price_invest = 0;

	@JsonProperty('currency_invest', Any, false)
	public currency_invest = '';

	@JsonProperty('currency_method_pay', Any, false)
	public currency_method_pay = '';

	@JsonProperty('bonus_token', Number, true)
	public bonus_token = 0;

	@JsonProperty('currency_bonus_token', Any, true)
	public currency_bonus_token = '';

	@JsonProperty('dividend_rate', Number, true)
	public dividend_rate = 0;

	@JsonProperty('meta_data', Any, true)
	public meta_data = null;

	@JsonProperty('status', Boolean, true)
	public status = true;

	@JsonProperty('amount', Number, true)
	public amount = 0;

	@JsonProperty('amount_type', Number, true)
	public amount_type = 0;

	@JsonProperty('currency', Any, false)
	public currency = '';

	@JsonProperty('from_date', Number, true)
	public from_date = 0;

	@JsonProperty('to_date', Number, true)
	public to_date = 0;

	@JsonProperty('currency_buy', Any, true)
	public currency_buy = null;

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	@JsonProperty('deletedAt', Number, true)
	public deletedAt = null;

	public getMongoEntity() {
		const result: IInvestPackage = {
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
