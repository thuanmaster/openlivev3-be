'use strict';
import { SettingMongoModel, SettingCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbSettingMixin',
	collection: SettingCollection,
	// @ts-ignore
	model: SettingMongoModel(SettingCollection),
});

export const dbSettingMixin = dbBaseMixin.getMixin();
export const eventsSettingMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
