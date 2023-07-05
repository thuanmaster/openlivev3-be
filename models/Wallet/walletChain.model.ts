import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { IWalletChain } from '../../entities';
import { customerCollection } from '..';
import moment from 'moment';


const definition: definitionType<IWalletChain> = (collection?: string) => ({
	_id: Types.ObjectId,

	chain: {
		type: String,
		required: true,
	},
	customer_id: {
		type: Types.ObjectId,
		ref: customerCollection,
		required: false,
	},
	address: {
		type: String,
		required: true,
	},
	private_key: {
		type: String,
		required: false,
	},
	used: {
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

export const WalletChainCollection = "wallet_chains";
export const WalletChainMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<IWalletChain>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
