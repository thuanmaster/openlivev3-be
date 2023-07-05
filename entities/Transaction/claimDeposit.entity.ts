/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';

export interface IClaimDeposit {
    _id: ObjectIdNull;
    currency: string;
    chain: string;
    total_amount: number;
    admin_claim: string;
    list_crawl: any;
    createdAt: number | null;
    updatedAt: number | null;
}

@JsonObject('ClaimDeposit')
export class ClaimDepositEntity implements IClaimDeposit {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('currency', String, false)
    public currency = '';

    @JsonProperty('chain', String, false)
    public chain = "";

    @JsonProperty('total_amount', Number, true)
    public total_amount = 0;
    
    @JsonProperty('list_crawl', Any, true)
    public list_crawl = [];

    @JsonProperty('admin_claim', String, true)
    public admin_claim = "";

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    public getMongoEntity() {
        const result: IClaimDeposit = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
