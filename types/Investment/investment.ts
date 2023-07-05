import { DbServiceSettings } from 'moleculer-db';
import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { IInvestment } from '../../entities';
import { ObjectId } from 'mongodb';

export interface InvestmentServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/investment';
	fields: (keyof Required<IInvestment>)[];
}

export interface InvestmentServiceOptions extends Options {
	name: 'investment';
	settings: InvestmentServiceSettingsOptions;
}

export interface InvestmentAdminServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/admin/investment';
	fields: (keyof Required<IInvestment>)[];
}

export interface InvestmentAdminServiceOptions extends Options {
	name: 'admin.investment';
	settings: InvestmentAdminServiceSettingsOptions;
}

export interface ParamBonusActive24H {
	investment_id: string;
}
export interface ParamBonusTokenInvest {
	investment_id: string;
	rate: number;
}

export interface DividendInvestParams {
	total_amount: number;
}

export const DividendInvestParamsValidator = {
	total_amount: { type: 'number' },
};

export interface ParamSignInvestment {
	investment_id: string;
	address: string;
	signature: string;
	message: string;
}
export interface ParamMetaDataNft {
	contract: string;
	nft_id: number;
}

export const ParamSignInvestmentValidator = {
	investment_id: { type: 'string' },
	address: { type: 'string' },
	signature: { type: 'string' },
	message: { type: 'string' },
};
