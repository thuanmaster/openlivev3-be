import Web3 from 'web3';
import { BotTelegram } from '.';
export class Web3Balance {
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

    public async getBalance(address: string) {
        try {
            if (this.contractAddress == '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' || this.contractAddress == '0x0000000000000000000000000000000000001010' || this.contractAddress == '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') {
                return await this.getBalanceNative(address);
            } else {
                return await this.getBalanceToken(address);
            }
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Balance - getBalance - ${this.rpc}: ${error}`);
            return 0;
        }
    }

    public async getBalanceToken(address: string) {
        try {
            return await this.contract.methods.balanceOf(address).call()
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Balance - getBalanceToken - ${this.rpc}: ${error}`);
            return false;
        }
    }

    public async getBalanceNative(address: string) {
        try {
            return await this.web3.eth.getBalance(address)
        } catch (error) {
            BotTelegram.sendMessageError(`Web3Balance - getBalanceNative - ${this.rpc}: ${error}`);
            return false;
        }
    }

}

