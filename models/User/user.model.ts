import { model, models, Schema, Types } from 'mongoose';
import { definitionType, UserRole } from '../../types';
import moment from 'moment';
import { IUser } from 'entities';

const definition: definitionType<IUser> = (collection?: string) => ({
	_id: Types.ObjectId,
	password: {
		type: String,
		max: 100,
		required: true,
	},
	email: {
		type: String,
		max: 100,
		required: true,
		unique: true,
		index: true,
	},
	fullname: {
		type: String,
		required: true,
	},
	roles: {
		type: [String],
		enum: Object.values(UserRole),
		required: true,
		default: [UserRole.AGENT.toString()],
	},
	status: {
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
		default: moment().unix()
	},
});

export const UserCollection = "users";
export const UserMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<IUser>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
