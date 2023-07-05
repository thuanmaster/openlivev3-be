import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { IUserToken } from '../../entities';
import { UserCollection } from '..';
import moment from 'moment';

const definition: definitionType<IUserToken> = (collection?: string) => ({
	_id: Types.ObjectId,
	user_id: {
		type: Types.ObjectId,
		ref: UserCollection,
		required: true,
	},
	token: {
		type: String,
		max: 100,
		required: true,
		unique: true,
		index: true,
	},
	active: {
		type: Boolean,
		default: false,
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
	expired_at: {
		type: Number,
		required: true,
		default: moment().unix(),
	},
});

export const UserTokenCollection = "user_tokens";
export const UserTokenMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<IUserToken>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
