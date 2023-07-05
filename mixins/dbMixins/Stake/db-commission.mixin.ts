'use strict';
import { CommissionMongoModel, CommissionCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbCommissionMixin',
	collection: CommissionCollection,
	// @ts-ignore
	model: CommissionMongoModel(CommissionCollection),
});

export const dbCommissionMixin = dbBaseMixin.getMixin();
export const eventsCommissionMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
