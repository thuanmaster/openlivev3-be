'use strict';
import { customerHistoryMongoModel, customerHistoryCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbCustomerHistoryMixin',
	collection: customerHistoryCollection,
	// @ts-ignore
	model: customerHistoryMongoModel(customerHistoryCollection),
});

export const dbCustomerHistoryMixin = dbBaseMixin.getMixin();
export const eventsCustomerHistoryMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
