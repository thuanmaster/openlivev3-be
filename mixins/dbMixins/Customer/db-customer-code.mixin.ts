'use strict';
import { customerCodeMongoModel, customerCodeCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbCustomerCodeMixin',
	collection: customerCodeCollection,
	// @ts-ignore
	model: customerCodeMongoModel(customerCodeCollection),
});

export const dbCustomerCodeMixin = dbBaseMixin.getMixin();
export const eventsCustomerCodeMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
