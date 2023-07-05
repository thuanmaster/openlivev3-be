import Web3 from 'web3';
export class Web3Utils {
    private readonly web3: any;
    constructor() {
        this.web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed1.binance.org/'));
    }

    public fromWei(amount: number, decimal: number) {
        try {
            let amountFullwide = amount.toLocaleString('fullwide', { useGrouping: false })
            return this.web3.utils.fromWei(amountFullwide.toString(), this.unitString(decimal));
        } catch (error) {
            return false;
        }
    }

    public toWei(amount: number, decimal: number) {
        try {
            let amountFullwide = amount.toLocaleString('fullwide', { useGrouping: false })
            return this.web3.utils.toWei(amountFullwide.toString(), this.unitString(decimal));
        } catch (error) {
            return false;
        }
    }

    private unitString(decimal: number) {
        let unit = "ether";
        switch (decimal) {
            case 0:
                unit = "noether"
                break;
            case 1:
                unit = "wei"
                break;
            case 3:
                unit = "kwei"
                break;
            case 6:
                unit = "mwei"
                break;
            case 9:
                unit = "gwei"
                break;
            case 12:
                unit = "szabo"
                break;
            case 15:
                unit = "finney"
                break;
            case 18:
                unit = "ether"
                break;
            case 21:
                unit = "kether"
                break;
            case 24:
                unit = "mether"
                break;
        }
        return unit;
    }
}
