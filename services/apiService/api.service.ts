import { IncomingMessage, ServerResponse } from 'http';
import moleculer, { Context, Errors } from 'moleculer';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import ApiGateway from 'moleculer-web';
import { Service, Method } from '@ourparentcenter/moleculer-decorators-extended';
import { openAPIMixin } from '../../mixins/openapi/openapi.mixin';
import { Config } from '../../common';
import { CustomStore } from '../../mixins/dbMixins/CustomStore';

@Service({
	name: 'api',
	mixins: [ApiGateway, openAPIMixin()],
	settings: {
		port: Config.PORT || 3000,
		rateLimit: {
			window: 2 * 1000,
			limit: 5,
			headers: true,
			key: (req: any) => {
				const ip =
					req.headers['cf-connecting-ip'] ||
					req.headers['x-forwarded-for'] ||
					req.connection.remoteAddress ||
					req.socket.remoteAddress;
				return ip + req.url;
			},
			StoreFactory: CustomStore,
		},
		use: [
			cookieParser(),
			helmet({
				contentSecurityPolicy: {
					directives: {
						'default-src': ["'self'"],
						'base-uri': ["'self'"],
						// 'block-all-mixed-content',
						'font-src': ["'self'"],
						'frame-ancestors': ["'self'"],
						'img-src': ["'self'"],
						'object-src': ["'none'"],
						'script-src': ["'self'", "'unsafe-inline'"],
						'script-src-attr': ["'none'"],
						'style-src': ["'self'", "'unsafe-inline'"],
						'upgrade-insecure-requests': [],
					},
				},
			}),
		],
		routes: [
			{
				path: '/api',
				cors: {
					origin: ['*'],
					methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
					credentials: false,
					maxAge: 3600,
				},
				whitelist: ['**'],
				use: [],
				mergeParams: true,
				authentication: false,
				authorization: false,
				autoAliases: true,
				aliases: {},
				onBeforeCall(
					ctx: Context<any, { authorization: string | undefined; clientIp: any | undefined, reCaptcha: any | undefined }>,
					route: object,
					req: any,
					res: ServerResponse,
				) {
					const auth = req.headers.authorization;
					const captcha = req.headers.recaptcha;
					ctx.meta.authorization = auth;
					ctx.meta.reCaptcha = captcha;
					ctx.meta.clientIp =
						req.headers['cf-connecting-ip'] ||
						req.headers['x-forwarded-for'] ||
						req.connection.remoteAddress ||
						req.socket.remoteAddress;
				},
				onAfterCall(
					ctx: Context,
					route: object,
					req: IncomingMessage,
					res: ServerResponse,
					data: object,
				) {
					return data;
				},
				callingOptions: {},
				bodyParsers: {
					json: {
						strict: false,
						limit: '1MB',
					},
					urlencoded: {
						extended: true,
						limit: '1MB',
					},
				},
				mappingPolicy: Config.MAPPING_POLICY, // Available values: "all", "restrict"
				logging: true,
			},
			{
				path: '/api/v1/file/upload',
				bodyParsers: {
					json: false,
					urlencoded: false,
				},
				cors: {
					origin: ['*'],
					methods: ['POST', 'PUT'],
					credentials: false,
					maxAge: 3600,
				},
				mappingPolicy: 'restrict',
				aliases: {
					'POST /': 'multipart:v1.files.uploadFile',
				},
				busboyConfig: {
					limits: {
						files: 1,
					},
				},
			},
			{
				path: '/meta',
				bodyParsers: {
					json: false,
					urlencoded: false,
				},
				cors: {
					origin: ['*'],
					methods: ['GET'],
					credentials: false,
					maxAge: 3600,
				},
				mappingPolicy: 'restrict',
				aliases: {
					'GET /:contract/:nft_id': 'v1.investment.metaDataNft',
				},
			},
		],
		log4XXResponses: false,
		logRequestParams: 'info',
		logResponseData: null,
		assets: {
			folder: 'public',
			options: {},
		},
	},
})
export default class ApiService extends moleculer.Service { }
