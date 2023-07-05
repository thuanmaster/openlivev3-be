'use strict';
import moleculer, { Context } from 'moleculer';
const MailerService = require('moleculer-mail');
const BullMqMixin = require('moleculer-bullmq');
import { Action, Method, Post, Service } from '@ourparentcenter/moleculer-decorators-extended';
import { Config } from '../../common';
import path from 'path';
import {
	actionTransaction,
	ParamDepositComplete,
	ParamSendMailCode,
	ParamSendMailInvestSuccess,
	ParamSendMailMintNftSuccess,
	ParamSendMailWelcome,
	ParamSendTransactionCode,
	ParamSendWithdrawComplete,
	TypeCode,
} from '../../types';
@Service({
	name: 'mail',
	version: 1,
	mixins: [MailerService, BullMqMixin],
	settings: {
		from: `${Config.MAIL_INFO.from_name}<${Config.MAIL_INFO.from}>`,
		templateFolder: path.join(__dirname, 'views/emailTemplates'),
		transport: {
			host: Config.MAIL_INFO.host,
			port: Config.MAIL_INFO.port,
			auth: {
				user: Config.MAIL_INFO.username,
				pass: Config.MAIL_INFO.password,
			},
		},
		bullmq: {
			worker: { concurrency: 50 },
			client: {
				username: Config.REDIS_INFO.username,
				password: Config.REDIS_INFO.password,
				host: Config.REDIS_INFO.host,
				port: Config.REDIS_INFO.port,
				db: Config.REDIS_INFO.db,
				tls: Config.REDIS_INFO.tls,
			},
		},
	},
})
export default class MailService extends moleculer.Service {
	@Action({
		name: 'sendMailKYC',
		cache: false,
	})
	async sendMailKYC(ctx: Context<ParamSendMailCode>) {
		try {
			const params = ctx.params;
			let template: string = 'kycConfirm';
			switch (params.type) {
				case 'CONFIRM':
					template = 'kycConfirm';
					break;
				case 'ACCPETED':
					template = 'kycAccept';
					break;
				case 'REJECTED':
					template = 'kycReject';
					break;
				default:
					break;
			}
			await this.localQueue(
				ctx,
				'queueMail',
				{
					to: params.email,
					subject: params.subject,
					template: template,
					data: {
						fullname: params.fullname,
						subject: params.subject,
					},
				},
				{ priority: 10, delay: 1000 },
			);
		} catch (e) {
			this.logger.error(e);
		}
	}
	@Action({
		name: 'sendMailCode',
		cache: false,
	})
	async sendMailCode(ctx: Context<ParamSendMailCode>) {
		try {
			const params = ctx.params;
			let template: string = 'register';
			switch (params.type) {
				case TypeCode.ACTIVECODE:
					template = 'register';
					break;
				case TypeCode.LOGINCODE:
					template = 'login';
					break;
				case TypeCode.FORGOTPASSWORD:
					template = 'forgot';
					break;
				default:
					break;
			}
			await this.localQueue(
				ctx,
				'queueMail',
				{
					to: params.email,
					subject: params.subject,
					template: template,
					data: {
						fullname: params.fullname,
						subject: params.subject,
						code: params.code,
					},
				},
				{ priority: 10, delay: 1000 },
			);
		} catch (e) {
			this.logger.error(e);
		}
	}

	@Action({
		name: 'sendTransactionCode',
		cache: false,
	})
	async sendTransactionCode(ctx: Context<ParamSendTransactionCode>) {
		try {
			const params: any = ctx.params;
			let template: string = 'transaction';
			switch (params.type) {
				case actionTransaction.WITHDRAW:
					template = 'transaction';
					break;
				default:
					break;
			}
			await this.localQueue(
				ctx,
				'queueMail',
				{
					to: params.email,
					subject: params.subject,
					template: template,
					data: {
						fullname: params.fullname,
						subject: params.subject,
						code: params.code,
						transactionId: params.transactionId,
						currency_title: params.currency,
						chain_title: params.chain_title,
						contract: params.contract,
						amount: params.amount,
						to: params.to,
					},
				},
				{ priority: 10, delay: 1000 },
			);
		} catch (e) {
			this.logger.error(e);
		}
	}

