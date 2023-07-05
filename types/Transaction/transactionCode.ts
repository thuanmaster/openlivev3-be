import { DbServiceSettings } from "moleculer-db";
export interface TransactionCodeServiceSettingsOptions extends DbServiceSettings {

}

export interface ParamCreateTransactionCode {
    transaction_id: string;
    email: string;
    fullname: string;
    typeCode: string;
    subject: string;
    currency: string;
    chain_title: string;
}
export interface ParamCheckCodeTransactionCode {
    transaction_id: string;
    code: string;
    typeCode: string;
    currency_title: string;	
	chain_title: string;	
	contract: string;	
	amount: number;	
	from: string;	
	to: string;	
}

export const CheckTransactionCodeValidator = {
    transaction_id: { type: 'string' },
    code: { type: 'string' },
    typeCode: { type: 'string' }
}
