'use strict';
import { Errors, Context } from 'moleculer';
const MoleculerClientError = Errors.MoleculerClientError;
module.exports = {
	name: 'ServiceCheckAuthAdmin',
	localAction(next: any, action: Record<string, unknown>) {
		if (action.middleware) {
			const ServiceCheckAuthAdminMiddleware = (async (
				ctx: Context<string, Record<string, any>>,
			) => {
				if (Array.isArray(action.middleware)) {
					const auth = action.middleware.findIndex(word => word == 'authAdmin');
					if(auth != -1) {
						const token = ctx.meta.authorization;
						if (!token) {
							return { status: 'error', code: 'err_token_missing', message: "Service token is missing" };
						}
						const user = await ctx.call('v1.UserToken.resolveToken',{ token });
						if(!user) {
							return { status: 'error', code: 'err_token_invalid', message: "Auth token expired or invalid" };
						}
					}
					
				}
				return await next(ctx);
			}).bind(this);

			return ServiceCheckAuthAdminMiddleware;
		}
		return next;
	}
};
