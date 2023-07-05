'use strict';
import { CustomerKYCMongoModel, CustomerKYCCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbCustomerKYCMixin',
	collection: CustomerKYCCollection,
	// @ts-ignore
	model: CustomerKYCMongoModel(CustomerKYCCollection),
});

export const dbCustomerKYCMixin = dbBaseMixin.getMixin();
export const eventsCustomerKYCMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
