import { IOrder } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType, statusOrder } from '../../types';
import moment from 'moment';


const definition: definitionType<IOrder> = (collection?: string) => ({
	_id: Types.ObjectId,
	code: {
		type: String,
		required: true
	},
	package_id: {
		type: Types.ObjectId,
		required: true,
	},
	customer_id: {
		type: Types.ObjectId,
		required: true,
	},
	term_id: {
		type: Types.ObjectId,
		required: true,
	},
	currency_stake_id: {
		type: Types.ObjectId,
		required: true,
	},
	amount_stake: {
		type: Number,
		default: 0,
	},
	amount_usd_stake: {
		type: Number,
		default: 0,
	},
	subscription_date: {
		type: Number,
		default: moment().unix(),
	},
	redemption_date: {
		type: Number,
		default: moment().unix(),
	},
	last_time_reward: {
		type: Number,
		default: moment().unix(),
	},
	status: {
		type: String,
		default: statusOrder.HOLDING,
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
export const OrderCollection = "orders";
export const OrderMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<IOrder>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
