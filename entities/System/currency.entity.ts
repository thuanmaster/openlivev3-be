/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull, CurencyType } from '../../types';
import { Config } from '../../common';
import moment from 'moment';
import { Double } from 'mongodb';

export interface ICurrency {
    _id: ObjectIdNull;
    code: string;
    title: string;
    type: string;
    min_crawl: number;
    transfer_fee: number;
    transfer_fee_type: number;
    swap_enable: any;
    swap_fee: number;
    swap_fee_type: number;
    min_swap: number;
    max_swap: number;
    active: Boolean;
    usd_rate: number;
    icon: string;
    link_rate: any;
    factor_rate: number;
    createdAt: number | null;
    updatedAt: number | null;
}

@JsonObject('Currency')
export class CurrencyEntity implements ICurrency {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('code', String, true)
    public code = '';

    @JsonProperty('title', String)
    public title = '';

    @JsonProperty('type', String, true)
    public type = CurencyType.CRYPTO;

    @JsonProperty('min_crawl', Number)
    public min_crawl = 0;

    @JsonProperty('transfer_fee', Number, true)
    public transfer_fee = 0;
    
    @JsonProperty('transfer_fee_type', Number, true)
    public transfer_fee_type = 0;

    @JsonProperty('usd_rate', Number)
    public usd_rate = 0;

    @JsonProperty('icon', String)
    public icon = "";

    @JsonProperty('link_rate', Any)
    public link_rate = "";
    
    @JsonProperty('factor_rate', Number,true)
    public factor_rate = 1;

    @JsonProperty('active', Boolean, true)
    public active = false;

    @JsonProperty('swap_enable', Any, true)
    public swap_enable = null;
    
    @JsonProperty('swap_fee', Number, true)
    public swap_fee = 0;
    
    @JsonProperty('min_swap', Number, true)
    public min_swap = 0;
    
    @JsonProperty('max_swap', Number, true)
    public max_swap = 0;

    @JsonProperty('swap_fee_type', Number, true)
    public swap_fee_type = 0;

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    public getMongoEntity() {
        const result: ICurrency = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
