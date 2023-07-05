'use strict';
import { PackageMongoModel, PackageCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbPackageMixin',
	collection: PackageCollection,
	// @ts-ignore
	model: PackageMongoModel(PackageCollection),
});

export const dbPackageMixin = dbBaseMixin.getMixin();
export const eventsPackageMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
