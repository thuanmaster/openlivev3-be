'use strict';
import { BinaryMongoModel, BinaryCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbBinaryMixin',
	collection: BinaryCollection,
	// @ts-ignore
	model: BinaryMongoModel(BinaryCollection),
});

export const dbBinaryMixin = dbBaseMixin.getMixin();
export const eventsBinaryMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
