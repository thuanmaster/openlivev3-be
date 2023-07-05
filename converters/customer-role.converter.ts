import { JsonConverter, JsonCustomConvert } from 'json2typescript';
import { CustomerRole } from '../types';

@JsonConverter
export class CustomerRoleConverter implements JsonCustomConvert<CustomerRole[]> {
	public serialize(items: CustomerRole[]): string[] {
		return items.map((x) => x.toString());
	}

	public deserialize(items: string[]): CustomerRole[] {
		const values = Object.values<string>(CustomerRole);
		const valids = items.every((x) => values.includes(x));
		if (!valids) {
			throw new Error(`Not valid enum in roles "${items.join('", "')}"`);
		}
		return items.map<CustomerRole>((x) => x as CustomerRole);
	}
}
