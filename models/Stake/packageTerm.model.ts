import { IPackageTerm } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import moment from 'moment';


const definition: definitionType<IPackageTerm> = (collection?: string) => ({
	_id: Types.ObjectId,
	title: {
		type: String,
		required: true
	},
	package_id: {
		type: Types.ObjectId,
		required: true,
	},
	day_reward: {
		type: Number,
		default: 0,
	},
	total_stake: {
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
export const PackageTermCollection = "package_terms";
export const PackageTermMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<IPackageTerm>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
