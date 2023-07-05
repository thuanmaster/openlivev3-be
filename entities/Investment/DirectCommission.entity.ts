/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IDirectCommission {
    _id: ObjectIdNull;
    package_id: ObjectId;
    level: number;
    commission: number;
    type: number;
    createdAt: number | null;
    updatedAt: number | null;
    deletedAt: number | null;
}

@JsonObject('DirectCommission')
export class DirectCommissionEntity implements IDirectCommission {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('level', Number, false)
    public level = 0;
   
    @JsonProperty('package_id', Any, false)
    public package_id = '';

    @JsonProperty('commission', Number, false)
    public commission = 0;

    @JsonProperty('type', Number, false)
    public type = 0;

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    @JsonProperty('deletedAt', Number, true)
    public deletedAt = null;

    public getMongoEntity() {
        const result: IDirectCommission = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
