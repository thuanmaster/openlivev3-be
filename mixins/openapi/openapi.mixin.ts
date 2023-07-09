'use strict';
import { writeFileSync, readFileSync } from 'fs';
import { Errors } from 'moleculer';
import ApiGateway from 'moleculer-web';
import SwaggerUI from 'swagger-ui-dist';
import _ from 'lodash';
import swaggerJSDoc from 'swagger-jsdoc';
import * as pkg from '../../package.json';
import { Config } from '../../common';

const MoleculerServerError = Errors.MoleculerServerError;

export const openAPIMixin = (mixinOptions?: any) => {
	if (Config.NODE_ENV !== 'production') {
		mixinOptions = _.defaultsDeep(mixinOptions, {
			routeOptions: {
				path: '/api/docs',
			},
			schema: null,
		});
	}

	let shouldUpdateSchema = true;
	let schema: any = null;

	return {
		events: {
			'$services.changed'() {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this.invalidateOpenApiSchema();
			},
		},

		methods: {
			/**
			 * Invalidate the generated OpenAPI schema
			 */
			invalidateOpenApiSchema() {
				shouldUpdateSchema = true;
			},

			/**
			 * Generate OpenAPI Schema
			 */
			generateOpenAPISchema(): any {
				try {
					const swaggerDefinition = {
						info: {
							title: `${pkg.name} API Documentation`, // Title of the documentation
							version: pkg.version, // Version of the app
							description:
								// eslint-disable-next-line max-len
								'Moleculer JS Microservice Boilerplate with Typescript, TypeORM, CLI, Service Clients, Swagger, Jest, Docker, Eslint support and everything you will ever need to deploy rock solid projects..', // Short description of the app
						},
						// host: `${Config.SWAGGER_HOST}:${Config.SWAGGER_PORT}`, // The host or url of the app
						host: `${Config.SWAGGER_HOST}`, // The host or url of the app
						basePath: `${Config.SWAGGER_BASEPATH}`, // The basepath of your endpoint
						securityDefinitions: {
							Bearer: {
								type: "apiKey",
								name: "Authorization",
								in: "header",
							}
						}
					};
					// Options for the swagger docs
					const options = {
						// Import swaggerDefinitions
						definition: swaggerDefinition,
						explorer: true,
						enableCORS: false,
						// Path to the API docs
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						apis: JSON.parse(Config.SWAGGER_APIS),
					};
					// Initialize swagger-jsdoc
					const swaggerSpec = swaggerJSDoc(options);

					return swaggerSpec;
				} catch (err) {
					throw new MoleculerServerError(
						'Unable to compile OpenAPI schema',
						500,
						'UNABLE_COMPILE_OPENAPI_SCHEMA',
						{ err },
					);
				}
			},
		},

		async created() {
			const pathToSwaggerUi = SwaggerUI.absolutePath();
			const indexContent = readFileSync(`${pathToSwaggerUi}/index.html`)
				.toString()
				.replace(
					// eslint-disable-next-line max-len
					/(?:(?:https?|undefined):(\/\/|undefined?)|www\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim,
					// `${Config.BASE_URL}:${Config.BASE_PORT}/openapi/swagger.json`,
					`${Config.BASE_URL}/api/docs/swagger.json`,
				)
				.replace('layout: "StandaloneLayout"', '');
			writeFileSync(`${pathToSwaggerUi}/index.html`, indexContent);
			const route = _.defaultsDeep(mixinOptions.routeOptions, {
				use: [ApiGateway.serveStatic(SwaggerUI.absolutePath())],

				aliases: {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					'GET /swagger.json'(req, res) {
						// Send back the generated schema
						if (shouldUpdateSchema || !schema) {
							try {
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								schema = this.generateOpenAPISchema();

								shouldUpdateSchema = false;

								if (Config.NODE_ENV !== 'production') {
									writeFileSync(
										'./swagger.json',
										JSON.stringify(schema, null, 4),
										'utf8',
									);
								}
							} catch (err) {
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								this.logger.warn(err);
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								this.sendError(req, res, err);
							}
						}

						const ctx = req.$ctx;
						ctx.meta.responseType = 'application/json';

						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						return this.sendResponse(req, res, schema);
					},
				},

				mappingPolicy: 'restrict',
			});

			// Add route
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.settings.routes.unshift(route);
		},

		async started() {

		},
	};
};

module.exports = { openAPIMixin };
