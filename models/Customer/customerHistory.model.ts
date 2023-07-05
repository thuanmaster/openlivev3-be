import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { ICustomerHistory } from '../../entities';
import { customerCollection } from '..';
import moment from 'moment';

const definition: definitionType<ICustomerHistory> = (collection?: string) => ({
	_id: Types.ObjectId,
	customer_id: {
		type: Types.ObjectId,
		ref: customerCollection,
		required: true,
	},
	ip: {
		type: String,
		max: 100,
		required: true
	},
	action: {
		type: String,
		max: 100,
		required: true
	},
	os: {
		type: String,
		max: 100,
		required: true
	},
	device_id: {
		type: String,
		max: 100,
		required: true
	},
	last_login: {
		type: Number,
		default:moment().unix(),
	},
	createdAt: {
		type: Number,
		default:moment().unix(),
	},
	updatedAt: {
		type: Number,
		default: moment().unix(),
	},
});

export const customerHistoryCollection = "customer_histories";
export const customerHistoryMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ICustomerHistory>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
