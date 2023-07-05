
import { IDirectCommission } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import moment from 'moment';


const definition: definitionType<IDirectCommission> = (collection?: string) => ({
	_id: Types.ObjectId,
	level: {
		type: Number,
		required: true,
	},
	package_id: {
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
export const DirectCommissionCollection = "invest_direct_commissions";
export const DirectCommissionMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<IDirectCommission>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
