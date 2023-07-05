/* eslint-disable no-underscore-dangle */
import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface ITeamWallet {
	_id: ObjectIdNull;
	title: string;
	address: string;
	createdAt: number | null;
	updatedAt: number | null;
	deletedAt: number | null;
}

@JsonObject('TeamWallet')
export class TeamWalletEntity implements ITeamWallet {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('title', String, false)
	public title = '';

	@JsonProperty('address', String, false)
	public address = "";
	
	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	@JsonProperty('deletedAt', Number, true)
	public deletedAt = null;

	public getMongoEntity() {
		const result: ITeamWallet = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
