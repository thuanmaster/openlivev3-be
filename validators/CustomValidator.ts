import { Any } from "json2typescript";
import Validate from "fastest-validator";

export class CustomValidator {
    public validato;
    constructor() {
        this.validato = new Validate();
    }

    validate(params: Any | unknown, schema: Any) {
        const res = this.validato.validate(params, schema);
        if (res !== true) {
            return { status: 'error', code: 500, message: "Parameters validation error!", data: res }
        }

        return true;
    }
}
