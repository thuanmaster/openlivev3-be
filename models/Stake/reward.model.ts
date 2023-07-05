import { IReward } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import moment from 'moment';

const definition: definitionType<IReward> = (collection?: string) => ({
	_id: Types.ObjectId,
	title: {
		type: String,
		required: true
	},
	package_id: {
		type: Types.ObjectId,
		required: true,
	},
	term_id: {
		type: Types.ObjectId,
		required: true,
	},
	currency_reward_id: {
		type: Types.ObjectId,
		required: true,
	},
	apr_reward: {
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
});
export const RewardCollection = "rewards";
export const RewardMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<IReward>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
