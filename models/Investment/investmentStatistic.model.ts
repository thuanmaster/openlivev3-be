import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import moment from 'moment';
import { IInvestmentStatistic } from '../../entities';

const definition: definitionType<IInvestmentStatistic> = (collection?: string) => ({
    _id: Types.ObjectId,
    customer_id: {
        type: Types.ObjectId,
        required: true,
        index: true,
    },
    month: {
        type: Number,
        required: true,
        index: true,
    },
    year: {
        type: Number,
        required: true,
        index: true,
    },
    ref_count_f1: {
        type: Number,
        required: true,
    },
    ref_count_member: {
        type: Number,
        required: true,
    },
    ref_sum_f1_volumn: {
        type: Number,
        required: true,
    },
    binary_sum_team_volumn: {
        type: Number,
        required: true,
    },
    binary_sum_team_volumn_break: {
        type: Number,
        required: true,
    },
    ref_sum_team_volumn: {
        type: Number,
        required: true,
    },
    ref_sum_team_volumn_break: {
        type: Number,
        required: true,
    },
    total_self_bought: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Number,
        default: moment().unix(),
    },
    updatedAt: {
        type: Number,
        required: false,
        default: moment().unix()
    },
});

export const InvestmentStatisticCollection = "customer_statistics";
export const InvestmentStatisticMongoModel = (collection: string): unknown => {
    // @ts-ignore
    const schema = new Schema<IInvestmentStatistic>(definition(collection), { autoIndex: true });
    return models[collection] || model(collection, schema);
};
