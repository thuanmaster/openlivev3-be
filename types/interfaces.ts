import { IncomingMessage } from 'http';
import { ActionSchema, ActionParamSchema } from 'moleculer';
import { ActionOptions } from '@ourparentcenter/moleculer-decorators-extended';
import { Schema, SchemaType, SchemaTypeOpts, Types } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/naming-convention
export type definitionType<T> = (
	collection?: string,
) => Record<keyof Required<T>, SchemaTypeOpts<any> | Schema | SchemaType>;

export type ObjectId = Types.ObjectId | string;
export type ObjectIdNull = ObjectId | null;

export type DBDialog = 'local' | 'file' | 'mongodb';

export interface DBInfo {
	dialect: DBDialog;
	user: string;
	password: string;
	host: string;
	port: number;
	dbname: string;
	db_uri: string;
}
export interface InfoMoralis {
	serverUrl: string;
	appId: string;
	masterKey: string;
}
export interface InfoKucoin {
	apiKey: string;
	secretKey: string;
	passphrase: string;
}
export interface InfoHoubi {
	accessKey: string;
	secretKey: string;
	hostname: string;
}

export interface InfoAws {
	bucket: string;
	accessKey: string;
	secretKey: string;
	region: string;
	domain: string;
}
export interface MailInfo {
	from: string;
	host: string;
	port: number;
	password: string;
	username: string;
	from_name: string;
}

export interface RedisInfo {
	host: string;
	port: number;
	password: string;
	username: string;
	prefix: string;
	db: string;
	tls: string;
}
export interface TelegramInfo {
	apiKey: string;
	groupError: string;
	groupDeposit: string;
	groupWithdraw: string;
	groupKYC: string;
	groupNewUser: string;
}

export interface GoogleCaptcha {
	secretKey: string;
}

export interface RouteSchemaOpts {
	path: string;
	whitelist?: string[];
	authorization?: boolean;
	authentication?: boolean;
	aliases?: any;
}

export interface RouteSchema {
	path: string;
	mappingPolicy?: 'restricted' | 'all';
	opts: RouteSchemaOpts;
	middlewares: ((req: any, res: any, next: any) => void)[];
	authorization?: boolean;
	authentication?: boolean;
	logging?: boolean;
	etag?: boolean;
	cors?: any;
	rateLimit?: any;
	whitelist?: string[];
	hasWhitelist: boolean;
	callOptions?: any;
}

export interface RequestMessage extends IncomingMessage {
	$action: ActionSchema;
	$params: ActionParamSchema;
	$route: RouteSchema;
}

export interface RestOptions extends ActionOptions {
	auth?: boolean;
}

export interface ApiGatewayMeta {
	$statusCode?: number;
	$statusMessage?: string;
	$responseType?: string;
	$responseHeaders?: any;
	$location?: string;
}
