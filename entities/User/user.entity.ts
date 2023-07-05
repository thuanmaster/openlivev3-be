/* eslint-disable no-underscore-dangle */
import { JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectIdNull, UserRole } from '../../types';
import { Config } from '../../common';
import moment from 'moment';
import { UserRoleConverter } from '../../converters/user-role.converter';
export interface IUser {
    _id: ObjectIdNull;
    password: string;
    email: string;
    fullname: string;
    roles: UserRole[];
    status: Boolean | false;
    createdAt: number | null;
    updatedAt: number | null;
}

@JsonObject('User')
export class UserEntity implements IUser {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('fullname', String, false)
    public fullname = '';

    @JsonProperty('password', String, false)
    public password = '';

    @JsonProperty('email', String, false)
    public email = '';

    @JsonProperty('status', Boolean, true)
    public status = false;

    @JsonProperty('roles', UserRoleConverter)
    public roles = [UserRole.AGENT];

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    public getMongoEntity() {
        const result: IUser = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
