'use strict';
import path from 'path';
import Hashids from 'hashids'
import fs from 'fs';
import { DbAdapter } from 'moleculer-db';
import bcrypt from 'bcryptjs';
import parseSync from 'csv-parse/lib/sync';
import { JsonConvert } from 'json2typescript';
import { CastingContext, Options } from 'csv-parse';
import { Config } from '../../common';
import { DBInfo } from '../../types';
import { Web3Utils } from '../../libraries';
import { uid, suid } from 'rand-token';
import { Types } from 'mongoose';


const getValue = (value: string, context: CastingContext): unknown => {
	let result: any = value;
	if (context.lines > 1) {
		if (!value) {
			return undefined;
		}
		if (value.toLowerCase() === 'true') {
			result = true;
		} else if (value.toLowerCase() === 'false') {
			result = false;
		} else if (value.includes('|')) {
			result = value.split('|').filter(Boolean);
		} else if (context.column === 'password') {
			result = bcrypt.hashSync(value, 10);
		} else if (Number(value)) {
			result = Number(value);
		} else if (value.startsWith('{') && value.endsWith('}')) {
			result = JSON.parse(value.replace(/'/g, '"'));
		}
	}
	return result;
};

const dbSeed = (dbInfo: DBInfo, collection: String, classReference: new () => any) => async (
	adapter: DbAdapter,
): Promise<void> => {
	const csvFile = path.resolve(
		__dirname,
		'../../database/seeds',
		Config.NODE_ENV,
		`${collection}.csv`,
	);
	if (fs.existsSync(csvFile)) {
		const content = fs.readFileSync(csvFile, 'utf8');
		const cast = (value: string, context: CastingContext) => getValue(value, context);
		const options: Options = {
			delimiter: ',',
			trim: true,
			cast,
			comment: '#',
			auto_parse: true,
			skip_empty_lines: true,
			columns: true,
		};
		for (const row of parseSync(content, options)) {
			const item: any = new JsonConvert().deserializeObject(row, classReference);
			await adapter.insert(item);
		}
	}
};

const generateCode = (limit: number): string => {
	var token = uid(limit, '1234567890');
	return token;

};

const convertObjectId = (id: string): any => {
	if (id.length == 12 || id.length == 24) {
		return Types.ObjectId(id.toString());
	} else {
		return null;
	}

};
const generateCodeAny = (limit: number): string => {
	var token = uid(limit, '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM');
	return token;

};

const encryptPassword = (password: string) => bcrypt.hashSync(password, 10);

const encodeString = (data: string, minLength: number = 30) => {
	const salt = Config.SALT_ENCODE;
	const hashids = new Hashids(salt, minLength);
	let str = convertToHex(data);
	return hashids.encodeHex(str);
};

const decodeString = (strHex: string, minLength: number = 30) => {
	const salt = Config.SALT_ENCODE;
	const hashids = new Hashids(salt, minLength);
	const hex = hashids.decodeHex(strHex);
	return convertFromHex(hex);
}

const convertFromHex = (hex: string) => {
	var hex = hex.toString();
	var str = '';
	for (var i = 0; i < hex.length; i += 2)
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	return str;
}

const toNonAccentVietnamese = (str: string) => {
	str = str.replace(/A|Á|À|Ã|Ạ|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, "A");
	str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
	str = str.replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ệ/, "E");
	str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
	str = str.replace(/I|Í|Ì|Ĩ|Ị/g, "I");
	str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
	str = str.replace(/O|Ó|Ò|Õ|Ọ|Ô|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, "O");
	str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
	str = str.replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, "U");
	str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
	str = str.replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, "Y");
	str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
	str = str.replace(/Đ/g, "D");
	str = str.replace(/đ/g, "d");
	str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
	str = str.replace(/\u02C6|\u0306|\u031B/g, "");
	return str;
}

const convertToHex = (str: string) => {
	var hex = '';
	for (var i = 0; i < str.length; i++) {
		hex += '' + str.charCodeAt(i).toString(16);
	}
	return hex;
}

const convertNonDecimal = (amount: number, decimal: number) => {
	const web3Utils = new Web3Utils()
	const result = web3Utils.fromWei(amount, decimal);
	return +result;
}
const convertDecimal = (amount: number, decimal: number) => {
	const result = amount * 10 ** decimal;
	return result;
}

const checkFieldExist = (field: any) => {
	if (field === null || field === undefined || field === "") {
		return false
	} else {
		return true
	}
}

const delay = (delayInms: number) => {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve(2);
		}, delayInms);
	});
}

export { dbSeed, generateCode, encryptPassword, generateCodeAny, encodeString, decodeString, convertObjectId, delay, toNonAccentVietnamese, convertNonDecimal, convertDecimal, checkFieldExist };
