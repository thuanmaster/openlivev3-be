export interface InvestPackageAdminCreateParams {
	title: string;
	description: string;
	avatar: string;
	video: string;
	rare: number;
	meta_data: any;
	currency_method_pay: any;
	price_invest: number;
	currency_invest: string;
	bonus_token: number;
	currency_bonus_token: string;
	dividend_rate: number;
	status: boolean;
	amount: number;
	amount_type: number;
	currency: string;
	from_date: number;
	to_date: number;
	currency_buy: any;
}
export interface InvestPackageAdminUpdateParams {
	invest_package_id: string;
	title: string;
	description: string;
	avatar: string;
	video: string;
	price_invest: number;
	rare: number;
	meta_data: any;
	currency_method_pay: any;
	currency_invest: string;
	bonus_token: number;
	currency_bonus_token: string;
	dividend_rate: number;
	status: boolean;
	amount: number;
	amount_type: number;
	currency: string;
	from_date: number;
	to_date: number;
	currency_buy: any;
}

export const InvestPackageAdminCreateParamsValidator = {
	title: { type: 'string' },
	avatar: { type: 'string' },
	price_invest: { type: 'number' },
	rare: { type: 'number' },
	currency_invest: { type: 'string' },
	bonus_token: { type: 'number' },
	dividend_rate: { type: 'number' },
	currency_bonus_token: { type: 'string' },
	status: { type: 'boolean' },
	amount: { type: 'number' },
	amount_type: { type: 'number' },
	currency: { type: 'string' },
	from_date: { type: 'number' },
	to_date: { type: 'number' },
};

export const InvestPackageAdminUpdateParamsValidator = {
	invest_package_id: { type: 'string' },
};
