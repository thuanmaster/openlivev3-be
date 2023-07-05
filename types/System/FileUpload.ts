import { Options } from '@ourparentcenter/moleculer-decorators-extended';
import { DbServiceSettings } from 'moleculer-db';
import { IFile } from '../../entities';

export interface UploadedFile {
    path: string;
    full_path: string;
}

export interface File {
    folder: string;
    name: string;
    type: string;
    extension: string;
    content: any;
}


export interface FilesServiceSettingsOptions extends DbServiceSettings {
    rest: '/v1/file';
    fields: (keyof Required<IFile>)[];
}

export interface FilesServiceOptions extends Options {
    name: 'files';
    settings: FilesServiceSettingsOptions;
}
