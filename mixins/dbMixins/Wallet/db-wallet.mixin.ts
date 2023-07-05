'use strict';
import { WalletMongoModel, WalletCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbWalletMixin',
	collection: WalletCollection,
	// @ts-ignore
	model: WalletMongoModel(WalletCollection),
});

export const dbWalletMixin = dbBaseMixin.getMixin();
export const eventsWalletMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
