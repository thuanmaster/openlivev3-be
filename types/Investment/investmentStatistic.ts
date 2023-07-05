import { DbServiceSettings } from "moleculer-db";
import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { IInvestmentStatistic } from '../../entities';

export interface InvestmentStatisticsServiceSettingsOptions extends DbServiceSettings {
    rest: '/v1/investmentStatistic';
    fields: (keyof Required<IInvestmentStatistic>)[];
}

export interface InvestmentStatisticsServiceOptions extends Options {
    name: 'investmentStatistic';
    settings: InvestmentStatisticsServiceSettingsOptions;
}

export interface ParamUpdateInvestmentStatistic {
    customer_id: string;
    action: string;
    amount_invest_usd: number;
    month: number;
    year: number;
}
export interface ParamRemoveDataInvestmentStatistic {
    customer_id: string;
    action: string;
    amount_invest_usd: number;
    month: number;
    year: number;
}
export interface ParamFindStatistic {
    customer_id: string;
    month: number;
    year: number;
}

export interface ParamCreateInvestmentStatistic {
    customer_id: string;
}
