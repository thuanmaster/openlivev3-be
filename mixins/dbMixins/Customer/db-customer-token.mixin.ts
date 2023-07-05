'use strict';
import { customerTokenMongoModel, customerTokenCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbCustomerTokenMixin',
	collection: customerTokenCollection,
	// @ts-ignore
	model: customerTokenMongoModel(customerTokenCollection),
});

export const dbCustomerTokenMixin = dbBaseMixin.getMixin();
export const eventsCustomerTokenMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
