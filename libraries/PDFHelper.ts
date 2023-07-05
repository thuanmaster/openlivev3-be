import { delay, toNonAccentVietnamese } from '../mixins/dbMixins/helpers.mixin';
import PDFDocument from 'pdfkit';
import { AWSFileUploader } from './AWSFileUploader';
import { BotTelegram } from './BotTelegram';
import moment from 'moment';
const fs = require("fs");
const path = require("path");
const uploadDir = path.join(__dirname, "uploads");
export class PDFHelper {

    public async generateSaftContractPdf(investment: any, customer: any) {
        try {
            const randomName =
                Math.random()
                    .toString(36)
                    .substring(2, 15) +
                Math.random()
                    .toString(36)
                    .substring(2, 15);
            const filename = `${randomName}_${Date.now()}.pdf`;
            const filePath = `${uploadDir}/${filename}`;
            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(filePath));
            let col1LeftPos = 20;
            const dividend_rate = investment.dividend_rate;
            const admin_sign_address = investment.admin_sign_address;
            const admin_sign_signature = investment.admin_sign_signature;
            const admin_sign_date = moment.unix(investment.admin_sign_date).format('YYYY-MM-DD');

            const customer_sign_address = investment.customer_sign_address;
            const customer_sign_signature = investment.customer_sign_signature;
            const customer_sign_date = moment.unix(investment.customer_sign_date).format('YYYY-MM-DD');

            const nft_id = investment.nft_id;
            const bonus_token = +investment.bonus_token / 1e18;
            const price_usd_invest = +investment.price_usd_invest / 1e18;
            const createdAt = moment.unix(investment.createdAt).format('YYYY-MM-DD');
            let colWidth = 200;
            let colWidth2 = 300;
            let col2LeftPos = colWidth + col1LeftPos + 20;
            doc.fontSize(14).text('INFORMATION', col1LeftPos, 20, { width: colWidth })
                .text('OPENLIVE INVESTMENT AND DEVELOPMENT JOINT STOCK COMPANY WITH STRATEGIC PARTNERSHIP', col2LeftPos, 20, { width: colWidth2 })
            doc.fontSize(12).text('Invest in Platform', col1LeftPos, 80, { width: colWidth })
                .text('OPENLIVE NFT MARKETPLACE', col2LeftPos, 80, { width: colWidth2 })
            doc.text('- Token contract address', col2LeftPos, 100, { width: colWidth2 })
            doc.text('    0x36C7B164F85D6F775cD128966D5819c7d36FEfF3', col2LeftPos, 105, { width: colWidth2 })
            doc.text('- Token symbol: OPV', col2LeftPos, 135, { width: colWidth2 })
            doc.text('- Total supply: 200,000,000', col2LeftPos, 150, { width: colWidth2 })
            doc.text('Join Date', col1LeftPos, 175, { width: colWidth }).text(createdAt, col2LeftPos, 175, { width: colWidth2 })
            doc.text('Investment amount (USDT)', col1LeftPos, 200, { width: colWidth }).text(price_usd_invest.toString(), col2LeftPos, 200, { width: colWidth2 })
            doc.text('Total bonus OPV token invest will receive', col1LeftPos, 225, { width: colWidth }).text(bonus_token.toString(), col2LeftPos, 225, { width: colWidth2 })
            doc.text('Exclusive OpenLive NFT card will receive', col1LeftPos, 265, { width: colWidth }).text(nft_id, col2LeftPos, 265, { width: colWidth2 })
            doc.text('Exclusive OpenLive NFT card will receive', col1LeftPos, 305, { width: colWidth }).text(dividend_rate + '% of  Openlive NFT Marketplace profit.', col2LeftPos, 305, { width: colWidth2 })
            doc.text('Lockup Schedule', col1LeftPos, 335, { width: colWidth })
                .text('- OPV Token vesting plan is as follows: 0 month cliff; 8% unlock; 3% vesting per month.', col2LeftPos, 335, { width: colWidth2 })
            doc.text('- Exclusive OpenLive NFT card is started from 15/01/2024. Profit of  Exclusive OpenLive NFT card is divided cyclically every year.', col2LeftPos, 370, { width: colWidth2 })
            doc.text('- Get Reward rate from Holding wallet after 3 YEARS of vesting every month 3%.', col2LeftPos, 415, { width: colWidth2 })
            doc.text('Investment ID', col1LeftPos, 455, { width: colWidth }).text(investment._id, col2LeftPos, 455, { width: colWidth2 })
            doc.text('OPENLIVE INVESTMENT & DEVELOPMENT JOINT STOCK COMPANY “OPENLIVE JSC”', col1LeftPos, 475, { width: colWidth }).text('Company number: 0317141176', col2LeftPos, 475, { width: colWidth2 })
            doc.text('Name: Tran Trong Huan', col2LeftPos, 490, { width: colWidth2 })
            doc.text('Title: CEO', col2LeftPos, 505, { width: colWidth2 })
            doc.text('Registered office address: 1st Floor, Packsimex Building, 52 Dong Du, Ben Nghe Ward, District 1, Ho Chi Minh City, Vietnam', col2LeftPos, 520, { width: colWidth2 })
            doc.text('Email: contact@openlivenft.com', col2LeftPos, 560, { width: colWidth2 })
            doc.text('OPV’s BEP20 Wallet address', col1LeftPos, 580, { width: colWidth }).text(admin_sign_address, col2LeftPos, 580, { width: colWidth2 })
            doc.text('OPV’s Signature', col1LeftPos, 600, { width: colWidth }).text('Signed date: ' + admin_sign_date, col2LeftPos, 600, { width: colWidth2 })
            doc.text('Signed address: ' + admin_sign_address, col2LeftPos, 620, { width: colWidth2 })
            doc.text('Signature: ' + admin_sign_signature, col2LeftPos, 655, { width: colWidth2 })
            doc.addPage()
            doc.text('STRATEGIC PARTNERSHIP', col1LeftPos, 20, { width: colWidth }).text('Name: ' + toNonAccentVietnamese(customer.profile.fistname) + " " + toNonAccentVietnamese(customer.profile.lastname), col2LeftPos, 20, { width: colWidth2 })
            doc.text('Address: ' + toNonAccentVietnamese(customer.profile.address), col2LeftPos, 40, { width: colWidth2 })
            doc.text('Email: ' + customer.email, col2LeftPos, 80, { width: colWidth2 })
            doc.text('Phone: ' + customer.profile.phone_number, col2LeftPos, 100, { width: colWidth2 })
            doc.text('Purchaser’s Receiving BEP20 Wallet address', col1LeftPos, 125, { width: colWidth }).text(customer.wallet_address, col2LeftPos, 125, { width: colWidth2 })
            doc.text('STRATEGIC PARTNERSHIP’s Signature', col1LeftPos, 165, { width: colWidth }).text('Signed date: ' + customer_sign_date, col2LeftPos, 165, { width: colWidth2 })
            doc.text('Signed address: ' + customer_sign_address, col2LeftPos, 180, { width: colWidth2 })
            doc.text('Signature: ' + customer_sign_signature, col2LeftPos, 225, { width: colWidth2 })
            doc.text('GENERAL AGREEMENT', col1LeftPos, 290, { width: colWidth }).text('The two parties agree on a voluntary, non-coercive and self-responsibility', col2LeftPos, 290, { width: colWidth2 })
            doc.end();
            await delay(4000);
            const s3 = new AWSFileUploader();
            const upload: any = await s3.upload({
                folder: "SAFT_contracts",
                name: investment._id.toString(),
                type: "application/pdf",
                extension: "pdf",
                content: filePath
            })
            fs.unlinkSync(filePath);
            if (upload != undefined) {
                return upload;
            } else {
                return null;
            }
        } catch (error) {
            BotTelegram.sendMessageError(`PDFHelper - generatePdf - ${error}`);
            return null;
        }
    }
}

