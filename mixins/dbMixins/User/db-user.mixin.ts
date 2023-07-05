'use strict';
import { UserMongoModel, UserCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbUserMixin',
	collection: UserCollection,
	// @ts-ignore
	model: UserMongoModel(UserCollection),
});

export const dbUserMixin = dbBaseMixin.getMixin();
export const eventsUserMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
