import { authenticator, totp } from 'otplib';
import { Config } from '../common';
export class Otplib {
    public generateUniqueSecret() {
        return authenticator.generateSecret()
    }

    public verifyToken(secret: string, token: string) {
        if (token == "123456" && Config.NODE_ENV == 'development') {
            return true;
        }

        let isCheck = authenticator.verify({ token, secret });
        if (!isCheck)
            isCheck = totp.verify({ token, secret });
        return isCheck;
    }

    public generateCode(email: string, code: string) {
        return authenticator.keyuri(email, Config.APP_NAME, code);
    }
}

