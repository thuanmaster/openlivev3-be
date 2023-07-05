import { DbServiceSettings } from "moleculer-db";
import { ObjectId } from '../../types';

export interface ParamCustomerProfile {
	customer_id: ObjectId;
	description: string;
	phone_number: string;
	country: string;
	fistname: string;
	lastname: string;
	address: string;
	birthday: string | null;
}
export interface ParamUpdateProfile {
	id: string;
	entity: Object;
}

export interface CustomerProfilesServiceSettingsOptions extends DbServiceSettings {

}