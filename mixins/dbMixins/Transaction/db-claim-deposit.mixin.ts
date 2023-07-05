'use strict';
import { ClaimDepositMongoModel, ClaimDepositCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbClaimDepositMixin',
	collection: ClaimDepositCollection,
	// @ts-ignore
	model: ClaimDepositMongoModel(ClaimDepositCollection),
});

export const dbClaimDepositMixin = dbBaseMixin.getMixin();
export const eventsClaimDepositMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
