import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { IWallet } from '../../entities';
import { customerCollection } from '..';
import moment from 'moment';

const definition: definitionType<IWallet> = (collection?: string) => ({
	_id: Types.ObjectId,
	customer_id: {
		type: Types.ObjectId,
		ref: customerCollection,
		required: true,
	},
	currency: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		required: true,
	},
	chain: {
		type: String,
		required: true,
	},
	address: {
		type: String,
		required: true,
	},
	addressTag: {
		type: String,
		required: false,
	},
	privatekey: {
		type: String,
		required: false,
	},
	onhold: {
		type: Number,
		required: false,
	},
	active: {
		type: Boolean,
		required: false,
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

export const WalletCollection = "wallets";
export const WalletMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<IWallet>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
