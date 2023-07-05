import { DbServiceSettings } from "moleculer-db";
import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { ICustomerKYC } from '../../entities';

export interface CustomerKYCServiceSettingsOptions extends DbServiceSettings {
    rest: '/v1/customer';
    fields: (keyof Required<ICustomerKYC>)[];
}

export interface CustomerKYCServiceOptions extends Options {
    name: 'customer.kyc';
    settings: CustomerKYCServiceSettingsOptions;
}



export interface KycRequestParams {
    type: string;
    number: string;
    country_code: string;
    image_front: string;
	image_back: string;
	image_selfie: string;
    fistname: string;
    lastname: string;
    birthday: Date;
}



export const KycRequestValidator = {
    type: { type: 'string' },
    number: { type: 'string'},
    country_code: { type: 'string', min: 2, max: 2 },
    fistname: { type: 'string' },
    lastname: { type: 'string' },
    image_selfie: { type: 'string' },
    image_back: { type: 'string' },
    image_front: { type: 'string' },
    birthday: { type: 'date', convert: true },
}