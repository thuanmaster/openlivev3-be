'use strict';
import { CurrencyMongoModel, CurrencyCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbCurrencyMixin',
	collection: CurrencyCollection,
	// @ts-ignore
	model: CurrencyMongoModel(CurrencyCollection),
});

export const dbCurrencyMixin = dbBaseMixin.getMixin();
export const eventsCurrencyMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
