/* eslint-disable no-underscore-dangle */
import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IBlockChain {
	_id: ObjectIdNull;
	code: string;
	title: string;
	rpc: string;
	scan: string;
	native_token: string;
	active: Boolean | false;
	chainid: Number;
	type: String;
	createdAt: Number | null;
	updatedAt: Number | null;
}

@JsonObject('BlockChain')
export class BlockChainEntity implements IBlockChain {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('code', String, true)
	public code = '';

	@JsonProperty('title', String)
	public title = '';

	@JsonProperty('rpc', String, true)
	public rpc = '';

	@JsonProperty('scan', String)
	public scan = '';

	@JsonProperty('native_token', String)
	public native_token = '';

	@JsonProperty('chainid', Number)
	public chainid = 0;

	@JsonProperty('type', String)
	public type = "";

	@JsonProperty('contract_banker', String, true)
	public contract_banker = "";

	@JsonProperty('banker_owner_address', String, true)
	public banker_owner_address = "";
	
	@JsonProperty('banker_owner_private', String, true)
	public banker_owner_private = "";

	@JsonProperty('active', Boolean, true)
	public active = false;

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	@JsonProperty('deletedAt', Number, true)
	public deletedAt = null;

	public getMongoEntity() {
		const result: IBlockChain = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
