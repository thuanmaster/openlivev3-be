'use strict';
import { countryMongoModel, countryCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from './../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbCountryMixin',
	collection: countryCollection,
	// @ts-ignore
	model: countryMongoModel(countryCollection),
});

export const dbCountryMixin = dbBaseMixin.getMixin();
export const eventsCountryMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
