import { IBlockChain } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import moment from 'moment';

const definition: definitionType<IBlockChain> = (collection?: string) => ({
	_id: Types.ObjectId,
	code: {
		type: String,
		max: 100,
		required: true,
	},
	title: {
		type: String,
		max: 50,
		required: true,
		index: true,
	},
	rpc: {
		type: String,
		max: 50,
		required: false,
	},
	scan: {
		type: String,
		max: 100,
		required: true,
		unique: true,
		index: true,
	},
	chainid: {
		type: Number,
		default: 0,
	},
	type: {
		type: String,
		default: null,
	},
	native_token: {
		type: String,
		default: null,
	},
	contract_banker: {
		type: String,
		default: null,
	},
	banker_owner_address: {
		type: String,
		default: null,
	},
	banker_owner_private: {
		type: String,
		default: null,
	},
	active: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: String,
		default: moment().unix(),
	},
	updatedAt: {
		type: String,
		required: false,
		default: moment().unix()
	},
});

export const blockchainCollection = "blockchains";
export const blockchainMongoModel = (collection: string): unknown => {
	const schema = new Schema<IBlockChain>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
