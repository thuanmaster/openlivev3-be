
export interface PackageTermAdminCreateParams {
	package_id: string;
	title: string;
	day_reward: number;
	total_stake: number;
}

export const PackageTermAdminCreateParamsValidator = {
	package_id: { type: 'string' },
	title: { type: 'string' },
	day_reward: { type: 'number' },
	total_stake: { type: 'number' },
}

export interface PackageTermAdminUpdateParams {
	package_id: string;
	package_term_id: string;
	title: string;
	day_reward: number;
}

export const PackageTermAdminUpdateParamsValidator = {
	package_id: { type: 'string' },
	package_term_id: { type: 'string' }
}

