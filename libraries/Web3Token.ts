import Web3 from 'web3';
import { BotTelegram } from '../libraries';
export class Web3Token {
	private readonly web3: any;
	constructor(rpc: string) {
		this.web3 = new Web3(new Web3.providers.HttpProvider(rpc));
	}

	public async isAddress(address: string) {
		try {
			return this.web3.utils.isAddress(address);
		} catch (error) {
			return false;
		}
	}
	
	public async createWallet() {
		try {
			return this.web3.eth.accounts.create(this.web3.utils.randomHex(32));
		} catch (error) {
			return false;
		}
	}

	public async checkStatusTransaction(hash: string) {
		try {
			return await this.web3.eth.getTransactionReceipt(hash);
		} catch (error) {
			BotTelegram.sendMessageError(`Web3Token - checkStatusTransaction: ${error}`);
			return false;
		}
	}

	public async getBlock(blockNumber: number) {
		try {
			return await this.web3.eth.getBlock(blockNumber);
		} catch (error) {
			BotTelegram.sendMessageError(`Web3Token - getBlock: ${error}`);
			return false;
		}
	}
	public async getTransactionReceipt(hash: string) {
		try {
			return await this.web3.eth.getTransaction(hash);
		} catch (error) {
			BotTelegram.sendMessageError(`Web3Token - getTransactionReceipt: ${error}`);
			return false;
		}
	}

	public async verifyMessage(address: string, message: string, signature: string) {
		try {
			const dataRecover = this.web3.eth.accounts.recover(message, signature);
			if (dataRecover == address) {
				return true;
			} else {
				return false;
			}
		} catch (error) {
			BotTelegram.sendMessageError(`Web3Token - checkAddressSignature: ${error}`);
			return false;
		}
	}
}
