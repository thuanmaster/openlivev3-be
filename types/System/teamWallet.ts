import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbServiceSettings } from 'moleculer-db';
import { ITeamWallet } from '../../entities';

export interface TeamWalletsServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/teamWallet';
	fields: (keyof Required<ITeamWallet>)[];
	populates?: any;
}

export interface TeamWalletsServiceOptions extends Options {
	name: 'teamWallet';
	settings: TeamWalletsServiceSettingsOptions;
}

export interface TeamWalletAdminsServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/admin/teamWallet';
	fields: (keyof Required<ITeamWallet>)[];
	populates?: any;
}

export interface TeamWalletAdminsServiceOptions extends Options {
	name: 'admin.teamWallet';
	settings: TeamWalletAdminsServiceSettingsOptions;
}


export interface TeamWalletAdminCreateParams {
    title: string;
    address: string;
}

export const teamWalletAdminCreateParamsValidator = {
    title: { type: 'string' },
    address: { type: 'string' }
}
