import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import { IClaimDeposit } from '../../entities';
import moment from 'moment';

const definition: definitionType<IClaimDeposit> = (collection?: string) => ({
	_id: Types.ObjectId,
	currency: {
		type: String,
		required: true,
	},
	chain: {
		type: String,
		required: true,
	},
	total_amount: {
		type: Number,
		required: false,
	},
	
	admin_claim: {
		type: String,
		required: false,
	},
	list_crawl: {
		type: Array,
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

export const ClaimDepositCollection = "claim_tokens";
export const ClaimDepositMongoModel = (collection: string): unknown => {
	// @ts-ignore
	const schema = new Schema<IClaimDeposit>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
