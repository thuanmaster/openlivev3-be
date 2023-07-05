import Web3 from 'web3';
import { BotTelegram } from '../libraries';

export class Web3Withdraw {
    private readonly web3: any;
    private readonly contract: any;
    private readonly contractAddress: string;
    private readonly ownerAddress: string;
    private readonly ownerPrivateKey: string;
    constructor(rpc: string, contract: string, abi: any, ownerAddress: string, ownerPrivateKey: string) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpc));
        this.contractAddress = contract;
        this.ownerAddress = ownerAddress;
        this.ownerPrivateKey = ownerPrivateKey;
        this.contract = new this.web3.eth.Contract(abi, contract);
    }

    private async getDecimals() {
        try {
            return await this.contract.methods.decimals().call()
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Withdraw - getDecimals: ${error}`);
            return false;

        }
    }

    private async signTransaction(toAddress: string, amount: number) {
        try {
            const decimals = await this.getDecimals()
            if (decimals) {
                let amountDecimal: any = +amount * +`1e${decimals}`;
                amountDecimal = amountDecimal.toLocaleString('fullwide', { useGrouping: false })
                amountDecimal = BigInt(amountDecimal).toString()
                let gasPrice = await this.web3.eth.getGasPrice()
                const data = this.contract.methods.transfer(toAddress, amountDecimal).encodeABI();
                const gasLimit = await this.estimateGasLimit(this.ownerAddress, this.contractAddress, data);
                const txObj = {
                    gasPrice: this.web3.utils.toHex(gasPrice),
                    gasLimit: this.web3.utils.toHex(gasLimit),
                    to: this.contractAddress,
                    value: '0x00',
                    data: data
                }
                return await this.web3.eth.accounts.signTransaction(txObj, this.ownerPrivateKey);
            } else {
                return false;
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Withdraw - signTransaction: ${error}`);
            return false;
        }
    }

    private async signTransactionNative(toAddress: string, amount: number) {
        try {
            const decimals = await this.getDecimals()
            if (decimals) {
                let amountDecimal: any = +amount * +`1e${decimals}`;
                amountDecimal = amountDecimal.toLocaleString('fullwide', { useGrouping: false })
                amountDecimal = BigInt(amountDecimal).toString()
                let gasPrice = await this.web3.eth.getGasPrice()
                const gasLimit = await this.estimateGasLimitNative(this.ownerAddress, toAddress);
                const txObj = {
                    gasPrice: this.web3.utils.toHex(gasPrice),
                    to: toAddress,
                    value: this.web3.utils.toHex(amountDecimal),
                    gasLimit: this.web3.utils.toHex(gasLimit)
                }
                return await this.web3.eth.accounts.signTransaction(txObj, this.ownerPrivateKey);

            } else {
                return false;
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Withdraw - signTransactionNative: ${error}`);
            return false;
        }
    }

    private async sendSignedTransaction(rawTransaction: any) {
        try {
            return await this.web3.eth.sendSignedTransaction(rawTransaction);
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Withdraw - sendSignedTransaction: ${error}`);
            return false;
        }
    }

    public async sendWithdraw(toAddress: string, amount: number) {
        try {
            if (this.contractAddress == '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' || this.contractAddress == '0x0000000000000000000000000000000000001010'|| this.contractAddress == '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') {
                return await this.sendWithdrawNative(toAddress, amount);
            } else {
                return await this.sendWithdrawToken(toAddress, amount);
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Withdraw - sendWithdraw: ${error}`);
            return false;
        }
    }

    private async sendWithdrawToken(toAddress: string, amount: number) {
        try {
            const signinData = await this.signTransaction(toAddress, amount);
            if (signinData !== false && signinData.rawTransaction) {
                return await this.sendSignedTransaction(signinData.rawTransaction);
            } else {
                return false;
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Withdraw - sendWithdrawToken: ${error}`);
            return false;
        }
    }

    private async sendWithdrawNative(toAddress: string, amount: number) {
        try {
            const signinData = await this.signTransactionNative(toAddress, amount);
            if (signinData !== false && signinData.rawTransaction) {
                return await this.sendSignedTransaction(signinData.rawTransaction);
            } else {
                return false;
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Withdraw - sendWithdrawNative: ${error}`);
            return false;
        }
    }

    private async estimateGasLimit(from: string, to: string, dataEncodeABI: any) {
        try {
            const gasLimit: number = await this.web3.eth.estimateGas({ "from": from, "to": to, "data": dataEncodeABI })
            const gasLimitE: any = +gasLimit + ((+gasLimit * 10) / 100);
            return gasLimitE.toFixed();
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Withdraw - estimateGasLimit: ${error}`);
            return 100000;
        }
    }

    private async estimateGasLimitNative(from: string, to: string) {
        try {
            const gasLimit: number = await this.web3.eth.estimateGas({ "from": from, "to": to })
            const gasLimitE: any = +gasLimit + ((+gasLimit * 10) / 100);
            return gasLimitE.toFixed();
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Withdraw - estimateGasLimitNative: ${error}`);
            return 100000;
        }
    }
}

