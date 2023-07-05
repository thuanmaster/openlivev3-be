import { IChainWallet } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { blockchainCollection } from './blockchain.model';
import moment from 'moment';

const definition: definitionType<IChainWallet> = (collection?: string) => ({
	_id: Types.ObjectId,
	chain_id: {
		type: Types.ObjectId,
		ref: blockchainCollection,
		required: true,
	},
	address: {
		type: String,
		max: 50,
		required: true
	},
	privateKey: {
		type: String,
		required: true,
	},
	using: {
		type: Boolean,
		default: false,
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
		default: moment().unix()
	},
	deleteAt: {
		type: Number,
		required: false,
		default: null
	},
});
export const ChainWalletCollection = "chain_wallets";
export const ChainWalletMongoModel = (collection: string): unknown => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const schema = new Schema<IChainWallet>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
