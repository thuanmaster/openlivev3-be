export interface RewardAdminCreateParams {
	package_id: string;
	term_id: string;
	currency_reward_id: string;
	apr_reward: number;
}

export const RewardAdminCreateParamsValidator = {
	package_id: { type: 'string' },
	term_id: { type: 'string' },
	currency_reward_id: { type: 'string' },
	apr_reward: { type: 'number' }
}

export interface RewardAdminUpdateParams {
	package_id: string;
	reward_id: string;
	currency_reward_id: string;
	apr_reward: number;
}

export const RewardAdminUpdateParamsValidator = {
	reward_id: { type: 'string' }
}

