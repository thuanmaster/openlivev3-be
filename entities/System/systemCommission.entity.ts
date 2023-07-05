/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { SystemCommissionType, ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface ISystemCommission {
	_id: ObjectIdNull;
	level: number;
    currency_id: ObjectId;
    commission: number;
    commission_type: string;
    createdAt: number | null;
    updatedAt: number | null;
    deletedAt: number | null;
}

@JsonObject('ISystemCommission')
export class SystemCommissionEntity implements ISystemCommission {
	@JsonProperty('_id', String, true)
	public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('gameType_id', Any, true)
	public gameType_id = '';

	@JsonProperty('level', Number, false)
    public level = 0;

    @JsonProperty('currency_id', Any, false)
    public currency_id = '';

    @JsonProperty('commission', Number, false)
    public commission = 0;

    @JsonProperty('commission_type', String, false)
    public commission_type = SystemCommissionType.BONUS_ACTIVE;

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    @JsonProperty('deletedAt', Number, true)
    public deletedAt = null;
	
	public getMongoEntity() {
		const result: ISystemCommission = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
		if (!result._id) {
			// @ts-ignore
			delete result._id;
		}
		return result;
	}
}
