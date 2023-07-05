/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';

export interface IInvestment {
	_id: ObjectIdNull;
	customer_id: ObjectId;
	package_id: ObjectId;
	price_invest: number;
	price_usd_invest: number;
	currency_invest: ObjectId;
	currency_method_pay_id: ObjectId;
	bonus_token: number;
	currency_bonus_token: ObjectId;
	total_bonus_percent: number;
	dividend_rate: number;
	nft_id: number;
	admin_mint_nft: string;
	admin_image_nft: string;
	nft_image: string;
	nft_video: string;
	customer_sign_date: number;
	customer_sign_address: string;
	customer_sign_message: string;
	customer_sign_signature: string;
	admin_sign_date: number;
	admin_sign_id: string;
	admin_sign_address: string;
	admin_sign_message: string;
	admin_sign_signature: string;
	link_contract: string;
	status: boolean;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
}

@JsonObject('Investment')
export class InvestmentEntity implements IInvestment {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('customer_id', Any, false)
	public customer_id = '';

	@JsonProperty('package_id', Any, false)
	public package_id = '';

	@JsonProperty('price_invest', Number, true)
	public price_invest = 0;

	@JsonProperty('price_usd_invest', Number, true)
	public price_usd_invest = 0;

	@JsonProperty('currency_invest', Any, false)
	public currency_invest = '';

	@JsonProperty('currency_method_pay_id', Any, false)
	public currency_method_pay_id = '';

	@JsonProperty('bonus_token', Number, true)
	public bonus_token = 0;

	@JsonProperty('currency_bonus_token', Any, true)
	public currency_bonus_token = '';

	@JsonProperty('dividend_rate', Number, true)
	public dividend_rate = 0;

	@JsonProperty('total_bonus_percent', Number, true)
	public total_bonus_percent = 0;

	@JsonProperty('nft_id', Number, true)
	public nft_id = 0;

	@JsonProperty('admin_mint_nft', String, true)
	public admin_mint_nft = '';

	@JsonProperty('admin_image_nft', String, true)
	public admin_image_nft = '';

	@JsonProperty('admin_sign_id', String, true)
	public admin_sign_id = '';

	@JsonProperty('nft_image', String, true)
	public nft_image = '';

	@JsonProperty('nft_video', String, true)
	public nft_video = '';

	@JsonProperty('customer_sign_date', Number, true)
	public customer_sign_date = 0;
	@JsonProperty('customer_sign_address', String, true)
	public customer_sign_address = '';
	@JsonProperty('customer_sign_message', String, true)
	public customer_sign_message = '';
	@JsonProperty('customer_sign_signature', String, true)
	public customer_sign_signature = '';

	@JsonProperty('admin_sign_date', Number, true)
	public admin_sign_date = 0;
	@JsonProperty('admin_sign_address', String, true)
	public admin_sign_address = '';
	@JsonProperty('admin_sign_message', String, true)
	public admin_sign_message = '';
	@JsonProperty('admin_sign_signature', String, true)
	public admin_sign_signature = '';

	@JsonProperty('link_contract', String, true)
	public link_contract = '';

	@JsonProperty('status', Boolean, true)
	public status = true;

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	@JsonProperty('deletedAt', Number, true)
	public deletedAt = null;

	public getMongoEntity() {
		const result: IInvestment = {
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
