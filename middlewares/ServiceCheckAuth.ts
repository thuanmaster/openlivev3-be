'use strict';
import { Errors, Context } from 'moleculer';
import { CustomerStatus } from '../types';
module.exports = {
	name: 'ServiceCheckAuth',
	localAction(next: any, action: Record<string, unknown>) {
		if (action.middleware) {
			const ServiceCheckAuthMiddleware = (async (
				ctx: Context<string, Record<string, any>>,
			) => {
				if (Array.isArray(action.middleware)) {
					const auth = action.middleware.findIndex(word => word == 'auth');
					if (auth != -1) {
						const token = ctx.meta.authorization;
						if (!token) {
							return { status: 'error', code: 'err_token_missing', message: "Service token is missing" };
						}
						const customer: any = await ctx.call('v1.CustomerToken.resolveToken', { token });
						if (!customer) {
							return { status: 'error', code: 'err_token_invalid', message: "Auth token expired or invalid" };
						}

						if (customer.lock_status == CustomerStatus.DELETED_BY_USER) {
							return { status: 'error', code: 'err_disable_account', message: "The account has been disabled." };
						}

						if (customer.lock_status == CustomerStatus.DELETED_BY_ADMIN) {
							return { status: 'error', code: 'err_banned_account', message: "The account has been banned." };
						}

						const middlewareWithdraw = action.middleware.findIndex(word => word == 'FORBIDDEN_WITHDRAW');
						if (middlewareWithdraw != -1) {
							if (customer.lock_status == CustomerStatus.FORBIDDEN_WITHDRAW) {
								return { status: 'error', code: 'err_banned_withdraw', message: "The account has been banned for withdrawal." };
							}
						}

						const middlewareBannedAll = action.middleware.findIndex(word => word == 'FORBIDDEN_ALL');
						if (middlewareBannedAll != -1) {
							if (customer.lock_status == CustomerStatus.FORBIDDEN_ALL) {
								return { status: 'error', code: 'err_banned_all', message: "The account has been banned all action." };
							}
						}
					}

				}
				return await next(ctx);
			}).bind(this);

			return ServiceCheckAuthMiddleware;
		}
		return next;
	}
};