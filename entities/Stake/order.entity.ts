/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull, statusOrder } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IOrder {
    _id: ObjectIdNull;
    code: string;
    customer_id: ObjectId;
    package_id: ObjectId;
    term_id: ObjectId;
    currency_stake_id: ObjectId;
    amount_stake: number;
    amount_usd_stake: number;
    subscription_date: number,
    redemption_date: number;
    last_time_reward: number;
    status: string;
    createdAt: number | null;
    updatedAt: number | null;
    deletedAt: number | null;
}

@JsonObject('Order')
export class OrderEntity implements IOrder {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('code', String, false)
    public code = '';

    @JsonProperty('customer_id', Any, false)
    public customer_id = '';

    @JsonProperty('package_id', Any, false)
    public package_id = '';

    @JsonProperty('term_id', Any, false)
    public term_id = '';

    @JsonProperty('currency_stake_id', Any, false)
    public currency_stake_id = '';

    @JsonProperty('amount_stake', Number, false)
    public amount_stake = 0;

    @JsonProperty('amount_usd_stake', Number, false)
    public amount_usd_stake = 0;

    @JsonProperty('subscription_date', Number, false)
    public subscription_date = moment().unix();

    @JsonProperty('redemption_date', Number, false)
    public redemption_date = moment().unix();

    @JsonProperty('last_time_reward', Number, false)
    public last_time_reward = moment().unix();

    @JsonProperty('status', String, true)
    public status = statusOrder.HOLDING;

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    @JsonProperty('deletedAt', Number, true)
    public deletedAt = null;

    public getMongoEntity() {
        const result: IOrder = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
