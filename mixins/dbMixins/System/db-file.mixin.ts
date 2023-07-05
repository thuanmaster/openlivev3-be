'use strict';
import { FileMongoModel, FileCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbFileMixin',
	collection: FileCollection,
	// @ts-ignore
	model: FileMongoModel(FileCollection),
});

export const dbFileMixin = dbBaseMixin.getMixin();
export const eventsFileMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
