"use strict";
import moment from "moment";
import axios from 'axios';
import crypto from 'crypto';
import { Config } from '../common';

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json;charset=utf-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
};


export class HuobiApi {

    private accessKey: string;
    private secretKey: string;
    private hostname: string;
    private protocol: string;
    private proxy: boolean;
    private httpsConfig: object;
    constructor(accessKey: string, secretKey: string) {
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.hostname = "api.huobi.pro";
        this.protocol = 'https';
        this.proxy = false;

        this.httpsConfig = {
            timeout: 3000,
            headers: DEFAULT_HEADERS
        };
    }

    private host() {
        return `${this.protocol}://${this.hostname}`;
    }

    private async get(path: string, params: any) {
        return await this.request('GET', path, params);
    }

    private async post(path: string, params: any) {
        return this.request('POST', path, params);
    }

    private async request(method: string, path: string, params: any) {
        if (method !== 'GET' && method !== 'POST') {
            throw 'method only be GET or POST';
        }

        path = this.foramtPath(path);

        const { paramsStr, originalParams } = this.signParams(path, method, params);

        if (method === 'GET') {
            return await this.fetch(`${path}?${paramsStr}`, {
                method
            });
        }

        return await this.fetch(`${path}?${paramsStr}`, {
            method,
            data: originalParams
        });
    }

    signParams(path: string, method: string, params: any) {
        if (!path.startsWith('/')) {
            throw 'path must starts with \/';
        }

        const needSignature = !path.startsWith('/market');
        let originalParams;
        if (needSignature) {
            originalParams = {
                AccessKeyId: this.accessKey,
                SignatureMethod: 'HmacSHA256',
                SignatureVersion: '2',
                Timestamp: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
                ...params
            };
        } else {
            originalParams = { ...params };
        }
        const paramsArr = [];
        for (const item in originalParams) {
            paramsArr.push(`${item}=${encodeURIComponent(originalParams[item])}`);
        }
        const pStr = paramsArr.sort().join('&');

        if (!needSignature) {
            return {
                originalParams,
                signature: '',
                paramsStr: pStr
            };
        }

        const meta = [method, this.hostname, path, pStr].join('\n');
        const hash = crypto
            .createHmac(`sha256`, this.secretKey)
            .update(meta)
            .digest(`base64`);
        const signature = encodeURIComponent(hash);
        return {
            signature,
            originalParams,
            paramsStr: `${pStr}&Signature=${signature}`
        };
    }

    foramtPath(path: string) {
        path = path.trim();
        if (!path.startsWith('/')) {
            path = `/${path}`;
        }
        if (path.endsWith('/')) {
            path = path.substring(0, path.length - 1);
        }
        return path;
    }

    async fetch(path: string, options: any) {
        const url = `${this.host()}${path}`;
        return await axios({
            url,
            ...options,
            ...this.httpsConfig,
            proxy: this.proxy
        }).then((res) => {
            if (res.status !== 200) {
                throw res;
            }
            return res.data;
        }).then((data) => {
            return data;
        }).catch((error) => {
            return error;
        });
    }

    async getAccounts() {
        const res = await this.get('/v1/account/accounts', null);
        return res;
    }
    async getWithdrawQuota(currency: string) {
        const res = await this.get('/v2/account/withdraw/quota', { currency });
        return res;
    }

    public async getCurrencys() {
        const res = await this.get('/v1/common/currencys', null);
        return res;
    }

    public async getTransactionHistory(currency: string, type: string) {
        const res = await this.get('/v1/query/deposit-withdraw', { currency, type });
        return res;
    }

    public async createWithdraw(currency: string, address: string, amount: any, fee: any) {
        try {
            return await this.post('/v1/dw/withdraw/api/create', { currency, address, amount, fee });
        } catch (e) {

        }
    }

    public async SubUserCreation(userList: any) {
        try {
            return await this.post('/v2/sub-user/creation', { userList });
        } catch (e) {
            return false
        }
    }

    public async QueryDepositAddressOfSubUser(subUid: any, currency: any) {
        try {
            return await this.get('/v2/sub-user/deposit-address', { subUid, currency });
        } catch (e) {
            return false
        }
    }

    public async QueryDepositHistory(subUid: any) {
        try {
            return await this.get('/v2/sub-user/query-deposit', { subUid });
        } catch (e) {
            return false
        }
    }
}
