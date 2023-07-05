'use strict';
import { UserTokenMongoModel, UserTokenCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbUserTokenMixin',
	collection: UserTokenCollection,
	// @ts-ignore
	model: UserTokenMongoModel(UserTokenCollection),
});

export const dbUserTokenMixin = dbBaseMixin.getMixin();
export const eventsUserTokenMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
