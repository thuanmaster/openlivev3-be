import { S3 } from "aws-sdk";
import { File, UploadedFile } from "../types";
import { Config } from '../common';
const fs = require("fs");
import { BotTelegram } from './BotTelegram';
export class AWSFileUploader {
  private client: S3;

  private readonly bucketName = Config.AWS_INFO.bucket;

  constructor() {
    this.client = new S3({
      region: Config.AWS_INFO.region,
      accessKeyId: Config.AWS_INFO.accessKey,
      secretAccessKey: Config.AWS_INFO.secretKey,
    });
  }

  private generateFileKey(file: File, timestamp: number): string {
    return `${file.folder}/${file.name}-${timestamp}.${file.extension}`;
  }

  private getFileKey(full_link: string): string {
    return full_link.replace(Config.AWS_INFO.domain + "/", "");
  }

  private async uploadFile(file: File): Promise<string> {
    const timestamp = Date.now();
    const content = fs.createReadStream(file.content)

    const fileKey = this.generateFileKey(file, timestamp);
    await this.client
      .putObject({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: file.type,
        Body: content,
        ACL: 'public-read',
      })
      .promise();

    return `${fileKey}`;
  }

  private async deleteFile(full_link: string) {

    const fileKey = "undefined/11111-1650928101885.png";
    console.log(fileKey);
    const check = await this.client.getObject({
      Bucket: this.bucketName,
      Key: fileKey,
    }).promise();
    console.log(check);

    return await this.client
      .deleteObject({
        Bucket: this.bucketName,
        Key: fileKey,
      })
      .promise();
  }

  async upload(files: File): Promise<UploadedFile | UploadedFile[] | undefined> {
    try {
      const path = await this.uploadFile(files);
      return { path, full_path: Config.AWS_INFO.domain + "/" + path };
    } catch (error) {
      BotTelegram.sendMessageError(`AWSFileUploader - upload - ${error}`);
      return undefined;
    }
  }

  async delete(full_link: string) {
    try {
      return await this.deleteFile(full_link);
    } catch (error) {
      BotTelegram.sendMessageError(`AWSFileUploader - delete - ${error}`);
      return false;
    }
  }
}