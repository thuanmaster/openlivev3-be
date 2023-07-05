export enum SystemCommissionType {
    BONUS_ACTIVE = 'BONUS_ACTIVE',
    BONUS_KYC = 'BONUS_KYC',
    BONUS_FIRST_DEPOSIT = 'BONUS_FIRST_DEPOSIT',
}

export interface SystemCommissionByTypeParams {
    customer_id: string;
    type: string;
}

export interface SystemCommissionAdminCreateParams {
    commission_type: string;
    level: number;
    currency_id: string;
    commission: number;
}

export const SystemCommissionAdminCreateParamsValidator = {
    commission_type: { type: 'string' },
    currency_id: { type: 'string' },
    level: { type: 'number' },
    commission: { type: 'number' },
}

export interface SystemCommissionAdminUpdateParams {
    commission_type: string;
    commission_id: string;
    level: number;
    currency_id: string;
    commission: number;
}

export const SystemCommissionAdminUpdateParamsValidator = {
    commission_id: { type: 'string' },
}
