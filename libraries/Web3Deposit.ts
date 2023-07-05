import Web3 from 'web3';
import { BotTelegram } from '../libraries';
export class Web3Deposit {
    private readonly web3: any;
    private readonly contract: any;
    private readonly contractAddress: string;
    private readonly rpc: string;
    constructor(rpc: string, contract: string, abi: any) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpc));
        this.contractAddress = contract;
        this.rpc = rpc;
        this.contract = new this.web3.eth.Contract(abi, contract);
    }

    public async getDecimals() {
        try {
            return await this.contract.methods.decimals().call()
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - getDecimals - ${this.rpc}: ${error}`);
            return 18;
        }
    }

    public async getBalanceOf(address: string) {
        try {
            return await this.contract.methods.balanceOf(address).call()
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - getBalanceOf - ${this.rpc}: ${error}`);
            return false;
        }
    }

    public async getBalance(address: string) {
        try {
            return await this.web3.eth.getBalance(address)
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - getBalance - ${this.rpc}: ${error}`);
            return false;
        }
    }

    public async getBlockNumber() {
        try {
            return this.web3.eth.getBlockNumber();
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - getBlockNumber - ${this.rpc}: ${error}`);
            return false;
        }
    }

    public async getEventLogContract(event: string, fromBlock: number, toBlock: number) {
        try {
            const topic = this.contract.events[event];
            return await this.contract.getPastEvents(event, { topic, fromBlock, toBlock });
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - getEventLogContract - ${this.rpc}: ${error}`);
            return false;
        }
    }

    public async sendAmountFeeChain(toAddress: string, amount: number, privateKey: string) {
        try {
            const signinData = await this.web3.eth.accounts.signTransaction({
                to: toAddress,
                value: this.web3.utils.toHex(this.web3.utils.toWei((amount || '').toString(), 'ether')),
                gas: 2000000
            }, privateKey)
            if (signinData !== false && signinData.rawTransaction) {
                return await this.web3.eth.sendSignedTransaction(signinData.rawTransaction);
            } else {
                return false;
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - sendAmountFeeChain - ${this.rpc}: ${error}`);
            return false;
        }
    }

    private async sendSignedTransaction(rawTransaction: any) {
        try {
            return await this.web3.eth.sendSignedTransaction(rawTransaction);
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - sendSignedTransaction: ${error}`);
            return false;
        }
    }

    private async estimateGasLimitNative(from: string, to: string) {
        try {
            const gasLimit: number = await this.web3.eth.estimateGas({ "from": from, "to": to })
            const gasLimitE: any = +gasLimit + ((+gasLimit * 10) / 100);
            return gasLimitE.toFixed();
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - estimateGasLimitNative: ${error}`);
            return 100000;
        }
    }

    private async signTransactionNative(privateKey: string, fromAddress: string, toAddress: string, amount: number) {
        try {
            let amountDecimal = amount.toLocaleString('fullwide', { useGrouping: false })
            amountDecimal = BigInt(amountDecimal).toString()
            let gasPrice = await this.web3.eth.getGasPrice()
            const gasLimit = await this.estimateGasLimitNative(fromAddress, toAddress);
            const txObj = {
                gasPrice: this.web3.utils.toHex(gasPrice),
                to: toAddress,
                value: this.web3.utils.toHex(amountDecimal),
                gasLimit: this.web3.utils.toHex(gasLimit)
            }
            return await this.web3.eth.accounts.signTransaction(txObj, privateKey);

        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - signTransactionNative: ${error}`);
            return false;
        }
    }

    private async signTransaction(privateKey: string, fromAddress: string, toAddress: string, amount: number) {
        try {
            let amountDecimal = amount.toLocaleString('fullwide', { useGrouping: false })
            amountDecimal = BigInt(amountDecimal).toString()
            let gasPrice = await this.web3.eth.getGasPrice()
            const data = this.contract.methods.transfer(toAddress, amountDecimal).encodeABI();
            const gasLimit = await this.estimateGasLimit(fromAddress, this.contractAddress, data);
            const txObj = {
                gasPrice: this.web3.utils.toHex(gasPrice),
                gasLimit: this.web3.utils.toHex(gasLimit),
                to: this.contractAddress,
                value: '0x00',
                data: data
            }
            return await this.web3.eth.accounts.signTransaction(txObj, privateKey);
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - sendSignedTransaction: ${error}`);
            return false;
        }
    }

    private async crawlDepositToken(privateKey: string, fromAddress: string, toAddress: string, amount: number) {
        try {
            const signinData = await this.signTransaction(privateKey, fromAddress, toAddress, amount);
            if (signinData !== false && signinData.rawTransaction) {
                return await this.sendSignedTransaction(signinData.rawTransaction);
            } else {
                return false;
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - sendWithdrawToken: ${error}`);
            return false;
        }
    }

    private async crawlDepositNative(privateKey: string, fromAddress: string, toAddress: string, amount: number) {
        try {
            const signinData = await this.signTransactionNative(privateKey, fromAddress, toAddress, amount);
            if (signinData !== false && signinData.rawTransaction) {
                return await this.sendSignedTransaction(signinData.rawTransaction);
            } else {
                return false;
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - sendWithdrawNative: ${error}`);
            return false;
        }
    }

    public async crawDeposit(privateKey: string, fromAddress: string, toAddress: string, amount: number) {
        try {
            if (this.contractAddress == '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' || this.contractAddress == '0x0000000000000000000000000000000000001010' || this.contractAddress == '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') {
                return await this.crawlDepositNative(privateKey, fromAddress, toAddress, amount);
            } else {
                return await this.crawlDepositToken(privateKey, fromAddress, toAddress, amount);
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Deposit - crawDeposit: ${error}`);
            return false;
        }
    }

    private async estimateGasLimit(from: string, to: string, dataEncodeABI: any) {
        try {
            const gasLimit: number = await this.web3.eth.estimateGas({ "from": from, "to": to, "data": dataEncodeABI })
            const gasLimitE: any = +gasLimit + ((+gasLimit * 10) / 100);
            return gasLimitE.toFixed();
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Token - estimateGasLimit: ${error}`);
            return 100000;
        }
    }

}

