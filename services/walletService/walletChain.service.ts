'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbWalletChainMixin, eventsWalletChainMixin } from '../../mixins/dbMixins';
import {
	MoleculerDBService,
	WalletChainServiceSettingsOptions
} from '../../types';

import { IWalletChain, WalletChainEntity } from '../../entities';
import { JsonConvert } from 'json2typescript';
import { Web3Token } from '../../libraries';
@Service({
	name: 'walletChain',
	version: 1,
	mixins: [dbWalletChainMixin, eventsWalletChainMixin],
})
export default class WalletChainService extends MoleculerDBService<WalletChainServiceSettingsOptions, IWalletChain> {

	@Action({
		name: 'create',
		cache: false,
	})
	async create(ctx: Context<Record<string, unknown>>) {
		try {
			const params: any = ctx.params;
			const parsedEntity = new JsonConvert().deserializeObject(params, WalletChainEntity).getMongoEntity()
			await this._create(ctx, parsedEntity);
			return true;
		} catch (error) {
			this.logger.error("WalletChainService - create:", error)
			return false;
		}
	}

	@Action({
		name: 'quickCreate',
		cache: false,
	})
	async quickCreate(ctx: Context<Record<string, unknown>>) {
		try {
			const params: any = ctx.params;
			const chainID = params.chain_id;
			const number_wallet: number = params.number;
			const chain: any = await ctx.call('v1.blockchain.id', { id: chainID });
			const web3Token = new Web3Token(chain.rpc);
			for (let i = 0; i < number_wallet; i++) {
				const dataAddress = await web3Token.createWallet();
				const checkAddress = await ctx.call('v1.walletChain.find', { address: dataAddress.address, chain: chainID })
				if (!checkAddress) {
					ctx.call('v1.walletChain.create', {
						chain: chainID,
						address: dataAddress.address,
						private_key: dataAddress.privateKey.slice(2),
						used: false
					})
				}
			}
			return true;
		} catch (error) {
			this.logger.error("WalletChainService - quickCreate:", error)
			return false;
		}
	}

	@Action({
		name: 'find',
		cache: false,
	})
	async find(ctx: Context<Record<string, unknown>>) {
		try {
			const params: any = ctx.params;
			return await this.adapter.findOne(params)
		} catch (error) {
			this.logger.error("WalletChainService - find:", error)
			return false;
		}
	}

	@Action({
		name: 'used',
		cache: false,
	})
	async used(ctx: Context<Record<string, unknown>>) {
		try {
			const params: any = ctx.params;
			return await this.adapter.updateById(params.id, { $set: { used: true } });
		} catch (error) {
			this.logger.error("WalletChainService - used:", error)
			return false;
		}
	}
}
