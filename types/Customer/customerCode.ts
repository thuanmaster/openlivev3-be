import { DbServiceSettings } from "moleculer-db";

export interface ParamCustomerCode {
    customer_id: string;
    email: string;
    typeCode: string;
    fullname: string;
}
export interface ParamCheckCustomerCode {
    customer_id: string;
    code: string;
    typeCode: string;
}

export enum TypeCode {
    ACTIVECODE = 'ACTIVE_CODE',
    LOGINCODE = 'LOGIN_CODE',
    FORGOTPASSWORD = 'FORGOT_PASSWORD',
    UPDATE_WALLET_ADDRESS = 'UPDATE_WALLET_ADDRESS',
}

export const CheckCustomerCodeValidator = {
    code: { type: 'string', min: 2},
    typeCode: { type: 'string', min: 1 },
}

export const CheckCreateCustomerCodeValidator = {
    customer_id: { type: 'string'},
    email: { type: 'email', min: 5},
    typeCode: { type: 'string', min: 1 },
    fullname: { type: 'string' },
}

export interface CustomerCodesServiceSettingsOptions extends DbServiceSettings {

}