import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbServiceSettings } from 'moleculer-db';
import { ICustomer } from '../../entities';

export interface CustomersServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/customer';
	fields: (keyof Required<ICustomer>)[];
}

export interface CustomersServiceOptions extends Options {
	name: 'customer';
	settings: CustomersServiceSettingsOptions;
}
export interface CustomerCreateParams {
	email: string;
	wallet_address: string;
	password: string;
	phone_number: string;
	phone_code: string;
	country: string;
	ref_code: string;
	fistname: string;
	lastname: string;
	sponsorKey: string;
}
export interface ActiveAccountParams {
	email: string;
	code: string;
}
export interface LoginParams {
	email: string;
	password: string;
}
export interface ParamUpdate2FA {
	customer_id: string;
	code: string;
	status: boolean;
}
export interface VerifyLoginParams {
	token: string;
	code: string;
	device_id: string;
	os: string;
}

export interface VerifyMessageParams {
	address: string;
	signature: string;
	message: number;
	device_id: string;
	os: string;
}
export interface RequestForgotPasswordParams {
	email: string;
}
export interface ForgotPasswordParams {
	email: string;
	new_password: string;
	code: string;
}
export interface UpdateProfileParams {
	phone_number: string;
	phone_code: string;
	country: string;
	fistname: string;
	avatar: string;
	lastname: string;
	birthday: Date;
	address: string;
	wallet_address: string;
}

export interface ParamCheckRole {
	token: string;
	role: string;
}
export interface ParamVerifyUpdateWalletAddress {
	wallet_address: string;
	code_email: string;
	code_2fa: string;
}

export const VerifyUpdateWalletAddressValidator = {
	wallet_address: { type: 'string' },
	code_email: { type: 'string' },
	code_2fa: { type: 'string' },
};

export const CustomerCreateParamsValidator = {
	email: { type: 'email' },
	wallet_address: { type: 'string' },
	password: { type: 'string', min: 10 },
	phone_number: { type: 'string' },
	country: { type: 'string', min: 2, max: 2 },
	fistname: { type: 'string' },
	lastname: { type: 'string' },
};

export const CustomerParamsVerifyMessageValidator = {
	address: { type: 'string' },
	signature: { type: 'string' },
	message: { type: 'number' },
	device_id: { type: 'string' },
	os: { type: 'string' },
};

export const ActiveAccountParamsValidator = {
	email: { type: 'email' },
	code: { type: 'string', min: 6 },
};

export const UpdateProfileParamsValidator = {
	phone_number: { type: 'string' },
	country: { type: 'string', min: 2, max: 2 },
	fistname: { type: 'string' },
	lastname: { type: 'string' },
	address: { type: 'string' },
	birthday: { type: 'date', convert: true },
};

export const ForgotPasswordParamsValidator = {
	email: { type: 'email' },
	new_password: { type: 'string', min: 10 },
	code: { type: 'string', min: 6 },
};
export const RequestForgotPasswordParamsValidator = {
	email: { type: 'email' },
};

export interface ParamResolveToken {
	token: string;
}

export enum CustomerRole {
	ADMIN = 'ROLE_ADMIN',
	USER = 'ROLE_USER',
}

export enum CustomerStatus {
	NORMAL = 'NORMAL',
	FORBIDDEN_WITHDRAW = 'FORBIDDEN_WITHDRAW',
	FORBIDDEN_ALL = 'FORBIDDEN_ALL',
	DELETED_BY_USER = 'DELETED_BY_USER',
	DELETED_BY_ADMIN = 'DELETED_BY_ADMIN',
}

export enum CustomerEvent {
	LOGIN = 'customer.login',
}
