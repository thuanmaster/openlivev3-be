'use strict';
import moleculer, { ActionParams, Context } from 'moleculer';
import { Action, Delete, Get, Method, Post, Put, Service } from '@ourparentcenter/moleculer-decorators-extended';
const { NotFoundError } = require("moleculer").Errors;
import { dbFileMixin, eventsFileMixin } from '../../mixins/dbMixins';
import { Config } from '../../common';
import { AWSFileUploader, Otplib } from '../../libraries';
const fs = require("fs");
const path = require("path");
const mkdir = require("mkdirp").sync;
const uploadDir = path.join(__dirname, "images");

mkdir(uploadDir);

import {
    MoleculerDBService,
    RestOptions,
    FilesServiceOptions,
    FilesServiceSettingsOptions,
} from '../../types';
import { FileEntity, IFile } from '../../entities';
import { JsonConvert } from 'json2typescript';

@Service<FilesServiceOptions>({
    name: 'files',
    version: 1,
    mixins: [dbFileMixin, eventsFileMixin],
    settings: {
        idField: '_id',
        pageSize: 10,
        rest: '/v1/file',
        fields: [
            '_id',
            'key',
            'full_link',
            'createdAt',
            'updatedAt',
        ]
    },
})
export default class FileService extends MoleculerDBService<FilesServiceSettingsOptions, IFile> {
    /**
     *  @swagger
     *
     *  /v1/file/upload:
     *    post:
     *      tags:
     *      - "Files"
     *      summary: upload file
     *      description: upload file
     *      produces:
     *        - application/json
     *      security:
     *        - Bearer: [] 
     *      parameters:
     *       - name: key
     *         description: key upload file
     *         in: formData
     *         required: true
     *         type: string
     *         example : "123456789"
     *       - in: formData
     *         name: image
     *         type: file
     *         required: true
     *         description: Please choose file to upload.
     *      consumes:
     *        - multipart/form-data
     *      responses:
     *        200:
     *          description: Upload file success
     *        403:
     *          description: Server error
     */
    @Action({
        name: "uploadFile",
        cache: false
    })
    async uploadFile(ctx: Context) {

        try {
            const meta: any = ctx.meta;
            let params: any = ctx.params;
            const data = this.getDataFile(meta.filename);

            const filePath = path.join(uploadDir, this.randomName(data.name, data.extension));
            const writeFile: any = await new Promise((resolve, reject) => {
                const f = fs.createWriteStream(filePath);
                f.on("close", () => {
                    resolve({ filePath, meta: meta });
                });

                params.on("error", (err: any) => {
                    reject(err);
                    f.destroy(err);
                });

                f.on("error", () => {
                    fs.unlinkSync(filePath);
                });
                params.pipe(f);
            });
            var stats = fs.statSync(writeFile.filePath);
            var fileSizeInBytes = stats.size;
            if (fileSizeInBytes > 20 * 1020 * 1024) {
                fs.unlinkSync(filePath);
                return this.responseError('err_over_size', "The file exceeds the allowed limit 20Mb.")
            }
            
            const multipart = meta.$multipart
            const s3 = new AWSFileUploader();
            const upload: any = await s3.upload({
                folder: multipart.key,
                name: data.name,
                type: meta.mimetype,
                extension: data.extension,
                content: writeFile.filePath
            })
            if (upload != undefined) {
                fs.unlinkSync(filePath);
                let entity = {
                    key: multipart.key,
                    full_link: Config.AWS_INFO.domain + "/" + upload.path
                }
                const parsedFileEntity = new JsonConvert().deserializeObject(entity, FileEntity).getMongoEntity()
                const file = await this._create(ctx, parsedFileEntity);
                return this.responseSuccess(file)
            } else {
                fs.unlinkSync(filePath);
                return this.responseError('err_upload_fail', 'Upload file fail');
            }
        } catch (err) {
            this.logger.error('upload File:', err);
            return this.responseError('err_upload_fail', 'Upload file fail');
        }
    }

    @Action({
        name: "find",
        cache: {
            keys: ['fileService', 'find', 'id'],
            ttl: 60 * 60
        },
    })

    async find(ctx: Context) {
        try {
            const params: any = ctx.params;
            const file = await this.adapter.findById(params.id);
            if (file) {
                return this.responseSuccess(file);
            } else {
                return this.responseError('err_not_found', 'File not esxit in system.')
            }
        } catch (err) {
            return this.responseUnkownError();
        }
    }

    @Action({
        name: "delete"
    })
    async delete(ctx: Context) {
        try {
            const params: any = ctx.params;
            const file: any = await this.adapter.findById(params.id);
            if (file) {
                this.adapter.removeById(file._id);
                return this.responseSuccessMessage("delete file success");
            } else {
                return this.responseError('err_not_found', 'File not esxit in system.')
            }
        } catch (err) {
            return this.responseUnkownError();
        }
    }

    @Method
    randomName(filename: string, extension: string) {
        return filename + Date.now() + "." + extension;
    }

    @Method
    getDataFile(filename: string) {
        const data = filename.split('.')
        const extension = data.slice(-1)[0]
        data.pop()
        return { extension, name: data.join("-") }
    }
}
