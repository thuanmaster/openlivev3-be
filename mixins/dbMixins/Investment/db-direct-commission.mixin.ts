'use strict';
import { DirectCommissionMongoModel, DirectCommissionCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbDirectCommissionMixin',
	collection: DirectCommissionCollection,
	// @ts-ignore
	model: DirectCommissionMongoModel(DirectCommissionCollection),
});

export const dbDirectCommissionMixin = dbBaseMixin.getMixin();
export const eventsDirectCommissionMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
