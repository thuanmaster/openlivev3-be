import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbServiceSettings } from 'moleculer-db';
import { ICountry } from '../../entities';

export interface CountriesServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/country';
	fields: (keyof Required<ICountry>)[];
}

export interface CountriesServiceOptions extends Options {
	name: 'country';
	settings: CountriesServiceSettingsOptions;
}

export interface CountryCreateParams {
	title: string;
	code: string;
	phone_code: string;
}
export interface ParamCheckCountryCode {
	code: string;
}

export const CountryCreateParamsValidator = {
	code: { type: 'string' },
	title: { type: 'string', min: 1 },
	phone_code: { type: 'string', min: 1 }
}