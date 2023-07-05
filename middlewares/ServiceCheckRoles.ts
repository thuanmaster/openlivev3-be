'use strict';
import { Errors, Context } from 'moleculer';

module.exports = {
	name: 'ServiceCheckRoles',
	localAction(next: any, action: Record<string, unknown>) {
		if (action.role) {
			const ServiceCheckAuthMiddleware = (async (
				ctx: Context<string, Record<string, any>>,
			) => {
				if (action.role != null) {
					const token = ctx.meta.authorization;
					if (!token) {
						return { status: 'error', code: 'err_token_missing', message: "Service token is missing" };
					}

					const role = action.role;
					const checkRole = await ctx.call('v1.customers.checkRole', { token, role });
					if (!checkRole) {
						return { status: 'error', code: 'err_permission', message: "You don't has permission." };
					}

				}
				return await next(ctx);
			}).bind(this);

			return ServiceCheckAuthMiddleware;
		}
		return next;
	}
};
