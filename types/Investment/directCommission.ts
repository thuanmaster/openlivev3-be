export interface DirectCommissionInvestParams {
    investment_id: string;
}

export interface DirectCommissionAdminCreateParams {
    level: number;
    currency_id: string;
    package_id: string;
    commission: number;
    type: number;
}

export const DirectCommissionAdminCreateParamsValidator = {
    package_id: { type: 'string' },
    level: { type: 'number' },
    commission: { type: 'number' },
    type: { type: 'number' },
}

export interface DirectCommissionAdminUpdateParams {
    package_id: string;
    commission_id: string;
    level: number;
    currency_id: string;
    commission: number;
    type: number;
}

export const DirectCommissionAdminUpdateParamsValidator = {
    commission_id: { type: 'string' },
}
