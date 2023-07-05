/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IWallet {
	_id: ObjectIdNull;
	customer_id: ObjectId;
	currency: string;
	chain: string;
	type: string;
	address: string;
	addressTag: string;
	onhold: number;
	active: boolean;
	createdAt: number | null;
	updatedAt: number | null;
}

@JsonObject('Wallet')
export class WalletEntity implements IWallet {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('customer_id', Any, false)
	public customer_id = '';

	@JsonProperty('currency', String, false)
	public currency = '';

	@JsonProperty('type', String, false)
	public type = "";

	@JsonProperty('chain', String, false)
	public chain = "";

	@JsonProperty('address', String, false)
	public address = "";
	@JsonProperty('addressTag', String, true)
	public addressTag = "";

	@JsonProperty('private_key', String, true)
	public private_key = "";

	@JsonProperty('onhold', Number, true)
	public onhold = 0;

	@JsonProperty('active', Boolean, false)
	public active = true;

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	public getMongoEntity() {
		const result: IWallet = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
