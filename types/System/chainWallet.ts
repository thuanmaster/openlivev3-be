import { DbServiceSettings } from "moleculer-db";

export interface ChainWalletServiceSettingsOptions extends DbServiceSettings {

}



export interface ChainWalletAdminCreateParams {
	chain_id: string;
	address: string;
	privateKey: string;
}



export const ChainWalletAdminCreateParamsValidator = {
	chain_id: { type: 'string' },
	address: { type: 'string' },
	privateKey: { type: 'string' }
}
