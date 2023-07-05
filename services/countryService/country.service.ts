'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters } from 'moleculer-db';
import { dbCountryMixin, eventsCountryMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';

import {
	MoleculerDBService,
	RestOptions,
	CountriesServiceOptions,
	CountriesServiceSettingsOptions,
	CountryCreateParams,
	CountryCreateParamsValidator,
	ParamCheckCountryCode
} from '../../types';

import { CountryEntity, ICountry } from '../../entities';
import { CustomValidator } from '../../validators';
import { JsonConvert } from 'json2typescript';

@Service<CountriesServiceOptions>({
	name: 'country',
	version: 1,
	mixins: [dbCountryMixin, eventsCountryMixin],
	settings: {
		idField: '_id',
		pageSize: 10,
		rest: '/v1/country',
		fields: [
			'_id',
			'code',
			'title',
			'phone_code',
			'createdAt',
			'updatedAt',
		]
	},
})
export default class CountryService extends MoleculerDBService<CountriesServiceSettingsOptions, ICountry> {
	/**
	 *  @swagger
	 *
	 *  /v1/country/list:
	 *    get:
	 *      tags:
	 *      - "Countries"
	 *      summary: get list country
	 *      description: get list country
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: get list country
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/list', {
		name: 'list',
		cache: {
			ttl: 60 * 600
		},
	})
	async list(ctx: Context<DbContextParameters>) {
		const params = ctx.params;
		const data = await this._find(ctx, { params });
		return this.responseSuccess(data);
	}

	@Action({
		name: 'CheckCode'
	})
	async CheckCode(ctx: Context<ParamCheckCountryCode>) {
		try {
			const params = ctx.params;
			const checkCode = await this.adapter.findOne({ code: params.code });
			if (checkCode) {
				return true
			} else {
				return false;
			}
		} catch (e) {
			this.logger.error(e);
			return false;
		}
	}
}
