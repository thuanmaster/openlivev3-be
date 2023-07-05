'use strict';
import { InvestmentStatisticMongoModel, InvestmentStatisticCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';


const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbInvestmentStatisticMixin',
	collection: InvestmentStatisticCollection,
	// @ts-ignore
	model: InvestmentStatisticMongoModel(InvestmentStatisticCollection),
});

export const dbInvestmentStatisticMixin = dbBaseMixin.getMixin();
export const eventsInvestmentStatisticMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
