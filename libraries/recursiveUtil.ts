import _ from "lodash";

export class recursiveUtil {
	public static getParentCustomer(customers: any, sponsorId: string, data: any, level: number) {
		customers.forEach((value: any, key: number) => {
			if (value._id == sponsorId) {
				value.level = level
				this.getParentCustomer(customers, value.sponsor_id, data, level + 1)
				if (level > 0) {
					data.push(value)
				}
			}
		})
		return data;
	}

	public static getChildLevelCustomer(customers: any, customerId: string, count: number, level: number) {
		let sponsorF1s = _.filter(customers, (customer) => { return customer.sponsor_id == customerId; });
		if(sponsorF1s.length > 0) {
			sponsorF1s.forEach((value: any, key: number) => {
				if (value.level_commission != level) {
					this.getChildLevelCustomer(customers, value._id, count, level)
				}else {
					count++;
				}
			})
		}
		return count;
	}
}
