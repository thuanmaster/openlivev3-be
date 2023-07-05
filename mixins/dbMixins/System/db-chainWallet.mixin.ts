'use strict';
import { ChainWalletMongoModel, ChainWalletCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbChainWalletMixin',
	collection: ChainWalletCollection,
	// @ts-ignore
	model: ChainWalletMongoModel(ChainWalletCollection),
});

export const dbChainWalletMixin = dbBaseMixin.getMixin();
export const eventsChainWalletMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
