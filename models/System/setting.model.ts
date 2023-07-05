import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { ISetting } from '../../entities';
import moment from 'moment';

const definition: definitionType<ISetting> = (collection?: string) => ({
	_id: Types.ObjectId,
	key: {
		type: String,
		required: true,
	},
	value: {
		type: String,
		required: true,
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

export const SettingCollection = "settings";
export const SettingMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ISetting>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
