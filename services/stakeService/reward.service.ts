'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbPackageMixin, dbRewardMixin, eventsPackageMixin, eventsRewardMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService
} from '../../types';
import { IReward } from '../../entities';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { convertObjectId } from '../../mixins/dbMixins/helpers.mixin';
@Service({
	name: 'reward',
	version: 1,
	mixins: [dbRewardMixin, eventsRewardMixin],
	settings: {
		rest: '/v1/reward',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'package_id',
			'term_id',
			'currency_reward_id',
			'apr_reward',
			'createdAt',
			'updatedAt',
		]
	}
})
export default class RewardService extends MoleculerDBService<DbServiceSettings, IReward> {

	@Action({
		name: 'getRewardByParams',
		cache: false
	})
	async getRewardByParams(ctx: Context): Promise<IReward[] | boolean> {
		try {
			const params: any = ctx.params;
			const rewards: IReward[] = await this._find(ctx, params);
			if (rewards) {
				return rewards;
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error('RewardService - getRewardByParams:', error)
			return false
		}
	}

	@Action({
		name: 'getRewardByTerm',
		cache: false
	})
	async getRewardByTerm(ctx: Context): Promise<IReward[] | boolean> {
		try {
			const params: any = ctx.params;
			const rewards: IReward[] = await this.adapter.find({ query: { package_id: convertObjectId(params.package_id.toString()), term_id: convertObjectId(params.term_id.toString()) } });
			if (rewards) {
				let dataRewards: any = []
				for (let i = 0; i < rewards.length; i++) {
					let reward: any = rewards[i]
					let currency: any = await ctx.call('v1.currency.find', { currency_id: reward.currency_reward_id });
					if (currency) {
						delete currency.link_rate;
					}
					reward.currency_reward = currency
					dataRewards.push(reward)
				}
				return dataRewards;
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error('RewardService - getRewardByTerm:', error)
			return false
		}
	}
}
