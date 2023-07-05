/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';

export interface ITransactionTemp {
	_id: ObjectIdNull;
	customer: ObjectIdNull;
	currency: string;
	chain: string;
	action: string;
	amount: number;
	fee: number;
	balance: number;
	balanceBefore: number;
	payment_method: string;
	txhash: string;
	from: string;
	to: string;
	order: string;
	note: string;
	status: string;
	createdAt: number | null;
	updatedAt: number | null;
}

@JsonObject('TransactionTemp')
export class TransactionTempEntity implements ITransactionTemp {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('customer', Any, false)
	public customer = '';

	@JsonProperty('currency', String, false)
	public currency = '';

	@JsonProperty('chain', String, false)
	public chain = "";

	@JsonProperty('action', String, false)
	public action = "";

	@JsonProperty('amount', Number, true)
	public amount = 0;
	@JsonProperty('fee', Number, true)
	public fee = 0;
	@JsonProperty('balance', Number, true)
	public balance = 0;

	@JsonProperty('balanceBefore', Number, true)
	public balanceBefore = 0;
	
	@JsonProperty('payment_method', String, true)
	public payment_method = "";

	@JsonProperty('txhash', String, true)
	public txhash = "";
	
	@JsonProperty('from', String, true)
	public from = "";
	@JsonProperty('to', String, true)
	public to = "";
	@JsonProperty('order', String, true)
	public order = "";
	@JsonProperty('note', String, true)
	public note = "";
	@JsonProperty('status', String, true)
	public status = "";

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	public getMongoEntity() {
		const result: ITransactionTemp = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
