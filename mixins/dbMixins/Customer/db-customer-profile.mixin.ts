'use strict';
import { customerProfileMongoModel, customerProfileCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbCustomerProfileMixin',
	collection: customerProfileCollection,
	// @ts-ignore
	model: customerProfileMongoModel(customerProfileCollection),
});

export const dbCustomerProfileMixin = dbBaseMixin.getMixin();
export const eventsCustomerProfileMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
