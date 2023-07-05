import axios from 'axios';
import { Config } from '../common';
import { BotTelegram } from './BotTelegram';
export class GoogleCaptcha {
    private async request(token: string) {
        return new Promise((resolve, reject) => {
            const serverKey = Config.GOOGLE_CAPTCHA.secretKey;
            const URL = "https://www.google.com/recaptcha/api/siteverify?secret=" + serverKey + "&response=" + token;
            axios({
                method: "GET",
                url: URL,
                headers: { 'Content-Type': 'application/json' }
            })
                .then((res) => {
                    resolve({
                        status: true,
                        data: res,
                    });
                })
                .catch((error) => {
                    resolve({
                        status: false,
                        error: error,
                    });
                });
        });
    }

    public async verifyToken(token: string) {
        try {
            const requestApi: any = await this.request(token);
            if (requestApi.status == false) {
                return false
            } else {
                const data = requestApi.data.data;
                if (data.success == true) {
                    return true
                } else {
                    return false;
                }
            }
        } catch (error) {
            BotTelegram.sendMessageError(`GoogleCaptcha - verifyToken: ${error}`);
            return false;
        }
    }
}

