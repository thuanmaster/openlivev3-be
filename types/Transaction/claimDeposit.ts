import { DbServiceSettings } from "moleculer-db";
import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { IClaimDeposit } from '../../entities';



export interface ClaimDepositAdminServiceSettingsOptions extends DbServiceSettings {
    rest: '/v1/admin/ClaimDeposit';
    fields: (keyof Required<IClaimDeposit>)[];
}

export interface ClaimDepositAdminServiceOptions extends Options {
    name: 'admin.ClaimDeposit';
    settings: ClaimDepositAdminServiceSettingsOptions;
}

export interface CrawlDepositParams {
    currency_id: string;
    blockchain_id: string;
}

export interface ParamClaimDepositQueue {
    currency_id: string;
    blockchain_id: string;
    user_id: string;
}
export interface ParamSendFeeDepositQueue {
    currency: string;
    chain: string;
    address: string;
}

export const CrawlDepositParamsValidator = {
    currency_id: { type: 'string' },
    blockchain_id: { type: 'string' }
}
