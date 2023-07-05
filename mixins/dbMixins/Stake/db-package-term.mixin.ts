'use strict';
import { PackageTermMongoModel, PackageTermCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';
const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbPackageTermMixin',
	collection: PackageTermCollection,
	// @ts-ignore
	model: PackageTermMongoModel(PackageTermCollection),
});

export const dbPackageTermMixin = dbBaseMixin.getMixin();
export const eventsPackageTermMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
