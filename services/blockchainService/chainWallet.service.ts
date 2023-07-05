'use strict';
import { Context } from 'moleculer';
import { Action, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { dbChainWalletMixin, eventsChainWalletMixin } from '../../mixins/dbMixins';

import {
	MoleculerDBService,
	ChainWalletServiceSettingsOptions
} from '../../types';
import { IChainWallet } from '../../entities';
import { Any } from 'json2typescript';

@Service({
	name: 'chainWallet',
	version: 1,
	mixins: [dbChainWalletMixin, eventsChainWalletMixin]
})
export default class ChainWalletService extends MoleculerDBService<ChainWalletServiceSettingsOptions, IChainWallet> {

	@Action({
		name: 'getWalletAvaliable',
		cache: false
	})
	async getWalletAvaliable(ctx: Context<Any>) {
		try {
			const params: any = ctx.params;
			const chainId = params.chainId
			const wallet: any = await this.adapter.findOne({ active: true, using: false, chain_id: chainId, deleteAt: null });
			if (wallet) {
				await this.adapter.updateById(wallet._id, { $set: { using: true } });
				return wallet;
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error("ChainWalletervice - getWalletAvaliable", error);
			return false;
		}
	}

	@Action({
		name: 'getWalletChain',
		cache: false
	})
	async getWalletChain(ctx: Context) {
		try {
			const params: any = ctx.params;
			const chainId = params.chainId
			return await this.adapter.findOne({ active: true, chain_id: chainId, deleteAt: null });
		} catch (error) {
			this.logger.error("ChainWalletervice - getWalletAvaliable", error);
			return false;
		}
	}

	@Action({
		name: 'updateNotUse',
		cache: false
	})
	async updateNotUse(ctx: Context<Any>) {
		try {
			const params: any = ctx.params;
			const wallet: any = await this.adapter.findById(params.walletId);
			if (wallet) {
				await this.adapter.updateById(wallet._id, { $set: { using: false } });
				return true;
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error("ChainWalletervice - updateNotUse", error);
			return false;
		}
	}
}
