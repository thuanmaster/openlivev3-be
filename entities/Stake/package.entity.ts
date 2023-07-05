/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull, TypePackage } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IPackage {
    _id: ObjectIdNull;
    title: string;
    currency_stake_id: ObjectId;
    min_stake: number;
    max_stake: number;
    description: string,
    type: TypePackage,
    start_date: number;
    end_date: number;
    status: boolean;
    createdAt: number;
    updatedAt: number;
    deletedAt: number | null;
}

@JsonObject('Package')
export class PackageEntity implements IPackage {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('title', String, false)
    public title = '';

    @JsonProperty('description', String, false)
    public description = '';

    @JsonProperty('currency_stake_id', Any, false)
    public currency_stake_id = "";

    @JsonProperty('min_stake', Number, true)
    public min_stake = 0;

    @JsonProperty('max_stake', Number, true)
    public max_stake = 0;

    @JsonProperty('type', Any, true)
    public type = TypePackage.LOCKED;

    @JsonProperty('status', Boolean, true)
    public status = true;

    @JsonProperty('start_date', Number, true)
    public start_date = moment().unix();

    @JsonProperty('end_date', Number, true)
    public end_date = moment().unix();

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    @JsonProperty('deletedAt', Number, true)
    public deletedAt = null;

    public getMongoEntity() {
        const result: IPackage = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
