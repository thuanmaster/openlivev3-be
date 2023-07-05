'use strict';
import moleculer, { Context } from 'moleculer';
import { Action, Method, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbUserTokenMixin, eventsUserTokenMixin, generateCodeAny } from '../../mixins/dbMixins';
import moment from 'moment';
import { UserTokensServiceSettingsOptions, MoleculerDBService, ParamUserCheckToken, ParamUserToken, ParamUserDeleteToken } from '../../types';
import { UserTokenEntity, IUserToken } from '../../entities';
import { JsonConvert } from 'json2typescript';

@Service({
    name: 'UserToken',
    version: 1,
    mixins: [dbUserTokenMixin, eventsUserTokenMixin]
})
export default class UserTokenService extends MoleculerDBService<UserTokensServiceSettingsOptions, IUserToken> {
    @Action({
        name: 'create',
        cache: false
    })
    async create(ctx: Context<ParamUserToken>) {
        try {
            let params = ctx.params;
            const token = generateCodeAny(50)
            let entity = {
                user_id: params.user_id.toString(),
                token: token,
                expired_at: moment().add(1, 'days').unix()
            }
            const parsedUserTokenEntity = new JsonConvert().deserializeObject(entity, UserTokenEntity).getMongoEntity()
            await this._create(ctx, parsedUserTokenEntity);
            return token;
        } catch (e) {
            this.logger.error("UserTokenService - create", e);
            return false;
        }
    }

    @Action({
        name: 'delete',
        cache: false
    })
    async delete(ctx: Context<ParamUserDeleteToken>) {
        try {
            let params = ctx.params;
            let entity: any = { user_id: params.user_id };
            entity = this.sanitizeParams(ctx, entity);
            this.adapter.removeMany(entity);
            return true;
        } catch (e) {
            this.logger.error("UserTokenService - delete", e);
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
    async resolveToken(ctx: Context<ParamUserCheckToken>) {
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
            this.logger.error("UserTokenService - resolveToken", e);
            return false;
        }
    }
}
