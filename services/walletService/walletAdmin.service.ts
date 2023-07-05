'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { DbContextParameters } from 'moleculer-db';
import { dbWalletMixin, eventsWalletMixin } from '../../mixins/dbMixins';

import {
	MoleculerDBService,
	RestOptions,
	WalletAdminServiceOptions,
	WalletAdminServiceSettingsOptions
} from '../../types';
import { IWallet, WalletEntity } from '../../entities';
import { Types } from 'mongoose';

@Service<WalletAdminServiceOptions>({
	name: 'admin.wallet',
	version: 1,
	mixins: [dbWalletMixin, eventsWalletMixin],
	settings: {
		idField: '_id',
		pageSize: 10,
		rest: '/v1/admin/wallet',
		fields: [
			'_id',
			'address',
			'customer_id',
			'currency',
			'chain',
			'type',
			'createdAt',
			'updatedAt',

		]
	},
})
export default class WalletAdminService extends MoleculerDBService<WalletAdminServiceSettingsOptions, IWallet> {
	/**
	 *  @swagger
	 *
	 *  /v1/admin/wallet/list:
	 *    get:
	 *      tags:
	 *      - "Admin Wallet"
	 *      summary: get list Wallet
	 *      description: get list Wallet
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: currency
	 *          description: currency code
	 *          in: query
	 *          required: false
	 *          type: string
	 *          example : ZUKI 
	 *        - name: customer_id
	 *          description: customer_id
	 *          in: query
	 *          required: false
	 *          type: string
	 *          example : customer_id 
	 *        - name: chain
	 *          description: chain
	 *          in: query
	 *          required: false
	 *          type: string
	 *          example : POLYGON 
	 *        - name: type
	 *          description: type
	 *          in: query
	 *          required: false
	 *          type: string
	 *          example : CRYPTO 
	 *      security:
	 *        - Bearer: [] 
	 *      responses:
	 *        200:
	 *          description: get list Wallet
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/list', {
		name: 'list',
		middleware: ['authAdmin'],
		cache: false,
	})
	async list(ctx: Context<DbContextParameters>) {
		try {

			let params: any = this.sanitizeParams(ctx, ctx.params);
			let query: any = {}

			if (params.currency != undefined) {
				query.currency = params.currency;
			}
			if (params.customer_id != undefined) {
				query.customer_id = Types.ObjectId(params.customer_id);
			}

			if (params.type != undefined) {
				query.type = params.type;
			}

			if (params.chain != undefined) {
				query.chain = params.chain;
			}

			params.query = query
			let wallets: any = await this._list(ctx, { ...params, sort: { createdAt: -1 } });
			let data: any = [];
			let dataWallets = wallets.rows
			for (let index in dataWallets) {
				const wallet = dataWallets[index]

				const balance = await ctx.call('v1.transaction.getBalance', {
					currency_code: wallet.currency,
					customer_id: wallet.customer_id.toString()
				})
				data[index] = wallet;
				data[index].balance = balance;

			}
			wallets.rows = data;
			return this.responseSuccess(wallets);
		} catch (error) {
			this.logger.error("WalletAdminService - list", error);
			return this.responseUnkownError();
		}
	}

	/**
	 *  @swagger
	 *
	 *  /v1/admin/wallet/detail:
	 *    get:
	 *      tags:
	 *      - "Admin Wallet"
	 *      summary: get detail Wallet
	 *      description: get detail Wallet
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      parameters:
	 *        - name: wallet_id
	 *          description: wallet_id
	 *          in: query
	 *          required: false
	 *          type: string
	 *          example : 62754938400b750013580412 
	 *      security:
	 *        - Bearer: [] 
	 *      responses:
	 *        200:
	 *          description: get list Wallet
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/detail', {
		name: 'detail',
		middleware: ['authAdmin'],
		cache: false,
	})
	async detail(ctx: Context<DbContextParameters>) {
		try {
			let params: any = ctx.params;
			let wallet: any = await this.adapter.findById(params.wallet_id);
			if (wallet) {
				const blockchain = await ctx.call('v1.blockchain.findByCode', { code: wallet.chain });
				const customer = await ctx.call('v1.customer.findById', { customer_id: wallet.customer_id });
				wallet.customer = customer;
				const balance = await ctx.call('v1.transaction.getBalance', {
					currency_code: wallet.currency,
					customer_id: wallet.customer_id.toString()
				})
				wallet.blockchain = blockchain;
				wallet.balance = balance;
				return this.responseSuccess(wallet);
			} else {
				return this.responseError('err_not_found', 'Wallet not found');
			}
		} catch (error) {
			this.logger.error("WalletAdminService - detail", error);
			return this.responseUnkownError();
		}
	}

}
