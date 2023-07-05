'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbCommissionMixin, eventsCommissionMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	RestOptions,
	CommissionStakeParams,
	actionTransaction,
	statusTransaction,
	paymentMethod
} from '../../types';
import { CommissionEntity, ICommission, ICurrency, IOrder } from '../../entities';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { convertObjectId, generateCode } from '../../mixins/dbMixins/helpers.mixin';
import * as _ from 'lodash';
@Service({
	name: 'commission',
	version: 1,
	mixins: [dbCommissionMixin, eventsCommissionMixin],
	settings: {
		rest: '/v1/commission',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'package_id',
			'level',
			'currency_id',
			'commission',
			'type',
			'createdAt',
			'updatedAt',
		]
	}
})
export default class CommissionService extends MoleculerDBService<DbServiceSettings, ICommission> {
	@Action({
		name: 'commissionStake',
		cache: false
	})
	async commissionStake(ctx: Context<CommissionStakeParams>) {
		try {
			const params = ctx.params;
			const order: IOrder = await ctx.call('v1.order.findById', { order_id: params.order_id });
			if (order) {
				const amount_usd_stake = order.amount_usd_stake;
				const commissions: ICommission[] = await this.adapter.find({ package_id: order.package_id });
				if (commissions) {
					const parents: any = await ctx.call('v1.customer.getParentCustomer', { customer_id: order.customer_id });
					if (parents && parents.length > 0) {
						for (let i = 0; i < commissions.length; i++) {
							const commission = commissions[i];
							const customer = _.find(parents, { level: commission.level });
							const currencyCom: ICurrency = await ctx.call('v1.currency.find', { currency_id: commission.currency_id });
							if (currencyCom && customer) {
								let amountCom: number = commission.commission;
								if (commission.type == 0) {
									amountCom = amount_usd_stake * (amountCom / 100)
								}

								const amountCurrency = amountCom / currencyCom.usd_rate;
								const balance: number = await ctx.call('v1.transaction.getBalance', { currency_code: currencyCom.code, customer_id: customer._id.toString() });
								const code = generateCode(20);

								let entityCreate: any = {
									customer: convertObjectId(customer._id.toString()),
									currency: currencyCom.code,
									chain: "",
									action: actionTransaction.COMMISSION,
									amount: amountCurrency,
									amount_usd: amountCom,
									fee: 0,
									balance: balance + +amountCurrency,
									balanceBefore: balance,
									payment_method: paymentMethod.CRYPTO,
									txhash: code,
									from: "",
									to: "",
									status: statusTransaction.COMPLETED,
									order: order._id?.toString(),
								}

								await ctx.call('v1.transaction.create', entityCreate)
							}
						}
						return true
					} else {
						return false;
					}
				} else {
					return false;
				}
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error('CommissionService - commissionStake:', error)
			return false
		}
	}
}
