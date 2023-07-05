'use strict';
import { CurrencyAttrMongoModel, CurrencyAttrCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbCurrencyAttrMixin',
	collection: CurrencyAttrCollection,
	// @ts-ignore
	model: CurrencyAttrMongoModel(CurrencyAttrCollection),
});

export const dbCurrencyAttrMixin = dbBaseMixin.getMixin();
export const eventsCurrencyAttrMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
