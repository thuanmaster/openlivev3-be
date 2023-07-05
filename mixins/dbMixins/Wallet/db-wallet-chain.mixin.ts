'use strict';
import { WalletChainMongoModel, WalletChainCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbWalletChainMixin',
	collection: WalletChainCollection,
	// @ts-ignore
	model: WalletChainMongoModel(WalletChainCollection),
});

export const dbWalletChainMixin = dbBaseMixin.getMixin();
export const eventsWalletChainMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
