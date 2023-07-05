'use strict';
import { RewardMongoModel, RewardCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbRewardMixin',
	collection: RewardCollection,
	// @ts-ignore
	model: RewardMongoModel(RewardCollection),
});

export const dbRewardMixin = dbBaseMixin.getMixin();
export const eventsRewardMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
