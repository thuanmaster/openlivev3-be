'use strict';
import { Context } from 'moleculer';
import { Action, Delete, Get, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbTeamWalletMixin, eventsTeamWalletMixin } from '../../mixins/dbMixins';
import {
    MoleculerDBService,
    RestOptions,
    TeamWalletsServiceSettingsOptions,
    TeamWalletsServiceOptions
} from '../../types';

import { ITeamWallet, TeamWalletEntity } from '../../entities';
import { DbContextParameters } from 'moleculer-db'

@Service<TeamWalletsServiceOptions>({
    name: 'teamWallet',
    version: 1,
    mixins: [dbTeamWalletMixin, eventsTeamWalletMixin],
    settings: {
        rest: '/v1/teamWallet',
        idField: '_id',
        pageSize: 10,
        fields: [
            '_id',
            'title',
            'address',
            'createdAt',
            'updatedAt',
            'deletedAt',
        ]
    }
})
export default class TeamWalletService extends MoleculerDBService<TeamWalletsServiceSettingsOptions, ITeamWallet> {
    /**
      *  @swagger
      *
      *  /v1/teamWallet/list:
      *    get:
      *      tags:
      *      - "Team Wallet"
      *      summary: get list Wallet
      *      description: get list Wallet
      *      produces:
      *        - application/json
      *      consumes:
      *        - application/json
      *      parameters:
      *        - name: page
      *          description: page
      *          in: query
      *          required: true
      *          type: number
      *          example : 1
      *          default : 1
      *        - name: pageSize
      *          description: pageSize
      *          in: query
      *          required: true
      *          type: number
      *          example : 10
      *          default : 10
      *        - name: title
      *          description: title
      *          in: query
      *          required: false
      *          type: string
      *        - name: address
      *          description: address
      *          in: query
      *          required: false
      *          type: string
      *          example : 0xe10e5e2ab284d1C98afFaBf62a7fcc124880b8eb 
      *      responses:
      *        200:
      *          description: get list Wallet
      *        403:
      *          description: Server error
      */
    @Get<RestOptions>('/list', {
        name: 'list',
        cache: false,
    })
    async list(ctx: Context<DbContextParameters>) {
        try {

            let params: any = this.sanitizeParams(ctx, ctx.params);
            let query: any = {
                deleteAt: null
            }

            if (params.address != undefined && params.address != null) {
                const regex = new RegExp(["^", params.address, "$"].join(""), "i");
                query.address = regex;
            }

            if (params.title != undefined && params.title != null) {
                const regex = new RegExp(["^", params.title, "$"].join(""), "i");
                query.title = regex;
            }

            params.query = query
            let wallets: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
            return this.responseSuccess(wallets);
        } catch (error) {
            this.logger.error("TeamWalletService - list", error);
            return this.responseUnkownError();
        }
    }
}
