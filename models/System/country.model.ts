import { ICountry } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import moment from 'moment';

const definition: definitionType<ICountry> = (collection?: string) => ({
	_id: Types.ObjectId,
	code: {
		type: String,
		max: 100,
		required: true,
	},
	title: {
		type: String,
		max: 50,
		required: true,
		index: true,
	},
	phone_code: {
		type: String,
		max: 50,
		required: false,
	},
	createdAt: {
		type: String,
		default: moment().unix(),
	},
	updatedAt: {
		type: String,
		required: false,
		default: moment().unix()
	},
});
export const countryCollection = "countries";
export const countryMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<ICountry>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
