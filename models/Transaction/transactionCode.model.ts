import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { ITransactionCode } from '../../entities';
import moment from 'moment';
const definition: definitionType<ITransactionCode> = (collection?: string) => ({
	_id: Types.ObjectId,
	transaction_id: {
		type: Types.ObjectId,
		required: true,
	},
	code: {
		type: String,
		max: 100,
		required: true,
		unique: true,
		index: true,
	},
	type: {
		type: String,
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
	expired_at: {
		type: Number,
		required: true,
		default: moment().unix(),
	},
});

export const TransactionCodeCollection = "customer_codes";
export const TransactionCodeMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ITransactionCode>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
