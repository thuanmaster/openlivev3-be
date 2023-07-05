'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { dbPackageTermMixin, eventsPackageTermMixin } from '../../mixins/dbMixins';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
import {
    MoleculerDBService,
    RestOptions,
} from '../../types';
import { PackageEntity, IPackage, IPackageTerm } from '../../entities';
import { Any, JsonConvert } from 'json2typescript';
import { DbContextParameters, DbServiceSettings } from 'moleculer-db';
import { CustomValidator } from '../../validators';
import moment from 'moment';
import { convertObjectId } from '../../mixins/dbMixins/helpers.mixin';

@Service({
    name: 'packageTerm',
    version: 1,
    mixins: [dbPackageTermMixin, eventsPackageTermMixin],
    settings: {
        rest: '/v1/packageTerm',
        idField: '_id',
        pageSize: 10,
        fields: [
            '_id',
            'package_id',
            'title',
            'total_stake',
            'day_reward',
            'createdAt',
            'updatedAt',
        ]
    }
})
export default class PackageTermService extends MoleculerDBService<DbServiceSettings, IPackageTerm> {
    @Action({
        name: 'findById',
        cache: false
    })
    async findById(ctx: Context): Promise<IPackageTerm | Boolean> {
        try {
            const params: any = ctx.params;
            const packageData: IPackageTerm = await this.adapter.findById(params.term_id);
            if (packageData) {
                return packageData;
            } else {
                return false;
            }
        } catch (error) {
            this.logger.error('PackageTermService - findById:', error)
            return false
        }

    }

    @Action({
        name: 'findByPackageId',
        cache: false
    })
    async findByPackageId(ctx: Context): Promise<IPackageTerm[] | Boolean> {
        try {
            const params: any = ctx.params;
            const packageData: IPackageTerm[] = await this.adapter.find({ query: { package_id: convertObjectId(params.package_id) } });
            if (packageData) {
                return packageData;
            } else {
                return false;
            }
        } catch (error) {
            this.logger.error('PackageTermService - findByPackageId:', error)
            return false
        }

    }
}
