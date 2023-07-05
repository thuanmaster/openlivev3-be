/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IWalletChain {
	_id: ObjectIdNull;
	customer_id: ObjectIdNull;
	chain: string;
	address: string;
	used: boolean;
	createdAt: number | null;
	updatedAt: number | null;
}

@JsonObject('WalletChain')
export class WalletChainEntity implements IWalletChain {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('customer_id', Any, true)
	public customer_id = null;

	@JsonProperty('chain', String, false)
	public chain = "";

	@JsonProperty('address', String, false)
	public address = "";

	@JsonProperty('private_key', String, true)
	public private_key = "";

	@JsonProperty('used', Boolean, false)
	public used = false;

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	public getMongoEntity() {
		const result: IWalletChain = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
