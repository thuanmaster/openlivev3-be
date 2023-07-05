'use strict';
import { Context } from 'moleculer';
import { Action, Get, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbSettingMixin, eventsSettingMixin } from '../../mixins/dbMixins';
import {
    MoleculerDBService,
    RestOptions,
    SettingsServiceSettingsOptions,
    SettingTypes
} from '../../types';

import { ISetting, SettingEntity } from '../../entities';
import { JsonConvert } from 'json2typescript';

@Service({
    name: 'setting',
    version: 1,
    mixins: [dbSettingMixin, eventsSettingMixin],
    settings: {
        rest: '/v1/setting',
        idField: '_id',
        pageSize: 10,
        fields: [
            '_id',
            'createdAt',
            'updatedAt',
        ]
    }
})
export default class SettingService extends MoleculerDBService<SettingsServiceSettingsOptions, ISetting> {
    @Action({
        name: 'getOrCreate',
        cache: false
    })
    async getOrCreate(ctx: Context) {
        try {
            const params: any = ctx.params;
            const find: any = await this.adapter.findOne({ key: params.key });
            if (find) {
                return +find.value;
            } else {
                const settingEntity = {
                    key: params.key,
                    value: params.value.toString(),
                }
                const parsedSettingEntity = new JsonConvert().deserializeObject(settingEntity, SettingEntity).getMongoEntity()
                await this._create(ctx, parsedSettingEntity);
                return +params.value;
            }
        } catch (error) {
            this.logger.error('settingService - getOrCreate:', error)
            return false
        }

    }
    @Action({
        name: 'getByKey',
        cache: {
            keys: ['key'],
            ttl: 30 * 60, // 0,5 hour
        },
    })
    async getByKey(ctx: Context) {
        try {
            const params: any = ctx.params;
            const find: any = await this.adapter.findOne({ key: params.key });
            if (find) {
                return find.value;
            } else {
                return null;
            }
        } catch (error) {
            this.logger.error('settingService - getByKey:', error)
            return null
        }

    }

    @Action({
        name: 'updateOrCreate',
        cache: false
    })
    async updateOrCreate(ctx: Context) {
        try {
            const params: any = ctx.params;
            const find: any = await this.adapter.findOne({ key: params.key });
            if (find) {
                return this._update(ctx, { _id: find._id, value: params.value.toString() });
            } else {
                const settingEntity = {
                    key: params.key,
                    value: params.value,
                }
                const parsedSettingEntity = new JsonConvert().deserializeObject(settingEntity, SettingEntity).getMongoEntity()
                await this._create(ctx, parsedSettingEntity);
                return +params.value;
            }
        } catch (error) {
            this.logger.error('settingService - updateOrCreate:', error)
            return false
        }

    }

    /**
    *  @swagger
    *
    *  /v1/setting/menuConfig:
    *    get:
    *      tags:
    *      - "Setting"
    *      summary: Setting
    *      description: Setting
    *      produces:
    *        - application/json
    *      consumes:
    *        - application/json
    *      responses:
    *        200:
    *          description: get Setting
    *        403:
    *          description: Server error
    */
    @Get<RestOptions>('/menuConfig', {
        name: 'menuConfig',
        cache: false,
    })
    async menuConfig() {
        try {

            const SETTING_NETWORK_REF: string = await this.broker.call("v1.setting.getByKey", { key: SettingTypes.SETTING_NETWORK_REF });
            const SETTING_NETWORK_BIN: string = await this.broker.call("v1.setting.getByKey", { key: SettingTypes.SETTING_NETWORK_BIN });
            const SETTING_MAINTANANCE: string = await this.broker.call("v1.setting.getByKey", { key: SettingTypes.SETTING_MAINTANANCE });
            return this.responseSuccess({
                SETTING_NETWORK_REF,
                SETTING_NETWORK_BIN,
                SETTING_MAINTANANCE
            })
        } catch (error) {
            this.logger.error("SettingService - menuConfig", error);
            return this.responseUnkownError();
        }
    }
}
