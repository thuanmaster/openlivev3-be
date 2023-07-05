import { IPackage } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType, TypePackage } from '../../types';
import moment from 'moment';


const definition: definitionType<IPackage> = (collection?: string) => ({
	_id: Types.ObjectId,
	title: {
		type: String,
		required: true
	},
	currency_stake_id: {
		type: Types.ObjectId,
		required: true,
	},
	min_stake: {
		type: Number,
		default: 0,
	},
	max_stake: {
		type: Number,
		default: 0,
	},
	description: {
		type: String,
		default: null,
	},
	type: {
		type: String,
		default: TypePackage.FLEXIBLE,
	},
	start_date: {
		type: Number,
		default: moment().unix(),
	},
	end_date: {
		type: Number,
		default: moment().unix(),
	},
	status: {
		type: Boolean,
		default: true,
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
export const PackageCollection = "packages";
export const PackageMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<IPackage>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
