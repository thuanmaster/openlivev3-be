'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbDirectCommissionMixin, eventsDirectCommissionMixin } from '../../mixins/dbMixins';
import { Action, Get, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
	MoleculerDBService,
	DirectCommissionInvestParams,
	actionTransaction,
	paymentMethod,
	statusTransaction,
	RestOptions
} from '../../types';
import { ICurrency, IDirectCommission, IInvestment } from '../../entities';
import { DbServiceSettings } from 'moleculer-db';
import { convertObjectId, generateCode } from '../../mixins/dbMixins/helpers.mixin';
import _ from 'lodash';
@Service({
	name: 'directCommission',
	version: 1,
	mixins: [dbDirectCommissionMixin, eventsDirectCommissionMixin],
	settings: {
		rest: '/v1/directCommission',
		idField: '_id',
		pageSize: 10,
		fields: [
			'_id',
			'level',
			'package_id',
			'currency_id',
			'commission',
			'type',
			'createdAt',
			'updatedAt',
		]
	}
})

export default class DirectCommissionService extends MoleculerDBService<DbServiceSettings, IDirectCommission> {
	@Get<RestOptions>('/reCommissionInvest', {
		name: 'reCommissionInvest',
		cache: false,
	})
	async reCommissionInvest(ctx: Context) {
		const params: any = ctx.params;
		await ctx.call('v1.directCommission.commissionInvest', { investment_id: params.investment_id })
	}

	@Action({
		name: 'commissionInvest',
		cache: false
	})
	async commissionInvest(ctx: Context<DirectCommissionInvestParams>) {
		try {
			const params = ctx.params;
			const investment: IInvestment = await ctx.call('v1.investment.findById', { investment_id: params.investment_id });
			if (investment) {
				const checkTransacion = await ctx.call('v1.transaction.findByQuery', {
					order: investment._id?.toString(),
					from: investment.customer_id.toString(),
					action: actionTransaction.DIRECT_COMMISSION_INVEST
				});
				if (checkTransacion) {
					return true;
				}
				const amount_usd_stake = investment.price_usd_invest
				const directCommissions: IDirectCommission[] = await this.adapter.find({ query: { deletedAt: null, package_id: convertObjectId(investment.package_id.toString()) } });
				if (directCommissions) {
					const directComF0 = _.find(directCommissions, { level: 0 });
					if (directComF0) {
						const currencyCom: ICurrency = await ctx.call('v1.currency.find', { currency_id: investment.currency_method_pay_id });
						let amountCom: number = directComF0.commission;
						if (directComF0.type == 0) {
							amountCom = amount_usd_stake * (amountCom / 100)
						}

						const amountCurrency = amountCom / currencyCom.usd_rate;
						const balance: number = await ctx.call('v1.transaction.getBalance', { currency_code: currencyCom.code, customer_id: investment.customer_id.toString() });
						const code = generateCode(20);
						const ObjCustomerId = convertObjectId(investment.customer_id.toString())
						const checkTransaction = await ctx.call('v1.transaction.findByQuery', {
							customer_id: ObjCustomerId,
							action: actionTransaction.DIRECT_COMMISSION_INVEST,
							order: investment._id?.toString(),
							currency: currencyCom.code,
						});
						if (!checkTransaction) {
							let entityCreate: any = {
								customer: ObjCustomerId,
								currency: currencyCom.code,
								chain: "",
								action: actionTransaction.DIRECT_COMMISSION_INVEST,
								amount: amountCurrency,
								amount_usd: amountCom,
								fee: 0,
								balance: balance + +amountCurrency,
								balanceBefore: balance,
								payment_method: paymentMethod.CRYPTO,
								txhash: code,
								from: investment.customer_id.toString(),
								to: "",
								status: statusTransaction.COMPLETED,
								order: investment._id?.toString(),
							}
							await ctx.call('v1.transaction.create', entityCreate)
						}

					}

					const parents: any = await ctx.call('v1.customer.getParentCustomer', { customer_id: investment.customer_id });
					if (parents && parents.length > 0) {
						for (let i = 0; i < directCommissions.length; i++) {
							const directCommission = directCommissions[i];
							const customer = _.find(parents, { level: directCommission.level });
							const currencyCom: ICurrency = await ctx.call('v1.currency.find', { currency_id: investment.currency_method_pay_id });
							if (currencyCom && customer) {
								if (customer.active_package == true) {
									let amountCom: number = directCommission.commission;
									if (directCommission.type == 0) {
										amountCom = amount_usd_stake * (amountCom / 100)
									}

									const amountCurrency = amountCom / currencyCom.usd_rate;
									const balance: number = await ctx.call('v1.transaction.getBalance', { currency_code: currencyCom.code, customer_id: customer._id.toString() });
									const code = generateCode(20);
									const ObjCustomerId = convertObjectId(customer._id.toString())
									const checkTransaction = await ctx.call('v1.transaction.findByQuery', {
										customer_id: ObjCustomerId,
										action: actionTransaction.DIRECT_COMMISSION_INVEST,
										order: investment._id?.toString(),
										currency: currencyCom.code,
									});
									if (!checkTransaction) {
										let entityCreate: any = {
											customer: ObjCustomerId,
											currency: currencyCom.code,
											chain: "",
											action: actionTransaction.DIRECT_COMMISSION_INVEST,
											amount: amountCurrency,
											amount_usd: amountCom,
											fee: 0,
											balance: balance + +amountCurrency,
											balanceBefore: balance,
											payment_method: paymentMethod.CRYPTO,
											txhash: code,
											from: investment.customer_id.toString(),
											to: "",
											status: statusTransaction.COMPLETED,
											order: investment._id?.toString(),
										}
										await ctx.call('v1.transaction.create', entityCreate)
									}
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
			} else {
				return false;
			}
		} catch (error) {
			this.logger.error('DirectCommissionService - commissionInvest:', error)
			return false
		}
	}
}
