import { IFile } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import moment from 'moment';

const definition: definitionType<IFile> = (collection?: string) => ({
	_id: Types.ObjectId,
	key: {
		type: String,
		max: 100,
		required: true,
	},
	full_link: {
		type: String,
		max: 50,
		required: true,
		index: true,
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
});
export const FileCollection = "files";
export const FileMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<IFile>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
