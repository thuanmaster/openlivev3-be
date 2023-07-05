import { DbServiceSettings } from "moleculer-db";
import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { IUser } from '../../entities';

export interface UserServiceSettingsOptions extends DbServiceSettings {
    rest: '/v1/admin/user';
    fields: (keyof Required<IUser>)[];
}

export interface UserServiceOptions extends Options {
    name: 'admin.user';
    settings: UserServiceSettingsOptions;
}


export enum UserRole {
	ADMIN = 'ROLE_ADMIN',
	AGENT = 'ROLE_AGENT',
}


export interface CreateUserParams {
	email: string;
	password: string;
	fullname: string;
	role: string;
}
export interface UpdateUserParams {
	email: string;
	userId: string;
	password: string;
	fullname: string;
	role: string;
}

export const CreateUserParamsValidator = {
	email: { type: 'email' },
	password: { type: 'string', min: 10 },
	fullname: { type: 'string' },
	role: { type: 'string' }
}
export interface UserLoginParams {
	email: string;
	password: string;
}

export const UserLoginParamsValidator = {
	email: { type: 'email' },
	password: { type: 'string', min: 10 }
}