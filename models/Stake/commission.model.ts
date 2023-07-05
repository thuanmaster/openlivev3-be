import { ICommission } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import moment from 'moment';


const definition: definitionType<ICommission> = (collection?: string) => ({
	_id: Types.ObjectId,
	package_id: {
		type: Types.ObjectId,
		required: true,
	},
	level: {
		type: Number,
		required: true,
	},
	currency_id: {
		type: Types.ObjectId,
		required: true,
	},
	commission: {
		type: Number,
		default: 0,
	},
	type: {
		type: Number,
		default: 0,
	},
	createdAt: {
		type: Number,
		default: moment().unix(),
	},
	updatedAt: {
		type: Number,
		required: false,
		default: moment().unix()
	},
	deletedAt: {
		type: Number,
		required: false,
		default: null
	},
});
export const CommissionCollection = "commissions";
export const CommissionMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<ICommission>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
