import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { ICustomerKYC } from '../../entities';
import { customerCollection } from '..';
import moment from 'moment';

const definition: definitionType<ICustomerKYC> = (collection?: string) => ({
	_id: Types.ObjectId,
	customer_id: {
		type: Types.ObjectId,
		ref: customerCollection,
		required: true,
	},
	number: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		required: true,
	},
	image_front: {
		type: String,
		required: true,
	},
	image_back: {
		type: String,
		required: true,
	},
	image_selfie: {
		type: String,
		required: true,
	},
	reason: {
		type: String,
		required: false,
	},
	status: {
		type: Number,
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

export const CustomerKYCCollection = "customer_kycs";
export const CustomerKYCMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ICustomerKYC>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
