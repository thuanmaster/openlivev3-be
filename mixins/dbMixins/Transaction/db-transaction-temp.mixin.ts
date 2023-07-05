'use strict';
import { TransactionTempMongoModel, TransactionTempCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbTransactionTempMixin',
	collection: TransactionTempCollection,
	// @ts-ignore
	model: TransactionTempMongoModel(TransactionTempCollection),
});

export const dbTransactionTempMixin = dbBaseMixin.getMixin();
export const eventsTransactionTempMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
