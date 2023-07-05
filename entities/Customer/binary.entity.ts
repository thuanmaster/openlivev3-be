/* eslint-disable no-underscore-dangle */
import { Any, JsonObject, JsonProperty } from 'json2typescript';
import { Types } from 'mongoose';
import { ObjectId, ObjectIdNull } from '../../types';
import { Config } from '../../common';
import moment from 'moment';


export interface IBinary {
    _id: ObjectIdNull;
    main_id: string;
    node_main: number;
    left: string;
    node_left: number;
    right: string;
    node_right: number;
    createdAt: number | null;
    updatedAt: number | null;
}

@JsonObject('Binary')
export class BinaryEntity implements IBinary {
    @JsonProperty('_id', String, true)
    public _id = Config.DB_INFO.dialect === 'local' ? Types.ObjectId() : null;

    @JsonProperty('main_id', String, false)
    public main_id = '';
    @JsonProperty('node_main', Number, false)
    public node_main = 0;

    @JsonProperty('left', String, true)
    public left = '';

    @JsonProperty('node_left', Number, true)
    public node_left = 0;

    @JsonProperty('right', String, true)
    public right = '';
    @JsonProperty('node_right', Number, true)
    public node_right = 0;

    @JsonProperty('createdAt', Number, true)
    public createdAt = moment().unix();

    @JsonProperty('updatedAt', Number, true)
    public updatedAt = moment().unix();

    public getMongoEntity() {
        const result: IBinary = { ...this, _id: this._id && (this._id as Types.ObjectId).toString() };
        if (!result._id) {
            // @ts-ignore
            delete result._id;
        }
        return result;
    }
}
