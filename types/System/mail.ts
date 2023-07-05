export interface ParamSendMailCode {
	fullname: string;
	email: string;
	code: string;
	type: string;
	subject: string;
}

export interface ParamSendTransactionCode {
	fullname: string;
	email: string;
	code: string;
	type: string;
	subject: string;
	currency: string;
	transactionId: string;
	chain_title: string;
	contract: string;
	amount: number;
	to: string;
}
export interface ParamSendMailWelcome {
	fullname: string;
	email: string;
	wallet_address: string;
	subject: string;
}

export interface ParamSendMailInvestSuccess {
	fullname: string;
	email: string;
	package_name: string;
	package_price_usd: number;
	wallet_address: string;
	subject: string;
}

export interface ParamSendMailMintNftSuccess {
	fullname: string;
	email: string;
	package_name: string;
	package_price_usd: number;
	wallet_address: string;
	nft_id: number;
	link_dapp: string;
	subject: string;
}

export interface ParamSendWithdrawComplete {
	fullname: string;
	email: string;
	subject: string;
	link_scan: string;
	txhash: string;
}

export interface ParamDepositComplete {
	fullname: string;
	email: string;
	subject: string;
	link_scan: string;
	txhash: string;
}
