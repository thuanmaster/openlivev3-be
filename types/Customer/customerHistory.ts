import { DbServiceSettings } from "moleculer-db";

export interface ParamCustomerHistory {
    customer_id: string;
    email: string;
    typeCode: string;
    fullname: string;
}
export interface ParamCheckCustomerHistory {
    customer_id: string;
    code: string;
    typeCode: string;
}

export const CheckCustomerHistoryValidator = {
    customer_id: { type: 'string', min: 1 },
    code: { type: 'string', min: 2, max: 2 },
    typeCode: { type: 'string', min: 1 },
}

export const CheckCreateCustomerHistoryValidator = {
    customer_id: { type: 'string'},
    email: { type: 'email', min: 5},
    typeCode: { type: 'string', min: 1 },
    fullname: { type: 'string' },
}

export interface CustomerHistorysServiceSettingsOptions extends DbServiceSettings {

}