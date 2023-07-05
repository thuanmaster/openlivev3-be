import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { ICustomerCode } from '../../entities';
import { customerCollection } from '..';
import moment from 'moment';
const definition: definitionType<ICustomerCode> = (collection?: string) => ({
	_id: Types.ObjectId,
	customer_id: {
		type: Types.ObjectId,
		ref: customerCollection,
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

export const customerCodeCollection = "customer_codes";
export const customerCodeMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ICustomerCode>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
