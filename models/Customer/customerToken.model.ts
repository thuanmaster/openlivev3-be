import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { ICustomerToken } from '../../entities';
import { customerCollection } from '..';
import moment from 'moment';
const definition: definitionType<ICustomerToken> = (collection?: string) => ({
	_id: Types.ObjectId,
	customer_id: {
		type: Types.ObjectId,
		ref: customerCollection,
		required: true,
	},
	token: {
		type: String,
		max: 100,
		required: true,
		unique: true,
		index: true,
	},
	os: {
		type: String
	},
	device_id: {
		type: String
	},
	active: {
		type: Boolean,
		default: false,
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

export const customerTokenCollection = "customer_tokens";
export const customerTokenMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ICustomerToken>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
