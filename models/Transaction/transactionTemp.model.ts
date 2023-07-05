import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { ITransactionTemp } from '../../entities';
import { customerCollection } from '..';
import moment from 'moment';

const definition: definitionType<ITransactionTemp> = (collection?: string) => ({
	_id: Types.ObjectId,
	customer: {
		type: Types.ObjectId,
		ref: customerCollection,
		required: true,
	},
	currency: {
		type: String,
		required: true,
	},
	chain: {
		type: String,
		required: true,
	},
	action: {
		type: String,
		required: true,
	},
	amount: {
		type: Number,
		required: false,
	},
	fee: {
		type: Number,
		required: false,
	},
	balance: {
		type: Number,
		required: false,
	},
	balanceBefore: {
		type: Number,
		required: false,
	},
	payment_method: {
		type: String,
		required: false,
	},
	txhash: {
		type: String,
		required: false,
	},
	to: {
		type: String,
		required: false,
	},
	from: {
		type: String,
		required: false,
	},
	status: {
		type: String,
		required: false,
	},
	order: {
		type: String,
		required: false,
	},
	note: {
		type: String,
		required: false,
	},
	createdAt: {
		type: Number,
		default: moment().unix(),
	},
	updatedAt: {
		type: Number,
		required: false,
		default: moment().unix(),
	}
});

export const TransactionTempCollection = "transaction_temps";
export const TransactionTempMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ITransactionTemp>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
