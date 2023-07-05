import { IInvestment } from '../../entities';
import { model, models, Schema, Types } from 'mongoose';
import { definitionType } from '../../types';
import moment from 'moment';

const definition: definitionType<IInvestment> = (collection?: string) => ({
	_id: Types.ObjectId,
	customer_id: {
		type: Types.ObjectId,
		required: true,
	},
	package_id: {
		type: Types.ObjectId,
		required: true,
	},
	currency_invest: {
		type: Types.ObjectId,
		required: true,
	},
	currency_method_pay_id: {
		type: Types.ObjectId,
		required: true,
	},
	price_invest: {
		type: Number,
		default: 0,
	},
	price_usd_invest: {
		type: Number,
		default: 0,
	},
	bonus_token: {
		type: Number,
		default: 0,
	},
	currency_bonus_token: {
		type: Types.ObjectId,
		required: true,
	},
	dividend_rate: {
		type: Number,
		required: false,
	},
	total_bonus_percent: {
		type: Number,
		required: false,
	},
	nft_id: {
		type: Number,
		required: false,
	},
	admin_mint_nft: {
		type: String,
		required: false,
	},
	admin_sign_id: {
		type: String,
		required: false,
	},
	admin_image_nft: {
		type: String,
		required: false,
	},
	nft_image: {
		type: String,
		required: false,
	},
	nft_video: {
		type: String,
		required: false,
	},
	customer_sign_address: {
		type: String,
		required: false,
	},
	customer_sign_message: {
		type: String,
		required: false,
	},
	customer_sign_signature: {
		type: String,
		required: false,
	},
	customer_sign_date: {
		type: Number,
		required: false,
	},
	admin_sign_address: {
		type: String,
		required: false,
	},
	admin_sign_message: {
		type: String,
		required: false,
	},
	admin_sign_signature: {
		type: String,
		required: false,
	},
	admin_sign_date: {
		type: Number,
		required: false,
	},
	link_contract: {
		type: String,
		required: false,
	},
	status: {
		type: Boolean,
		default: true,
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
		default: null,
	},
});
export const InvestmentCollection = 'investments';
export const InvestmentMongoModel = (collection: string): unknown => {
	// @ts-ignore
	let schema = new Schema<IInvestment>(definition(collection), { autoIndex: true });
	return models[collection] || model(collection, schema);
};
