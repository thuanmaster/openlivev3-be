'use strict';
import { checkFieldExist } from '../mixins/dbMixins/helpers.mixin';
import { Errors, Context } from 'moleculer';
import { GoogleCaptcha } from '../libraries';
import { Config } from '../common';
module.exports = {
	name: 'ServiceCheckCaptcha',
	localAction(next: any, action: Record<string, unknown>) {
		if (action.middleware) {
			const ServiceCheckCaptchaMiddleware = (async (
				ctx: Context<string, Record<string, any>>,
			) => {
				if (Array.isArray(action.middleware)) {
					const captcha = action.middleware.findIndex(word => word == 'captcha');
					if (captcha != -1 && Config.NODE_ENV == 'production') {
						const reCaptcha = ctx.meta.reCaptcha;
						if (checkFieldExist(reCaptcha)) {
							const googleCaptcha = new GoogleCaptcha()
							const check = await googleCaptcha.verifyToken(reCaptcha);
							if (check == false) {
								return { status: 'error', code: 'err_captcha_invalid', message: "Request require captcha" };
							}

						} else {
							return { status: 'error', code: 'err_captcha_invalid', message: "Request require captcha" };
						}
					}
				}
				return await next(ctx);
			}).bind(this);

			return ServiceCheckCaptchaMiddleware;
		}
		return next;
	}
};
