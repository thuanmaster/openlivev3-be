'use strict';
import { blockchainMongoModel, blockchainCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbBlockchainMixin',
	collection: blockchainCollection,
	// @ts-ignore
	model: blockchainMongoModel(blockchainCollection),
});

export const dbblockchainMixin = dbBaseMixin.getMixin();
export const eventsblockchainMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
