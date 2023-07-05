/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';

export interface IInvestmentStatistic {
    _id: ObjectIdNull;
    customer_id: ObjectIdNull;
    month: number;
    year: number;
    total_self_bought: number;
    binary_sum_team_volumn: number;
    binary_sum_team_volumn_break: number;
    ref_sum_team_volumn: number;
    ref_sum_team_volumn_break: number;
    ref_count_member: number;
    ref_count_f1: number;
    ref_sum_f1_volumn: number;
    createdAt: number | null;
    updatedAt: number | null;
}

@JsonObject('InvestmentStatistic')
export class InvestmentStatisticEntity implements IInvestmentStatistic {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('customer_id', Any, false)
    public customer_id = null;

    @JsonProperty('month', Number, false)
    public month = 0;

    @JsonProperty('year', Number, false)
    public year = 0;

    @JsonProperty('total_self_bought', Number, true)
    public total_self_bought = 0;

    @JsonProperty('binary_sum_team_volumn', Number, true)
    public binary_sum_team_volumn = 0;

    @JsonProperty('binary_sum_team_volumn_break', Number, true)
    public binary_sum_team_volumn_break = 0;
    
    @JsonProperty('ref_sum_team_volumn', Number, true)
    public ref_sum_team_volumn = 0;

    @JsonProperty('ref_sum_team_volumn_break', Number, true)
    public ref_sum_team_volumn_break = 0;

    @JsonProperty('ref_count_member', Number, true)
    public ref_count_member = 0;

    @JsonProperty('ref_count_f1', Number, true)
    public ref_count_f1 = 0;

    @JsonProperty('ref_sum_f1_volumn', Number, true)
    public ref_sum_f1_volumn = 0;

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    public getMongoEntity() {
        const result: IInvestmentStatistic = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
