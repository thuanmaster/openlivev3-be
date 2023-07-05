/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull, ObjectId } from '../../types';
import { Config } from '../../common';
import moment from 'moment';

export interface ICurrencyAttr {
    _id: ObjectIdNull;
    currency_id: ObjectId;
    blockchain: ObjectId;
    contract: string;
    abi: string;
    native_token: string;
    decimal: number;
    withdraw_fee_token: number;
    withdraw_fee_token_type: number;
    withdraw_fee_chain: number;
    value_need_approve: number;
    value_need_approve_currency: string;
    max_amount_withdraw_daily: number;
    max_amount_withdraw_daily_currency: string;
    max_times_withdraw: number;
    min_withdraw: number;
    max_withdraw: number;
    type_withdraw: string;
    type_deposit: string;
    type_transfer: string;
    createdAt: number | null;
    updatedAt: number | null;
    deletedAt: number | null;
}

@JsonObject('CurrencyAttr')
export class CurrencyAttrEntity implements ICurrencyAttr {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('currency_id', Any, true)
    public currency_id = '';

    @JsonProperty('blockchain', Any)
    public blockchain = '';

    @JsonProperty('contract', String, true)
    public contract = "";

    @JsonProperty('abi', String)
    public abi = "";

    @JsonProperty('withdraw_fee_token', Number)
    public withdraw_fee_token = 0;
    
    @JsonProperty('withdraw_fee_token_type', Number)
    public withdraw_fee_token_type = 0;
    
    @JsonProperty('decimal', Number)
    public decimal = 0;

    @JsonProperty('withdraw_fee_chain', Number)
    public withdraw_fee_chain = 0;

    @JsonProperty('native_token', String, true)
    public native_token = "";
    
    @JsonProperty('min_withdraw', Number)
    public min_withdraw = 0;
    
    @JsonProperty('max_withdraw', Number)
    public max_withdraw = 0;

    @JsonProperty('value_need_approve', Number,true)
    public value_need_approve = 0;

    @JsonProperty('value_need_approve_currency', String, true)
    public value_need_approve_currency = "";

    @JsonProperty('max_amount_withdraw_daily', Number,true)
    public max_amount_withdraw_daily = 0;

    @JsonProperty('max_amount_withdraw_daily_currency', String, true)
    public max_amount_withdraw_daily_currency = "";

    @JsonProperty('max_times_withdraw', Number, true)
    public max_times_withdraw = 1;

    @JsonProperty('type_deposit', String, true)
    public type_deposit = "";

    @JsonProperty('type_withdraw', String, true)
    public type_withdraw = "";
   
    @JsonProperty('type_transfer', String, true)
    public type_transfer = "";

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    @JsonProperty('deletedAt', Number, true)
    public deletedAt = null;

    public getMongoEntity() {
        const result: ICurrencyAttr = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
