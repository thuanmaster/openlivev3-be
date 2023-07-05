import Web3 from 'web3';
import { BotTelegram } from '../libraries';
import { readFileSync } from 'fs';
import path from 'path';
const ABI_PATH = path.resolve(__dirname, '../utils/abi/banker.json');

export class Web3Banker {
    private readonly web3: any;
    private readonly contract: any;
    private readonly contractAddress: string;
    private readonly targetAddress: string;
    private readonly targetPrivateKey: string;
    constructor(rpc: string, contract: string, targetAddress: string, targetPrivateKey: string) {
        const contentAbi = readFileSync(ABI_PATH);
        let abi = contentAbi.toString();
        abi = JSON.parse(abi)

        this.web3 = new Web3(new Web3.providers.HttpProvider(rpc));
        this.contractAddress = contract;
        this.contract = new this.web3.eth.Contract(abi, contract);
        this.targetAddress = targetAddress;
        this.targetPrivateKey = targetPrivateKey;
    }

    async getLastBlockNumber() {
        try {
            return await this.web3.eth.getBlockNumber();
        } catch (error) {
            return false;
        }
    }

    async createWallet(number: number) {
        try {
            const data = await this.contract.methods.createBankers(number);
            const count = await this.web3.eth.getTransactionCount(this.targetAddress);
            const gasLimit = await this.estimateGasLimit(data.encodeABI());
            const gasPrice = await this.web3.eth.getGasPrice();
            if (gasLimit == false) {
                return false;
            }

            const rawTransaction = {
                "from": this.targetAddress,
                "gasPrice": this.web3.utils.toHex(gasPrice),
                "gasLimit": this.web3.utils.toHex(gasLimit),
                "to": this.contractAddress,
                "value": this.web3.utils.toHex(0),
                "data": data.encodeABI(),
                "nonce": this.web3.utils.toHex(count)
            };
            const transaction = await this.web3.eth.accounts.signTransaction(rawTransaction, this.targetPrivateKey);
            return await this.web3.eth.sendSignedTransaction(transaction.rawTransaction);
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Banker - createWallet: ${error}`);
            return false;
        }
    }

    async estimateGasLimit(dataEncodeABI: any) {
        try {
            const gasLimit: number = await this.web3.eth.estimateGas({ "from": this.targetAddress, "to": this.contractAddress, "data": dataEncodeABI })
            const gasLimitE = gasLimit + ((gasLimit * 10) / 100);
            return +gasLimitE.toFixed(0);
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Banker - estimateGasLimit: ${error}`);
            return false;
        }
    }

    async getWalletAddress(fromBlock: number, toBlock: number) {
        try {
            const topic = this.contract.events["CreateBanker"];
            return await this.contract.getPastEvents("CreateBanker", { topic, fromBlock, toBlock });
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Banker - getWalletAddress: ${error}`);
            return false;
        }
    }

    async getDepositBsc(fromBlock: number, toBlock: number) {
        try {
            const topic = this.contract.events["Deposit"];
            return await this.contract.getPastEvents("Deposit", { topic, fromBlock, toBlock });
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Banker - getDepositBsc: ${error}`);
            return false;
        }
    }

    async scanDepositToken(token: string, fromIndex: number, toIndex: number) {
        try {
            const { result } = await this.contract
                .methods
                .scanTokens(token, fromIndex, toIndex)
                .call()
            return result;
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Banker - scanDepositToken: ${error}`);
            return false;
        }
    }

    async collectDepositToken(token: string, address: string) {
        try {
            const data = await this.contract.methods.collect(token, [address]);
            const count = await this.web3.eth.getTransactionCount(this.targetAddress);
            const gasLimit = await this.estimateGasLimit(data.encodeABI());
            const gasPrice = await this.web3.eth.getGasPrice();
            if (gasLimit == false) {
                return false;
            }

            const rawTransaction = {
                "from": this.targetAddress,
                "gasPrice": this.web3.utils.toHex(gasPrice),
                "gasLimit": this.web3.utils.toHex(gasLimit),
                "to": this.contractAddress,
                "value": this.web3.utils.toHex(0),
                "data": data.encodeABI(),
                "nonce": this.web3.utils.toHex(count)
            };
            const transaction = await this.web3.eth.accounts.signTransaction(rawTransaction, this.targetPrivateKey);
            return await this.web3.eth.sendSignedTransaction(transaction.rawTransaction);
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Banker - collectDepositToken: ${error}`);
            return false;
        }
    }
}

