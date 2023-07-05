import { DbServiceSettings } from "moleculer-db";
import { ObjectId, ObjectIdNull } from '../../types';

export interface ParamUserToken {
    user_id: ObjectId;
}

export interface ParamUserCheckToken {
    token: string;
}

export interface ParamUserDeleteToken {
    user_id: ObjectId;
}

export interface UserTokensServiceSettingsOptions extends DbServiceSettings {

}