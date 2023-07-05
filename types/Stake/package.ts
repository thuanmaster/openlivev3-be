export enum TypePackage {
	LOCKED = 'LOCKED',
	FLEXIBLE = 'FLEXIBLE',
}

export interface PackageAdminCreateParams {
	currency_stake_id: string;
	title: string;
	min_stake: number;
	max_stake: number;
	description: string;
	type: string;
	start_date: number;
	end_date: number;
}

export interface PackageAdminUpdateParams {
	package_id: string;
	currency_stake_id: string;
	title: string;
	min_stake: number;
	max_stake: number;
	description: string;
	type: string;
	start_date: number;
	end_date: number;
}

export const PackageAdminCreateParamsValidator = {
	currency_stake_id: { type: 'string' },
	title: { type: 'string' },
	min_stake: { type: 'number' },
	max_stake: { type: 'number' },
	description: { type: 'string' },
	type: { type: 'string' },
	start_date: { type: 'number' },
	end_date: { type: 'number' },
}
export const PackageAdminUpdateParamsValidator = {
	package_id: { type: 'string' }
}
