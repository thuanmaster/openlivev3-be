import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { ITeamWallet } from '../../entities';
import moment from 'moment';

const definition: definitionType<ITeamWallet> = (collection?: string) => ({
	_id: Types.ObjectId,
	title: {
		type: String,
		required: true,
	},
	address: {
		type: String,
		required: true,
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
	deletedAt: {
		type: Number,
		required: false,
		default: null
	},
});

export const TeamWalletCollection = "team_wallets";
export const TeamWalletMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<ITeamWallet>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
