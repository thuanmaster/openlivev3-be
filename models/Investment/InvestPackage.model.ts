import { IInvestPackage } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import moment from 'moment';

const definition: definitionType<IInvestPackage> = (collection?: string) => ({
	_id: Types.ObjectId,
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: false,
	},
	avatar: {
		type: String,
		required: false,
	},
	video: {
		type: String,
		required: false,
	},
	rare: {
		type: Number,
		required: false,
	},
	currency_invest: {
		type: Types.ObjectId,
		required: true,
	},
	currency_method_pay: {
		type: Array,
		required: true,
	},
	price_invest: {
		type: Number,
		default: 0,
	},
	bonus_token: {
		type: Number,
		default: 0,
	},
	currency_bonus_token: {
		type: Types.ObjectId,
		required: true,
	},
	dividend_rate: {
		type: Number,
		required: false,
	},
	status: {
		type: Boolean,
		default: true,
	},
	meta_data: {
		type: Array,
		default: true,
	},
	amount: {
		type: Number,
		default: 0,
		required: false,
	},
	amount_type: {
		type: Number,
		default: 0,
		required: false,
	},
	currency: {
		type: Types.ObjectId,
		required: false,
	},
	from_date: {
		type: Number,
		required: false,
	},
	to_date: {
		type: Number,
		required: false,
	},
	currency_buy: {
		type: Array,
		required: true,
	},
	createdAt: {
		type: Number,
		default: moment().unix(),
	},
	updatedAt: {
		type: Number,
		required: false,
		default: moment().unix(),
	},
	deletedAt: {
		type: Number,
		required: false,
		default: null,
	},
});
export const InvestPackageCollection = 'invest_packages';
export const InvestPackageMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<IInvestPackage>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
