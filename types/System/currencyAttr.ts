import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbServiceSettings } from 'moleculer-db';
import { ICurrencyAttr } from '../../entities';

export interface CurrenciesAttrServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/currencyAttr';
	fields: (keyof Required<ICurrencyAttr>)[];
	populates?: any;
}

export interface CurrenciesAttrServiceOptions extends Options {
	name: 'currencyAttr';
	settings: CurrenciesAttrServiceSettingsOptions;
}


export interface ParamFindCurrencyAttr {
	currency_id: string;
	chain_id: string;
}