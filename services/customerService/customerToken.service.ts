'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbCustomerTokenMixin, eventsCustomerTokenMixin, generateCodeAny } from '../../mixins/dbMixins';
import moment from 'moment';
import { CustomerTokensServiceSettingsOptions, MoleculerDBService, ParamCheckToken, ParamCustomerToken, ParamDeleteToken } from '../../types';
import { CustomerTokenEntity, ICustomerToken } from '../../entities';
import { JsonConvert } from 'json2typescript';

@Service({
    name: 'CustomerToken',
    version: 1,
    mixins: [dbCustomerTokenMixin, eventsCustomerTokenMixin]
})
export default class CustomerTokenService extends MoleculerDBService<CustomerTokensServiceSettingsOptions, ICustomerToken> {
    @Action({
        name: 'CreateToken',
        cache: false
    })
    async CreateToken(ctx: Context<ParamCustomerToken>) {
        try {
            let params = ctx.params;
            const token = generateCodeAny(50)
            let entity = {
                customer_id: params.customer_id.toString(),
                token: token,
                os: params.os,
                device_id: params.device_id,
                expired_at: moment().add(1, 'days').unix()
            }
            const parsedCustomerTokenEntity = new JsonConvert().deserializeObject(entity, CustomerTokenEntity).getMongoEntity()
            await this._create(ctx, parsedCustomerTokenEntity);
            return token;
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'deleteToken',
        cache: false
    })
    async deleteToken(ctx: Context<ParamDeleteToken>) {
        try {
            let params = ctx.params;
            let entity: any = { customer_id: params.customer_id };
            if (params.type != 'all') {
                entity.token = params.token;
            }
            entity = this.sanitizeParams(ctx, entity);
            this.adapter.removeMany(entity);
            return true;
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }

    @Action({
        name: 'resolveToken',
        cache: {
			keys: ['token'],
			ttl: 30 * 60, // 0,5 hour
		},
    })
    async resolveToken(ctx: Context<ParamCheckToken>) {
        try {
            let params = ctx.params;
            const checkCode: any = await this.adapter.findOne({ token: params.token });
            if (checkCode) {
                const currentTime = moment().unix()
                const expire = checkCode.expired_at;
                if (currentTime < expire) {
                    return checkCode;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } catch (e) {
            this.logger.error(e);
            return false;
        }
    }
}
