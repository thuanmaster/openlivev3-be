import { ICurrency } from '../../entities';
import moment from 'moment';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';

const definition: definitionType<ICurrency> = (collection?: string) => ({
	_id: Types.ObjectId,
	code: {
		type: String,
		max: 100,
		required: true,
		index: true,
	},
	title: {
		type: String,
		max: 100,
		required: true
	},
	type: {
		type: String,
		max: 50,
		required: false,
	},
	min_crawl: {
		type: Number,
		min: 0,
		required: true,
	},
	transfer_fee: {
		type: Number,
		min: 0,
		required: false,
	},
	transfer_fee_type: {
		type: Number,
		min: 0,
		required: false,
	},
	usd_rate: {
		type: Number,
		min: 0,
		required: true,
	},
	swap_enable: {
		type: Array,
		default: null,
	},
	swap_fee: {
		type: Number,
		default: 0,
	},
	swap_fee_type: {
		type: Number,
		default: 0,
	},
	min_swap: {
		type: Number,
		default: 0,
	},
	max_swap: {
		type: Number,
		default: 0,
	},
	icon: {
		type: String,
		required: true,
	},
	link_rate: {
		type: Array,
		required: false,
	},
	factor_rate: {
		type: Number,
		required: false,
		default: 1,
	},
	active: {
		type: Boolean,
		default: true,
	},
	createdAt: {
		type: Number,
		default: moment().unix(),
	},
	updatedAt: {
		type: Number,
		default: moment().unix(),
	}
});
export const CurrencyCollection = "currencies";
export const CurrencyMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ICurrency>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
