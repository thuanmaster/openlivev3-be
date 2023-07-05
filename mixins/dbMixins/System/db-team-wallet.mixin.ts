'use strict';
import { TeamWalletMongoModel, TeamWalletCollection } from '../../../models';
import { Config } from '../../../common';
import { DbBaseMixin } from '../db-base.mixin';

const dbInfo = Config.DB_INFO;

const dbBaseMixin = new DbBaseMixin({
	dbInfo,
	name: 'dbTeamWalletMixin',
	collection: TeamWalletCollection,
	// @ts-ignore
	model: TeamWalletMongoModel(TeamWalletCollection),
});

export const dbTeamWalletMixin = dbBaseMixin.getMixin();
export const eventsTeamWalletMixin = dbBaseMixin.getEvents([dbBaseMixin.cacheCleanEventName]);
