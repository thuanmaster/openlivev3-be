'use strict';
import { Context } from 'moleculer';
import { dbSystemCommissionMixin, eventsSystemCommissionMixin } from '../../mixins/dbMixins';
import { Action, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	paymentMethod,
	statusTransaction,
	SystemCommissionByTypeParams
} from '../../types';
import { ISystemCommission, ICurrency } from '../../entities';
import { DbServiceSettings } from 'moleculer-db';
import { convertObjectId, generateCode } from '../../mixins/dbMixins/helpers.mixin';
import _ from 'lodash';
@Service({
	name: 'systemCommission',
	version: 1,
	mixins: [dbSystemCommissionMixin, eventsSystemCommissionMixin]
})

export default class SystemCommissionService extends MoleculerDBService<DbServiceSettings, ISystemCommission> {
	@Action({
		name: 'commission',
		cache: false
	})
	async commission(ctx: Context<SystemCommissionByTypeParams>) {
		try {
			const params = ctx.params;
			const systemCommissions: ISystemCommission[] = await this.adapter.find({ query: { commission_type: params.type, deletedAt: null } });
			if (systemCommissions) {
				const systemComF0 = _.find(systemCommissions, { level: 0 });
				if (systemComF0) {
					const currencyCom: ICurrency = await ctx.call('v1.currency.find', { currency_id: systemComF0.currency_id });
					let amountCom: number = systemComF0.commission;
					const amount_usd = amountCom * currencyCom.usd_rate;

					const balance: number = await ctx.call('v1.transaction.getBalance', { currency_code: currencyCom.code, customer_id: params.customer_id });
					const code = generateCode(20);
					const ObjCustomerId = convertObjectId(params.customer_id.toString())
					let entityCreate: any = {
						customer: ObjCustomerId,
						currency: currencyCom.code,
						chain: "",
						action: params.type,
						amount: amountCom,
						amount_usd: amount_usd,
						fee: 0,
						balance: balance + +amountCom,
						balanceBefore: balance,
						payment_method: paymentMethod.CRYPTO,
						txhash: code,
						from: params.customer_id,
						to: "",
						status: statusTransaction.COMPLETED,
						order: "",
					}
					await ctx.call('v1.transaction.create', entityCreate)
				}

				const parents: any = await ctx.call('v1.customer.getParentCustomer', { customer_id: params.customer_id });
				if (parents && parents.length > 0) {
					for (let i = 0; i < systemCommissions.length; i++) {
						const directCommission = systemCommissions[i];
						const customer = _.find(parents, { level: directCommission.level });
						const currencyCom: ICurrency = await ctx.call('v1.currency.find', { currency_id: directCommission.currency_id });
						if (currencyCom && customer) {
							if (customer.status_kyc == 2) {
								let amountCom: number = directCommission.commission;
								const amount_usd = amountCom * currencyCom.usd_rate;
								const balance: number = await ctx.call('v1.transaction.getBalance', { currency_code: currencyCom.code, customer_id: customer._id.toString() });
								const code = generateCode(20);
								const ObjCustomerId = convertObjectId(customer._id.toString())
								let entityCreate: any = {
									customer: ObjCustomerId,
									currency: currencyCom.code,
									chain: "",
									action: params.type,
									amount: amountCom,
									amount_usd: amount_usd,
									fee: 0,
									balance: balance + +amountCom,
									balanceBefore: balance,
									payment_method: paymentMethod.CRYPTO,
									txhash: code,
									from: params.customer_id.toString(),
									to: "",
									status: statusTransaction.COMPLETED,
									order: "",
								}
								await ctx.call('v1.transaction.create', entityCreate)
							}
						}
					}
					return true
				} else {
					return false;
				}
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error('SystemCommissionService - commissionBonusActive:', error)
			return false
		}
	}
}
