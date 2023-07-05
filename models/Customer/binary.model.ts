import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { IBinary } from '../../entities';
import moment from 'moment';

const definition: definitionType<IBinary> = (collection?: string) => ({
	_id: Types.ObjectId,
	main_id: {
		type: String,
		required: true,
	},
	node_main: {
		type: Number,
		required: true,
		default: 0
	},
	right: {
		type: String,
		required: false,
		default: null
	},
	node_right: {
		type: Number,
		required: false,
		default: 0
	},
	left: {
		type: String,
		required: false,
		default: null
	},
	node_left: {
		type: Number,
		required: false,
		default: 0
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

export const BinaryCollection = "binarys";
export const BinaryMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<IBinary>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
