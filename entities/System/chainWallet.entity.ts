/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IChainWallet {
	_id: ObjectIdNull;
	chain_id: ObjectId;
	address: string;
	privateKey: string;
	using: Boolean | false;
	active: Boolean | false;
	createdAt: Number | null;
	updatedAt: Number | null;
}

@JsonObject('ChainWallet')
export class ChainWalletEntity implements IChainWallet {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('chain_id', Any)
	public chain_id = '';

	@JsonProperty('address', String)
	public address = '';

	@JsonProperty('privateKey', String, true)
	public privateKey = '';

	@JsonProperty('using', Boolean, true)
	public using = false;

	@JsonProperty('active', Boolean, true)
	public active = false;

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	@JsonProperty('deleteAt', Number, true)
	public deleteAt = null;

	public getMongoEntity() {
		const result: IChainWallet = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
