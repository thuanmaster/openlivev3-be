/* eslint-disable no-underscore-dangle */
import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';
export interface IFile {
	_id: ObjectIdNull;
	key: string;
	full_link: string;
	createdAt: number | null;
	updatedAt: number | null;
}

@JsonObject('File')
export class FileEntity implements IFile {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('key', String, true)
	public key = '';

	@JsonProperty('full_link', String)
	public full_link = '';

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	public getMongoEntity() {
		const result: IFile = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
