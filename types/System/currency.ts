import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbServiceSettings } from 'moleculer-db';
import { ICurrency } from '../../entities';

export interface CurrenciesServiceSettingsOptions extends DbServiceSettings {
    rest: '/v1/currency';
    fields: (keyof Required<ICurrency>)[];
    populates?: any;
}

export interface CurrenciesServiceOptions extends Options {
    name: 'currency';
    settings: CurrenciesServiceSettingsOptions;
}

export interface CurrenciesAdminServiceSettingsOptions extends DbServiceSettings {
    rest: '/v1/admin/currency';
    fields: (keyof Required<ICurrency>)[];
    populates?: any;
}

export interface CurrenciesAdminServiceOptions extends Options {
    name: 'admin.currency';
    settings: CurrenciesAdminServiceSettingsOptions;
}

export enum CurencyType {
    CRYPTO = 'CRYPTO',
    FIAT = 'FIAT'
}
export enum TypeWithdraw {
    ONCHAIN = 'ONCHAIN',
}

export enum TypeTransfer {
    TRANSFER = 'TRANSFER',
    WITHDRAW = 'WITHDRAW',
    ALL = 'ALL',
}

export enum TypeDeposit {
    ONCHAIN = 'ONCHAIN',
}

export enum TypeCheckRate {
    BINANCE = 'BINANCE',
    MEXC = 'MEXC',
    PANCAKE = 'PANCAKE',
    DEXSCREENER = 'DEXSCREENER',
    COINMARKETCAP = 'COINMARKETCAP',
}

export interface CurrencyCreateParams {
    title: string;
    code: string;
    min_crawl: number;
    usd_rate: number;
    factor_rate: number;
    icon: string;
    check_rates: any;
    currency_attrs: any;
    swap_enable: any;
    swap_fee: number;
    transfer_fee: number;
    transfer_fee_type: number;
    swap_fee_type: number;
    min_swap: number;
    max_swap: number;
    active: boolean;
}
export interface CurrencyAttrCreateParams {
    blockchain_id: string;
    contract: string;
    abi: string;
    native_token: string;
    withdraw_fee_token: number;
    withdraw_fee_token_type: number;
    withdraw_fee_chain: number;
    min_withdraw: number;
    max_withdraw: number;
    decimal: number;
    type_withdraw: string;
    type_deposit: string;
    type_transfer: string;
    value_need_approve: number;
    value_need_approve_currency: string;
    max_amount_withdraw_daily_currency: string;
    max_amount_withdraw_daily: number;
    max_times_withdraw: number;
}

export const ParamsCurrencyCreateValidator = {
    title: { type: 'string' },
    code: { type: 'string' },
    min_crawl: { type: 'number', min: 0 },
    min_swap: { type: 'number', min: 0 },
    max_swap: { type: 'number', min: 0 },
    swap_fee: { type: 'number', min: 0 },
    swap_fee_type: { type: 'number', min: 0 },
    icon: { type: 'string' }
}

export const ParamsCurrencyAttrCreateValidator = {
    blockchain_id: { type: 'string' },
    type_withdraw: { type: 'string' },
    type_deposit: { type: 'string' },
    withdraw_fee_token: { type: 'number', min: 0 },
    withdraw_fee_token_type: { type: 'number', min: 0 },
    withdraw_fee_chain: { type: 'number', min: 0 },
    decimal: { type: 'number', min: 0 },
    min_withdraw: { type: 'number', min: 0 },
    max_withdraw: { type: 'number', min: 0 },
    value_need_approve: { type: 'number', min: 0 },
    value_need_approve_currency: { type: 'string' },
    max_amount_withdraw_daily: { type: 'number', min: 0 },
    max_amount_withdraw_daily_currency: { type: 'string' },
    max_times_withdraw: { type: 'number', min: 0 },
}
export interface CurrencyUpdateParams {
    title: string;
    currency_id: string;
    code: string;
    min_crawl: number;
    usd_rate: number;
    factor_rate: number;
    icon: string;
    check_rates: any;
    currency_attrs: any;
    active: boolean;
    swap_enable: any;
    swap_fee: number;
    swap_fee_type: number;
    min_swap: number;
    max_swap: number;
    transfer_fee: number;
    transfer_fee_type: number;
}
export interface CurrencyAttrUpdateParams {
    currency_attr_id: string;
    blockchain_id: string;
    contract: string;
    abi: string;
    native_token: string;
    withdraw_fee_token: number;
    withdraw_fee_token_type: number;
    withdraw_fee_chain: number;
    min_withdraw: number;
    max_withdraw: number;
    decimal: number;
    type_withdraw: string;
    type_deposit: string;
    value_need_approve: number;
    value_need_approve_currency: string;
    max_amount_withdraw_daily_currency: string;
    max_amount_withdraw_daily: number;
    max_times_withdraw: number;
    type_transfer: string;
}

export const ParamsCurrencyUpdateValidator = {
    currency_id: { type: 'string' }
}

export const ParamsCurrencyAttrUpdateValidator = {
    currency_attr_id: { type: 'string' }
}
