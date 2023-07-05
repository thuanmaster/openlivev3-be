export class CustomStore {
    private hits: any;
    private limit: number;
    private resetTime: any;
    constructor(clearPeriod: any, opts: any) {
        this.hits = new Map();
        this.limit = opts.limit;
        this.resetTime = Date.now() + clearPeriod;
        setInterval(() => {
            this.resetTime = Date.now() + clearPeriod;
            this.reset();
        }, clearPeriod);
    }

    inc(key: string) {
        const position_invest: number = key.search("v1/investment/invest");
        const position_claim: number = key.search("v1/investment/claimDailyReward");
        const cancelWithdraw: number = key.search("v1/admin/transaction/cancelWithdraw");
        const approveWithdraw: number = key.search("v1/admin/transaction/approveWithdraw");
        const retryWithdraw: number = key.search("v1/admin/transaction/retryWithdraw");
        const checkHashDeposit: number = key.search("v1/admin/transaction/checkHashDeposit");
        const completedDeposit: number = key.search("v1/admin/transaction/completedDeposit");
        const metaDataNft: number = key.search("/meta/");
        if (position_invest != -1 || position_claim != -1 || cancelWithdraw != -1 || approveWithdraw != -1
            || retryWithdraw != -1 || checkHashDeposit != -1 || completedDeposit != -1) {
            let counter = this.hits.get(key) || this.limit - 1;
            counter++;
            this.hits.set(key, this.limit);
            return counter;
        } else {
            if (metaDataNft != -1) {
                this.reset();
            } else {
                let counter = this.hits.get(key) || 0;
                counter++;
                this.hits.set(key, counter);
                return counter;
            }
        }

    }

    reset() {
        this.hits.clear();
    }
}