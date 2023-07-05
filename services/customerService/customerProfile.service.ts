'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbCustomerProfileMixin, eventsCustomerProfileMixin, generateCode } from '../../mixins/dbMixins';
import moment from 'moment';
import { CustomerProfilesServiceSettingsOptions, MoleculerDBService, ParamCustomerProfile, ParamUpdateProfile } from '../../types';
import { CustomerProfileEntity, ICustomerProfile } from '../../entities';
import { JsonConvert } from 'json2typescript';

@Service({
    name: 'CustomerProfile',
    version: 1,
    mixins: [dbCustomerProfileMixin, eventsCustomerProfileMixin]
})
export default class CustomerProfileService extends MoleculerDBService<CustomerProfilesServiceSettingsOptions, ICustomerProfile> {
    @Action({
        name: 'CreateProfile',
        cache: false
    })
    async CreateProfile(ctx: Context<ParamCustomerProfile>) {
        try {
            let params = ctx.params;
            const parsedCustomerProfileEntity = new JsonConvert().deserializeObject(params, CustomerProfileEntity).getMongoEntity()
            await this._create(ctx, parsedCustomerProfileEntity);
            return this.responseSuccess({ message: 'Create profile success' })
        } catch (e) {
            this.logger.error(e);
            return this.responseError('err_profile', 'Create profile error');
        }
    }

    @Action({
        name: 'updateProfile',
        cache: false
    })
    async updateProfile(ctx: Context<ParamUpdateProfile>) {
        try {
            let params = ctx.params;
            let entity: any = params.entity;
            entity.updatedAt = moment().unix().toString();
            await this.adapter.updateById(params.id, { $set: entity });
            return true
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'id',
        cache: false
    })
    async findProfileId(ctx: Context) {
        try {
            let params: any = ctx.params;
            const profile = await this.adapter.findOne({ customer_id: params.customer_id.toString() });
            if (profile) {
                return profile;
            } else {
                return false;
            }
        } catch (e) {
            this.logger.error(e);
            return this.responseUnkownError();
        }
    }
}
