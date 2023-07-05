'use strict';
import { customerMongoModel, customerCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';


const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbCustomerMixin',
	collection: customerCollection,
	// @ts-ignore
	model: customerMongoModel(customerCollection),
});

export const dbCustomerMixin = dbBaseMixin.getMixin();
export const eventsCustomerMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
