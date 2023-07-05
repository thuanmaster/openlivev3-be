export interface CommissionStakeParams {
    order_id: string;
}

export interface CommissionAdminCreateParams {
    package_id: string;
    level: number;
    currency_id: string;
    commission: number;
    type: number;
}

export const CommissionAdminCreateParamsValidator = {
    package_id: { type: 'string' },
    currency_id: { type: 'string' },
    level: { type: 'number' },
    commission: { type: 'number' },
    type: { type: 'number' },
}

export interface CommissionAdminUpdateParams {
    package_id: string;
    commission_id: string;
    level: number;
    currency_id: string;
    commission: number;
    type: number;
}

export const CommissionAdminUpdateParamsValidator = {
    package_id: { type: 'string' },
    commission_id: { type: 'string' },
}
