/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull, TypeCode } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IPackageTerm {
    _id: ObjectIdNull;
    package_id: ObjectId;
    title: string;
    day_reward: number;
    total_stake: number;
    createdAt: number | null;
    updatedAt: number | null;
    deletedAt: number | null;
}

@JsonObject('PackageTerm')
export class PackageTermEntity implements IPackageTerm {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('package_id', Any, false)
    public package_id = '';

    @JsonProperty('title', String, false)
    public title = "";

    @JsonProperty('day_reward', Number, false)
    public day_reward = 0;
    
    @JsonProperty('total_stake', Number, false)
    public total_stake = 0;

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();
   
    @JsonProperty('deletedAt', Number, true)
    public deletedAt = null;

    public getMongoEntity() {
        const result: IPackageTerm = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
