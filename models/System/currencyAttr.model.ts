import { ICurrencyAttr } from '../../entities';
import moment from 'moment';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { CurrencyCollection } from './currency.model';
import { blockchainCollection } from './blockchain.model';

const definition: definitionType<ICurrencyAttr> = (collection?: string) => ({
	_id: Types.ObjectId,
	currency_id: {
		type: Types.ObjectId,
		ref: CurrencyCollection,
		required: true,
	},
	blockchain: {
		type: Types.ObjectId,
		ref: blockchainCollection,
		required: true,
	},
	contract: {
		type: String,
		max: 100,
		required: true,
		index: true,
	},
	abi: {
		type: String,
		required: true
	},
	withdraw_fee_token: {
		type: Number,
		min: 0,
		required: true,
	},
	withdraw_fee_token_type: {
		type: Number,
		min: 0,
		required: true,
	},
	decimal: {
		type: Number,
		min: 0,
		required: true
	},
	withdraw_fee_chain: {
		type: Types.Decimal128,
		min: 0,
		required: true,
	},
	native_token: {
		type: String
	},
	min_withdraw: {
		type: Types.Decimal128,
		min: 0,
		required: true,
	},
	max_withdraw: {
		type: Types.Decimal128,
		min: 0,
		required: true,
	},
	value_need_approve: {
		type: Types.Decimal128,
		min: 0,
		required: true,
	},
	value_need_approve_currency: {
		type: String,
		required: true,
	},
	max_amount_withdraw_daily: {
		type: Types.Decimal128,
		min: 0,
		required: true,
	},
	max_amount_withdraw_daily_currency: {
		type: String,
		required: true,
	},
	max_times_withdraw: {
		type: Number,
		min: 0,
		required: true,
	},
	type_withdraw: {
		type: String,
		required: true,
	},
	type_deposit: {
		type: String,
		required: true,
	},
	type_transfer: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Number,
		default: moment().unix(),
	},
	updatedAt: {
		type: Number,
		default: moment().unix(),
	},
	deletedAt: {
		type: Number,
		default: null,
	}
});

export const CurrencyAttrCollection = "currency_attrs";
export const CurrencyAttrMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ICurrencyAttr>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
