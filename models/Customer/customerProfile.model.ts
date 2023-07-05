import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { ICustomerProfile } from '../../entities';
import { customerCollection } from '..';
import moment from 'moment';
const definition: definitionType<ICustomerProfile> = (collection?: string) => ({
	_id: Types.ObjectId,
	customer_id: {
		type: Types.ObjectId,
		ref: customerCollection,
		required: true,
	},
	phone_number: { type: String },
	phone_code: { type: String },
	description: { type: String },
	country: { type: String },
	fistname: { type: String },
	lastname: { type: String },
	address: { type: String },
	birthday: { type: String, default: '' },
	avatar: { type: String, default: null },
	createdAt: {
		type: Number,
		default: moment().unix(),
	},
	updatedAt: {
		type: Number,
		required: false,
		default: moment().unix(),
	},
});

export const customerProfileCollection = 'customer_profiles';
export const customerProfileMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ICustomerProfile>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
