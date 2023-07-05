import { DbServiceSettings } from "moleculer-db";
import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { ITransactionTemp } from '../../entities';

export interface TransactionTempServiceSettingsOptions extends DbServiceSettings {
    fields: (keyof Required<ITransactionTemp>)[];
}

export interface TransactionTempServiceOptions extends Options {
    name: 'TransactionTemp';
    settings: TransactionTempServiceSettingsOptions;
}

