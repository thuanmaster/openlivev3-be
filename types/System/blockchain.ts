import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbServiceSettings } from 'moleculer-db';
import { IBlockChain } from '../../entities';

export interface BlockChainsServiceSettingsOptions extends DbServiceSettings {
	rest: '/v1/blockchain';
	fields: (keyof Required<IBlockChain>)[];
}

export interface BlockChainsServiceOptions extends Options {
	name: 'blockchain';
	settings: BlockChainsServiceSettingsOptions;
}

