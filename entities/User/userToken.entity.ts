import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull} from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IUserToken  {
	_id: ObjectIdNull;
	user_id: ObjectId;
	token: string;
    active: Boolean | false;
	createdAt: number | null;
	updatedAt: number | null;
	expired_at: number | null;
}

@JsonObject('UserToken')
export class UserTokenEntity implements IUserToken {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

	@JsonProperty('user_id', String)
	public user_id = '';

	@JsonProperty('token', String)
	public token = '';

	@JsonProperty('active', Boolean, true)
	public active = false;

	@JsonProperty('createdAt', Number, true)
	public createdAt = moment().unix();

	@JsonProperty('updatedAt', Number, true)
	public updatedAt = moment().unix();

	@JsonProperty('expired_at', Number, false)
	public expired_at = moment().unix();

	public getMongoEntity() {
		const result: IUserToken = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
