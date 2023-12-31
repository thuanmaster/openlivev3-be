/* eslint-disable @typescript-eslint/naming-convention */
import fs from 'fs';
import path from 'path';
import DbService, { DbAdapter } from 'moleculer-db';
import { Context, ServiceSchema } from 'moleculer';
import { Model } from 'mongoose';
import { Config } from '../../common';
import { DBInfo } from '../../types';

export interface BaseMixinConfig {
	name: string;
	model: Model<any>;
	collection: string;
	dbInfo: DBInfo;
}

export class DbBaseMixin {
	public cacheCleanEventName: string;
	private readonly mixName: string;
	private readonly collection: string;
	private readonly mixModel: Model<any>;
	private readonly dbInfo: DBInfo;

	// eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
	constructor(info: BaseMixinConfig) {
		this.mixName = info.name;
		this.mixModel = info.model;
		this.collection = info.collection;
		this.dbInfo = info.dbInfo;
		this.cacheCleanEventName = `cache.clean.${this.dbInfo.dbname}.${info.collection}`;
	}

	public getMixin(seedDBFunction?: (adapter: DbAdapter) => Promise<void>): ServiceSchema {
		const schema: ServiceSchema = this.getMixinBase(seedDBFunction);

		switch (this.dbInfo.dialect) {
			case 'local':
				return this.getLocalAdapter(schema);
			case 'file':
				return this.getLocalAdapter(schema, true);
			case 'mongodb':
				return this.getMongoAdapter(schema);
			// Case 'mysql':
			// Case 'postgres':
			// Case 'mariadb':
			//   Return this.getSequelizeAdapter(schema);
			default: {
				if (Config.IS_TEST) {
					return this.getLocalAdapter(schema);
				}
				throw new Error(`Unknown adapter in DB_TYPE: ${this.dbInfo.dialect}`);
			}
		}
	}

	public getEvents(eventNames: string[]) {
		const events: { [key: string]: ServiceSchema } = {};
		eventNames.forEach((name) => {
			events[name] = function () {
				if (this.broker.cacher) {
					this.logger.debug(`Clear local '${this.name}' cache`);
					this.broker.cacher.clean(`${this.name}.**`);
				}
			};
		});
		return { events };
	}

	private getMixinBase(seedDBFunction?: (adapter: DbAdapter) => Promise<void>): ServiceSchema {
		return {
			name: this.mixName,
			mixins: [DbService],

			events: {
				/**
				 * Subscribe to the cache clean event. If it's triggered
				 * clean the cache entries for this service.
				 *
				 * @param {Context} ctx
				 */
				async [this.cacheCleanEventName]() {
					const broker: any = this.broker;
					if (broker.cacher) {
						await broker.cacher.clean(`${this.fullName}.*`);
					}
				},
			},

			methods: {
				/**
				 * Send a cache clearing event when an entity changed.
				 *
				 * @param {String} type
				 * @param {any} json
				 * @param {Context} ctx
				 */
				async entityChanged(type: string, json: any, ctx: Context) {
					// eslint-disable-next-line arrow-parens
					const events = Object.keys({ ...this.schema.events }).filter((event) =>
						event.startsWith('cache.clean.'),
					);
					for (const event of events) {
						await ctx.broadcast(event);
					}
				},
			},

			async started() {
				// Check the count of items in the DB. If it's empty,
				// Call the `seedDB` method of the service.
				if (seedDBFunction) {
					const count = await this.adapter.count();
					if (!count) {
						this.logger.info(
							`The collection for '${this.name}' is empty. Seeding the collection...`,
						);
						await seedDBFunction(this.adapter);
						this.logger.info(
							'Seeding is done. Number of records:',
							await this.adapter.count(),
						);
					}
				}
			},
		};
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	private getDBUri() {
		return `${this.dbInfo.db_uri}`;
	}


	// eslint-disable-next-line @typescript-eslint/naming-convention
	private getLocalAdapter(schema: ServiceSchema, useFile = false) {
		if (useFile) {
			const LOCAL_DB_PATH = path.resolve(__dirname, '../../data');
			if (!fs.existsSync(LOCAL_DB_PATH)) {
				
			}
		}
		const file = useFile
			? { filename: `./data/${this.dbInfo.dbname}_${this.collection}.db` }
			: undefined;
		return {
			...schema,
			adapter: new (DbService as any).MemoryAdapter(file),
		};
	}

	private getMongoAdapter(schema: ServiceSchema) {
		const MongoAdapter = require("moleculer-db-adapter-mongo");
		
		return {
			...schema,
			adapter: new MongoAdapter(this.getDBUri(), {
				useUnifiedTopology: true,
				authSource: 'admin'
			}),
			collection: this.collection,
			model: this.mixModel,
		};
	}
}
