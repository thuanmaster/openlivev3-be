'use strict';
import { Context } from 'moleculer';
import { Action, Get, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbblockchainMixin, eventsblockchainMixin } from '../../mixins/dbMixins';

import {
	MoleculerDBService,
	RestOptions,
	BlockChainsServiceOptions,
	BlockChainsServiceSettingsOptions
} from '../../types';
import { IBlockChain } from 'entities';
import { Any } from 'json2typescript';

@Service<BlockChainsServiceOptions>({
	name: 'blockchain',
	version: 1,
	mixins: [dbblockchainMixin, eventsblockchainMixin],
	settings: {
		idField: '_id',
		pageSize: 10,
		rest: '/v1/blockchain',
		fields: [
			'_id',
			'code',
			'title',
			'scan',
			'active',
			'chainid',
			'type',
			'createdAt',
			'updatedAt',
		]
	},
})
export default class BlockChainService extends MoleculerDBService<BlockChainsServiceSettingsOptions, IBlockChain> {
	/**
	 *  @swagger
	 *
	 *  /v1/blockchain/list:
	 *    get:
	 *      tags:
	 *      - "BlockChains"
	 *      summary: get list blockchain
	 *      description: get list blockchain
	 *      produces:
	 *        - application/json
	 *      consumes:
	 *        - application/json
	 *      responses:
	 *        200:
	 *          description: get list blockchain
	 *        403:
	 *          description: Server error
	 */
	@Get<RestOptions>('/list', {
		name: 'list',
		cache: false,
	})
	async list(ctx: Context) {
		try {
			let params: any = ctx.params
			params.query = {
				active: true
			}

			const data = await this._find(ctx, params);
			return this.responseSuccess({ data });
		} catch (error) {
			this.logger.error("BlockChainService - list", error);
			return this.responseUnkownError();
		}
	}

	@Action({
		name: 'id',
		cache: {
			keys: ['id'],
			ttl: 60 * 60
		},
	})
	async id(ctx: Context) {
		try {
			let params: any = ctx.params
			const id = params.id
			let data: any = null;

			if (Array.isArray(id)) {
				data = await this.adapter.findByIds(params.id);
			} else {
				data = await this.adapter.findById(params.id);
			}
			if (data) {
				return data;
			} else {
				return null;
			}
		} catch (error) {
			this.logger.error("BlockChainService - id", error);
			return false;
		}
	}

	@Action({
		name: 'findByCode',
		cache: {
			keys: ['code'],
			ttl: 60 * 60
		},
	})
	async findByCode(ctx: Context) {
		try {
			const params: any = ctx.params
			let data: any = await this.adapter.findOne({ code: params.code, active: true });
			delete data.contract_banker
			delete data.banker_owner_address
			delete data.banker_owner_private
			return data;
		} catch (error) {
			this.logger.error("BlockChainService - findByCode", error);
			return false;
		}
	}

	@Action({
		name: 'findByType',
		cache: {
			keys: ['type'],
			ttl: 60 * 60
		},
	})
	async findByType(ctx: Context<Any>) {
		try {
			let params: any = ctx.params
			const data: any = await this.adapter.findOne({
				active: true,
				type: params.type
			});
			return data;
		} catch (error) {
			this.logger.error("BlockChainService - findByType", error);
			return false;
		}
	}

	@Action({
		name: 'getByType',
		cache: {
			keys: ['type'],
			ttl: 60 * 60
		},
	})
	async getByType(ctx: Context<Any>) {
		try {
			let params: any = ctx.params
			const data: any = await this.adapter.find({
				query: {
					active: true,
					type: params.type
				}
			});
			return data;
		} catch (error) {
			this.logger.error("BlockChainService - getByType", error);
			return false;
		}
	}

	@Action({
		name: 'getAll',
		cache: {
			ttl: 60 * 60
		},
	})
	async getAll(ctx: Context<Any>) {
		try {
			return await this.adapter.find({ query: { deleted_at: null, active: true } });
		} catch (error) {
			this.logger.error("BlockChainService - getAll", error);
			return false;
		}
	}

	@Action({
		name: 'getAllEthereum',
		cache: {
			ttl: 60 * 60
		},
	})
	async getAllEthereum(ctx: Context<Any>) {
		try {
			return await this.adapter.find({ query: { type: "ETHEREUM", deleted_at: null, active: true } });
		} catch (error) {
			this.logger.error("BlockChainService - getAllEthereum", error);
			return false;
		}
	}
}
