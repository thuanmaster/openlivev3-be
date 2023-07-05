import { DbServiceSettings } from "moleculer-db";
import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { IWallet } from '../../entities';

export interface WalletServiceSettingsOptions extends DbServiceSettings {
    rest: '/v1/wallet';
    fields: (keyof Required<IWallet>)[];
}

export interface WalletServiceOptions extends Options {
    name: 'wallet';
    settings: WalletServiceSettingsOptions;
}

export interface WalletAdminServiceSettingsOptions extends DbServiceSettings {
    rest: '/v1/admin/wallet';
    fields: (keyof Required<IWallet>)[];
}

export interface WalletAdminServiceOptions extends Options {
    name: 'admin.wallet';
    settings: WalletAdminServiceSettingsOptions;
}



export interface CreateWalletParams {
    currency_code: string;
    chain_code: string;
    type: string;
}
export interface CreateWalletChainParams {
    customerId: string;
    address: string;
    typeChain: string;
    private_key: string;
}
export interface ParamUpdateOnhold {
    customerId: string;
    currency_code: string;
    chain_code: string;
    amount: number;
}
export interface BalanceWalletParams {
    currency_code: string;
}

export const BalanceWalletParamsValidator = {
    currency_code: { type: 'string' }
}
export const CreateWalletParamsValidator = {
    currency_code: { type: 'string' },
    chain_code: { type: 'string' },
}