	@Action({
		name: 'sendWithdrawComplete',
		cache: false,
	})
	async sendWithdrawComplete(ctx: Context<ParamSendWithdrawComplete>) {
		try {
			const params: any = ctx.params;
			let template: string = 'withdrawComplete';

			await this.localQueue(
				ctx,
				'queueMail',
				{
					to: params.email,
					subject: params.subject,
					template: template,
					data: params,
				},
				{ priority: 10, delay: 1000 },
			);
		} catch (e) {
			this.logger.error(e);
		}
	}

	@Action({
		name: 'depositComplete',
		cache: false,
	})
	async depositComplete(ctx: Context<ParamDepositComplete>) {
		try {
			const params: any = ctx.params;
			let template: string = 'deposit';

			await this.localQueue(
				ctx,
				'queueMail',
				{
					to: params.email,
					subject: params.subject,
					template: template,
					data: params,
				},
				{ priority: 10, delay: 1000 },
			);
		} catch (e) {
			this.logger.error(e);
		}
	}

	@Action({
		name: 'welcome',
		cache: false,
	})
	async welcome(ctx: Context<ParamSendMailWelcome>) {
		try {
			const params = ctx.params;
			let template: string = 'registerSuccess';
			await this.localQueue(
				ctx,
				'queueMail',
				{
					to: params.email,
					subject: params.subject,
					template: template,
					data: {
						fullname: params.fullname,
						wallet_address: params.wallet_address,
						subject: params.subject,
					},
				},
				{ priority: 10, delay: 2000 },
			);
		} catch (e) {
			this.logger.error(e);
		}
	}

	@Action({
		name: 'investSuccess',
		cache: false,
	})
	async investSuccess(ctx: Context<ParamSendMailInvestSuccess>) {
		try {
			const params = ctx.params;
			let template: string = 'investSuccess';
			await this.localQueue(
				ctx,
				'queueMail',
				{
					to: params.email,
					subject: params.subject,
					template: template,
					data: {
						fullname: params.fullname,
						wallet_address: params.wallet_address,
						package_name: params.package_name,
						package_price_usd: params.package_price_usd,
						subject: params.subject,
					},
				},
				{ priority: 10, delay: 2000 },
			);
		} catch (e) {
			this.logger.error(e);
		}
	}

	@Action({
		name: 'mintNftSuccess',
		cache: false,
	})
	async mintNftSuccess(ctx: Context<ParamSendMailMintNftSuccess>) {
		try {
			const params = ctx.params;
			let template: string = 'mintNftSuccess';
			await this.localQueue(
				ctx,
				'queueMail',
				{
					to: params.email,
					subject: params.subject,
					template: template,
					data: {
						fullname: params.fullname,
						wallet_address: params.wallet_address,
						package_name: params.package_name,
						package_price_usd: params.package_price_usd,
						link_dapp: params.link_dapp,
						nft_id: params.nft_id,
						subject: params.subject,
					},
				},
				{ priority: 10, delay: 2000 },
			);
		} catch (e) {
			this.logger.error(e);
		}
	}

	@Action({
		name: 'reset2Fa',
		cache: false,
	})
	async reset2Fa(ctx: Context) {
		try {
			const params:any = ctx.params;
			let template: string = 'reset2Fa';
			await this.localQueue(
				ctx,
				'queueMail',
				{
					to: params.email,
					subject: params.subject,
					template: template,
					data: {
						fullname: params.fullname,
						subject: params.subject
					},
				},
				{ priority: 10, delay: 2000 },
			);
		} catch (e) {
			this.logger.error(e);
		}
	}

	@Action({
		name: 'queueMail',
		queue: true,
	})
	async queueMail(ctx: Context) {
		try {
			const params: any = ctx.params;
			await ctx.call('v1.mail.send', {
				to: params.to,
				subject: `[${Config.APP_NAME}] ` + params.subject,
				template: params.template,
				data: params.data,
			});
			ctx.locals.job.updateProgress(100);
			return true;
		} catch (e) {
			this.logger.error(e);
			return false;
		}
	}

	@Action({
		name: 'testMail',
		cache: false,
	})
	async testMail(ctx: Context<ParamSendMailWelcome>) {
		try {
			let template: string = 'registerSuccess';
			await this.localQueue(
				ctx,
				'queueMail',
				{
					to: 'linhdev92@gmail.com',
					subject: 'Hao test',
					template: template,
					data: {
						fullname: 'Hao',
						wallet_address: 'wallet address của Hào nè',
						subject: 'Hao',
					},
				},
				{ priority: 10, delay: 2000 },
			);
			
		} catch (e) {
			this.logger.error(e);
		}
	}
}
