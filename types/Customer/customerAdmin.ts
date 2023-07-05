import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbServiceSettings } from 'moleculer-db';
import { ICustomer } from '../../entities';

export interface CustomerAdminServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/admin/customer';
	fields: (keyof Required<ICustomer>)[];
}

export interface CustomerAdminServiceOptions extends Options {
	name: 'admin.customer';
	settings: CustomerAdminServiceSettingsOptions;
}

export interface CustomerAdminCreateParams {
	email: string;
	password: string;
	phone_number: string;
	country: string;
	fistname: string;
	lastname: string;
	birthday: Date;
	status: Boolean;
	lock_status: string;
	address: string;
	sponsor_email: string;
}



export const CustomerAdminCreateParamsValidator = {
	email: { type: 'email' },
	password: { type: 'string', min: 10 },
	phone_number: { type: 'string' },
	country: { type: 'string', min: 2, max: 2 },
	fistname: { type: 'string' },
	lastname: { type: 'string' }
}

export interface CustomerAdminUpdateParams {
	customer_id: string;
	email: string;
	password: string;
	phone_number: string;
	country: string;
	fistname: string;
	lastname: string;
	birthday: Date;
	status: Boolean;
	lock_status: string;
	address: string;
	sponsor_email: string;
}

export const CustomerAdminUpdateParamsValidator = {
	customer_id: { type: 'string' }
}
