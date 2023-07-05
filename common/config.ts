/* eslint-disable capitalized-comments */
import os from 'os';
import dotenvFlow from 'dotenv-flow';
import _ from 'lodash';
import { DBDialog, DBInfo, InfoAws, InfoKucoin, InfoHoubi, MailInfo, RedisInfo, TelegramInfo, GoogleCaptcha } from '../types';

const processEnv = process.env;

const envVariables = Object.keys(
	dotenvFlow.parse(['./env/.env']),
);
const configObj = _.pick(processEnv, envVariables);


const isTrue = (text?: string | number) => [1, true, '1', 'true', 'yes'].includes(text || '');

const isFalse = (text?: string | number) => [0, false, '0', 'false', 'no'].includes(text || '');

const getValue = (text?: string, defaultValud?: string | boolean) => {
	const vtrue = isTrue(text);

	const vfalse = isFalse(text);
	const val = text || defaultValud;
	if (vtrue) {
		return true;
	} else if (vfalse) {
		return false;
	}
	return val;
};

const HOST_NAME = os.hostname().toLowerCase();

const getDbInfo = (what: string, defaultValue: string) => {
	const generic = process.env[`DB_GENERIC_${what}`];
	return generic || defaultValue;
};
const getInfoEnv = (what: string, defaultValue: string) => {
	const generic = process.env[`${what}`];
	return generic || defaultValue;
};

const genericDbInfo = (): DBInfo => ({
	dialect: getDbInfo('DIALECT', 'local') as DBDialog,
	user: getDbInfo('USER', ''),
	password: getDbInfo('PASSWORD', ''),
	host: getDbInfo('HOST', ''),
	port: +getDbInfo('PORT', '0'),
	dbname: getDbInfo('DBNAME', ''),
	db_uri: getDbInfo('MONGO_URI', '')
});

const genericMailInfo = (): MailInfo => ({
	from: getInfoEnv('MAIL_FROM_ADDRESS', ''),
	from_name: getInfoEnv('MAIL_FROM_NAME', ''),
	username: getInfoEnv('MAIL_USERNAME', ''),
	password: getInfoEnv('MAIL_PASSWORD', ''),
	host: getInfoEnv('MAIL_HOST', ''),
	port: +getInfoEnv('MAIL_PORT', '0'),

});

const genericAwsInfo = (): InfoAws => ({
	bucket: getInfoEnv('S3_BUCKET', ''),
	accessKey: getInfoEnv('S3_KEY', ''),
	secretKey: getInfoEnv('S3_SECRET', ''),
	region: getInfoEnv('S3_REGION', ''),
	domain: getInfoEnv('S3_DOMAIN', '')

});
const GoogleCaptchaInfo = (): GoogleCaptcha => ({
	secretKey: getInfoEnv('GOOGLE_CAPTCHA_SECRET_KEY', '')
});

const genericRedisInfo = (): RedisInfo => ({
	username: getInfoEnv('REDIS_USERNAME', ''),
	password: getInfoEnv('REDIS_PASSWORD', ''),
	host: getInfoEnv('REDIS_HOST', ''),
	prefix: getInfoEnv('REDIS_PREFIX', ''),
	port: +getInfoEnv('REDIS_PORT', '0'),
	db: getInfoEnv('REDIS_DB', '0'),
	tls: getInfoEnv('REDIS_TLS', ''),
});

const genericTelegramInfo = (): TelegramInfo => ({
	apiKey: getInfoEnv('TELEGRAM_API_KEY', ''),
	groupError: getInfoEnv('TELEGRAM_GROUP_ERROR', ''),
	groupDeposit: getInfoEnv('TELEGRAM_GROUP_DEPOSIT', ''),
	groupWithdraw: getInfoEnv('TELEGRAM_GROUP_WITHDRAW', ''),
	groupKYC: getInfoEnv('TELEGRAM_GROUP_KYC', ''),
	groupNewUser: getInfoEnv('TELEGRAM_GROUP_NEW_USER', ''),
});

export default class ConfigClass {
	[index: string]: any;
	public static NODE_ENV: string;
	public static APP_NAME: string;
	public static NODEID: string;
	public static DB_INFO: any;
	public static AWS_INFO: InfoAws;
	public static MAIL_INFO: any;
	public static REDIS_INFO: any;
	public static HOUBI_INFO: InfoHoubi;
	public static TELEGRAM_INFO: TelegramInfo;
	public static GOOGLE_CAPTCHA: GoogleCaptcha;
	public static SALT_ENCODE: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXJ2aWNlIjoiYXBpIiwiaWF0IjoxNTkzNzk3Njg1fQ.kYcRucvCw_2TPRVsdh-OP7_RCkRsgudVFofmX2JA6Us";

	public constructor() {
		Object.keys(configObj).forEach((key: string) => {
			// @ts-ignore
			this[key] = configObj[key];
		});

		this.NODE_ENV = process.env.NODE_ENV;
		this.APP_NAME = process.env.APP_NAME;
		this.NODEID = `${process.env.NODEID ? process.env.NODEID + '-' : ''}${HOST_NAME}-${this.NODE_ENV}`;
		this.DB_INFO = genericDbInfo();
		this.MAIL_INFO = genericMailInfo();
		this.REDIS_INFO = genericRedisInfo();
		this.TELEGRAM_INFO = genericTelegramInfo();
		this.AWS_INFO = genericAwsInfo();
		this.GOOGLE_CAPTCHA = GoogleCaptchaInfo();
	}
}
