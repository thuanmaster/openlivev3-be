'use strict';
import { TransactionCodeMongoModel, TransactionCodeCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbTransactionCodeMixin',
	collection: TransactionCodeCollection,
	// @ts-ignore
	model: TransactionCodeMongoModel(TransactionCodeCollection),
});

export const dbTransactionCodeMixin = dbBaseMixin.getMixin();
export const eventsTransactionCodeMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
