import { model, models, Schema, Types } from 'mongoose';
import { CustomerRole, CustomerStatus, definitionType } from '../../types';
import { customerProfileCollection } from '..';
import moment from 'moment';
import { ICustomer } from '../../entities';

const definition: definitionType<ICustomer> = (collection?: string) => ({
	_id: Types.ObjectId,
	password: {
		type: String,
		max: 100,
		required: true,
	},
	email: {
		type: String,
		max: 100,
		required: true,
		unique: true,
		index: true,
	},
	wallet_address: {
		type: String,
		max: 100,
		required: true,
		unique: true,
		index: true,
	},
	gg2fa: {
		type: String,
		default: null,
	},
	ref_code: {
		type: String,
		default: null,
	},
	sponsor_id: {
		type: String,
		default: null,
	},
	sponsor_floor: {
		type: Number,
		default: 0,
	},
	sub_user_id: {
		type: String,
		default: null,
	},
	status_2fa: {
		type: Number,
		default: 0,
	},
	status_kyc: {
		type: Number,
		default: 0,
	},
	level_commission: {
		type: Number,
		default: 0,
	},
	status: {
		type: Boolean,
		default: false,
	},
	active_package: {
		type: Boolean,
		default: false,
	},
	lock_status: {
		type: String,
		default: CustomerStatus.NORMAL,
	},
	roles: {
		type: [String],
		enum: Object.values(CustomerRole),
		required: true,
		default: [CustomerRole.USER.toString()],
	},
	profile: {
		type: Types.ObjectId,
		ref: customerProfileCollection,
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
});

export const customerCollection = 'customers';
export const customerMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ICustomer>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
