import { ObjectId } from "mongodb";


export interface OrderCreateParams {
    customer_id: ObjectId;
    package_id: ObjectId;
    term_id: ObjectId;
    amount_stake: number;
    amount_usd_stake: number;
    subscription_date: number,
    redemption_date: number;
    status: number;
}

export interface TotalStakeTermParams {
    term_id: ObjectId;
}

export interface TotalStakeCustomerParams {
    customer_id: ObjectId;
}
export interface TotalHarvestCustomerParams {
    customer_id: ObjectId;
}


export interface PackageStakeParams {
	package_id: string;
	term_id: string;
	amount: string;
}

export const PackageStakeParamsValidator = {
	package_id: { type: 'string' },
	term_id: { type: 'string' },
	amount: { type: 'number' },
}
export interface ClaimRewardParams {
	order_id: string;
}

export const ClaimRewardParamsValidator = {
	order_id: { type: 'string' }
}


export enum statusOrder {
    HOLDING = 'HOLDING',
    UNSTAKE = 'UNSTAKE',
    COMPLETED = 'COMPLETED'
}