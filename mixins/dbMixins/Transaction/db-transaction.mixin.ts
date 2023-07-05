'use strict';
import { TransactionMongoModel, TransactionCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbTransactionMixin',
	collection: TransactionCollection,
	// @ts-ignore
	model: TransactionMongoModel(TransactionCollection),
});

export const dbTransactionMixin = dbBaseMixin.getMixin();
export const eventsTransactionMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
