'use strict';
import { InvestmentMongoModel, InvestmentCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbInvestmentMixin',
	collection: InvestmentCollection,
	// @ts-ignore
	model: InvestmentMongoModel(InvestmentCollection),
});

export const dbInvestmentMixin = dbBaseMixin.getMixin();
export const eventsInvestmentMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
