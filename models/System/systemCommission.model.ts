import { ISystemCommission } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType, SystemCommissionType } from '../../types';
import moment from 'moment';


const definition: definitionType<ISystemCommission> = (collection?: string) => ({
	_id: Types.ObjectId,
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
	commission_type: {
		type: String,
		default: SystemCommissionType.BONUS_ACTIVE,
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
export const SystemCommissionCollection = "system_commissions";
export const SystemCommissionMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<ISystemCommission>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
