'use strict';
import { SystemCommissionMongoModel, SystemCommissionCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbSystemCommissionMixin',
	collection: SystemCommissionCollection,
	// @ts-ignore
	model: SystemCommissionMongoModel(SystemCommissionCollection),
});

export const dbSystemCommissionMixin = dbBaseMixin.getMixin();
export const eventsSystemCommissionMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
