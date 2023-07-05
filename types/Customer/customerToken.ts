import { DbServiceSettings } from "moleculer-db";
import { ObjectId } from '../../types';

export interface ParamCustomerToken {
    customer_id: ObjectId;
    os: string;
    device_id: string;
}

export interface ParamCheckToken {
    token: string;
}

export interface ParamDeleteToken {
    customer_id: ObjectId;
    token: string;
    type: string;
}

export interface CustomerTokensServiceSettingsOptions extends DbServiceSettings {

}