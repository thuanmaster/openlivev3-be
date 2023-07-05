'use strict';
import { OrderMongoModel, OrderCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbOrderMixin',
	collection: OrderCollection,
	// @ts-ignore
	model: OrderMongoModel(OrderCollection),
});

export const dbOrderMixin = dbBaseMixin.getMixin();
export const eventsOrderMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
