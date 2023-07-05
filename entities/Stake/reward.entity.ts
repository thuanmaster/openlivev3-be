/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull, TypeCode } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IReward {
    _id: ObjectIdNull;
    package_id: ObjectId;
    term_id: ObjectId;
    currency_reward_id: ObjectIdNull;
    apr_reward: number;
    createdAt: number | null;
    updatedAt: number | null;
}

@JsonObject('Reward')
export class RewardEntity implements IReward {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('package_id', Any, false)
    public package_id = '';

    @JsonProperty('term_id', Any, false)
    public term_id = '';

    @JsonProperty('currency_reward_id', Any, false)
    public currency_reward_id = '';
    
    @JsonProperty('apr_reward', Number, false)
    public apr_reward = 0;

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    public getMongoEntity() {
        const result: IReward = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
