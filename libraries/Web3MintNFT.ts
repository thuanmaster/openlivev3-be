import Web3 from 'web3';
import { BotTelegram } from '.';

export class Web3MintNFT {
    private readonly web3: any;
    private readonly contract: any;
    private readonly contractAddress: any;
    private readonly ownerPrivateKey: string;
    private readonly ownerAddress: string;

    constructor(rpc: string, contractAddress: string, abi: any, targetPrivateKey: any, targetAddress: string) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpc));
        this.ownerPrivateKey = targetPrivateKey;
        this.ownerAddress = targetAddress;
        this.contractAddress = contractAddress;
        this.contract = new this.web3.eth.Contract(abi, contractAddress);
    }

    public async getNextNFTId() {
        try {
            return await this.contract.methods.getNextNFTId().call();
        } catch (error) {
            BotTelegram.sendMessageError(`Web3MintNFT - getNextNFTId - ${error}`);
            return false;
        }
    }

    public async mintNFTBatch(owner: string, quantity: number, rare: number) {
        try {
            const data = await this.contract.methods.mintNFTBatch(quantity, rare, owner);
            const gasLimit = await this.estimateGasLimit(this.ownerAddress, this.contractAddress, data.encodeABI())
            if (gasLimit != false) {
                const gasPrice = await this.web3.eth.getGasPrice();
                const count = await this.web3.eth.getTransactionCount(this.ownerAddress);
                const rawTransaction = {
                    "from": this.ownerAddress,
                    "gasPrice": this.web3.utils.toHex(gasPrice),
                    "gasLimit": this.web3.utils.toHex(gasLimit),
                    "to": this.contractAddress,
                    "value": this.web3.utils.toHex(0),
                    "data": data.encodeABI(),
                    "nonce": this.web3.utils.toHex(count)
                };
                const transaction = await this.web3.eth.accounts.signTransaction(rawTransaction, this.ownerPrivateKey);
                return await this.web3.eth.sendSignedTransaction(transaction.rawTransaction);
            }else {
                return false
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3MintNFT - mintNFTBatch - ${error}`);
            return false;
        }
    }

    private async estimateGasLimit(from: string, to: string, dataEncodeABI: any) {
        try {
            const gasLimit: number = await this.web3.eth.estimateGas({ "from": from, "to": to, "data": dataEncodeABI })
            const gasLimitE = gasLimit + ((gasLimit * 10) / 100);
            return gasLimitE.toFixed(0);
        } catch (error) {
            BotTelegram.sendMessageError(`Web3MintNFT - estimateGasLimit - ${error}`);
            return false;
        }
    }
}

