import { DbServiceSettings } from 'moleculer-db';
import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { ITransaction } from '../../entities';
import { ObjectId } from 'mongodb';

export interface TransactionServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/transaction';
	fields: (keyof Required<ITransaction>)[];
}

export interface TransactionServiceOptions extends Options {
	name: 'transaction';
	settings: TransactionServiceSettingsOptions;
}

export interface TransactionAdminServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/admin/transaction';
	fields: (keyof Required<ITransaction>)[];
}

export interface TransactionAdminServiceOptions extends Options {
	name: 'admin.transaction';
	settings: TransactionAdminServiceSettingsOptions;
}

export interface ParamGetBalance {
	currency_code: string;
	customer_id: string;
}

export interface ParamTransactionWithdraw {
	currency_code: string;
	chain_code: string;
	amount: number;
	address: string;
	addressTag: string;
}

export const ParamTransactionWithdrawValidator = {
	currency_code: { type: 'string' },
	chain_code: { type: 'string' },
	address: { type: 'string' },
	amount: { type: 'number', min: 0 },
};

export interface ParamTransactionDeposit {
	from: string;
	to: string;
	transactionHash: string;
	blockNumber: string;
	amount: string;
	currency_id: string;
	chain_id: string;
}

export interface ParamVerifyTransactionWithdraw {
	auth_code: string;
	email_code: string;
	TransactionCode: string;
}
export interface ParamResendVerifyTransactionCode {
	transaction_id: string;
}

export interface TotalEarnedHarvestCustomerParams {
	customer_id: ObjectId;
}

export const ParamResendVerifyTransactionCodeValidator = {
	transaction_id: { type: 'string' },
};

export const ParamVerifyTransactionWithdrawValidator = {
	auth_code: { type: 'string' },
	email_code: { type: 'string' },
	TransactionCode: { type: 'string' },
};
export interface ParamTransactionDepositByTxHash {
	chain_code: string;
	currency_code: string;
	txHash: string;
	amount: number;
	addressTo: string;
}

export const ParamTransactionDepositByTxHashValidator = {
	chain_code: { type: 'string' },
	currency_code: { type: 'string' },
	txHash: { type: 'string' },
	amount: { type: 'number' },
	addressTo: { type: 'string' },
};
export interface CompletedDepositParams {
	transaction_id: string;
}
export const CompletedDepositParamsValidator = {
	transaction_id: { type: 'string' },
};
export interface CheckHashDepositParams {
	tx_hash: string;
	chain_code: string;
}

export const CheckHashDepositParamsValidator = {
	tx_hash: { type: 'string' },
	chain_code: { type: 'string' },
};

export interface ParamTransactionExchange {
	currency_from_code: string;
	currency_to_code: string;
	amount: number;
}

export const ParamTransactionExchangeValidator = {
	currency_from_code: { type: 'string' },
	currency_to_code: { type: 'string' },
	amount: { type: 'number', min: 0 },
};

export enum actionTransaction {
	DEPOSIT = 'DEPOSIT',
	WITHDRAW = 'WITHDRAW',
	REVERSE = 'REVERSE',
	EXCHANGE_IN = 'EXCHANGE_IN',
	EXCHANGE_OUT = 'EXCHANGE_OUT',
	STAKE = 'STAKE',
	UNSTAKE = 'UNSTAKE',
	COMMISSION = 'COMMISSION',
	INTEREST = 'INTEREST',
	INVESTMENT = 'INVESTMENT',
	RECEVICE_TOKEN_INVEST = 'RECEVICE_TOKEN_INVEST',
	BONUS_TOKEN_INVEST = 'BONUS_TOKEN_INVEST',
	DIRECT_COMMISSION_INVEST = 'DIRECT_COMMISSION_INVEST',
	BUY = 'BUY',
	FEE = 'FEE',
	BONUS_ACTIVE = 'BONUS_ACTIVE',
	BONUS_KYC = 'BONUS_KYC',
	BONUS_FIRST_DEPOSIT = 'BONUS_FIRST_DEPOSIT',
	AIRDROP_INVEST = 'AIRDROP_INVEST',
	DIVIDEND = 'DIVIDEND',
	DIVIDEND_COMMISSION = 'DIVIDEND_COMMISSION',
	RANK_REWARD = 'RANK_REWARD',
	PREMIUM_BONUS = 'PREMIUM_BONUS',
	BINARY_COMMISSION = 'BINARY_COMMISSION',
	BONUS_ACTIVE_24H = 'BONUS_ACTIVE_24H',
	INVESTMENT_DAILY_REWARD = 'INVESTMENT_DAILY_REWARD',
	BONUS_OP_INVEST = 'BONUS_OP_INVEST',
	BONUS_TOKEN_BUY_INVEST = 'BONUS_TOKEN_BUY_INVEST',
}

export enum paymentMethod {
	CRYPTO = 'CRYPTO',
	FIAT = 'FIAT',
	INTERNAL = 'INTERNAL',
}

export enum statusTransaction {
	CREATED = 'CREATED',
	ACCEPTED = 'ACCEPTED',
	PROCESSING = 'PROCESSING',
	COMPLETED = 'COMPLETED',
	CANCELED = 'CANCELED',
	FAIL = 'FAIL',
}
