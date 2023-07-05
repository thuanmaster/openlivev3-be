'use strict';
import { InvestPackageMongoModel, InvestPackageCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbInvestPackageMixin',
	collection: InvestPackageCollection,
	// @ts-ignore
	model: InvestPackageMongoModel(InvestPackageCollection),
});

export const dbInvestPackageMixin = dbBaseMixin.getMixin();
export const eventsInvestPackageMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
