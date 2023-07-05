/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface ITransactionCode {
	_id: ObjectIdNull;
	transaction_id: ObjectId;
	code: string;
	type: string;
	createdAt: number | null;
	updatedAt: number | null;
	expired_at: number | null;
}

@JsonObject('TransactionCode')
export class TransactionCodeEntity implements ITransactionCode {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('transaction_id', Any, false)
	public transaction_id = '';

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
		const result: ITransactionCode = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
