import { getEnv } from "@helper/environment";
import * as jwt from "jsonwebtoken";
import { DynamoClient } from "../../services/dynamodb-client";
import * as bcrypt from "bcryptjs";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import * as multipartParser from "lambda-multipart-parser";
import { s3Client } from "@services/s3Client";
import { S3Service } from "../../services/s3.service";
const S3 = new S3Service();
import * as crypto from "crypto";

import { String } from "aws-sdk/clients/cloudhsm";
import { Response } from "./gallery.interfaces";

export class GalleryService {
  async isExist(
    payload: multipartParser.MultipartRequest,
    email: string
  ): Promise<Boolean> {
    const command = new GetObjectCommand({
      Bucket: getEnv("IMAGES_BUCKET_NAME"),
      Key: `${email}/${payload.files[0].filename}`,
    });
    try {
      await s3Client.send(command);
      return true;
    } catch (err) {
      return false;
    }
  }

  cutEmail(filename: string, email: string): String {
    return filename.replace(`${email}/`, "");
  }

  async hashImage(image: string): Promise<string> {
    const saltRounds = getEnv("SALT_ROUNDS");
    const salt = await bcrypt.genSalt(Number(saltRounds));
    const hashedPassword = await bcrypt.hash(image, salt);
    return hashedPassword;
  }

  async getPresignedUrl(
    email: string,
    payload: multipartParser.MultipartRequest
  ) {
    const id: string = crypto
      .createHash("md5")
      .update(payload.files[0].filename)
      .digest("hex");
    const link = S3.getPreSignedPutUrl(
      `${email}/${payload.files[0].filename}`,

      getEnv("IMAGES_BUCKET_NAME")
    );

    const params = {
      TableName: getEnv("USERS_TABLE_NAME"),
      Item: {
        email: { S: email },
        data: { S: `image_${id}` },
        URL: {
          S: `https://vs-sls-prod-gallerys3.s3.amazonaws.com/${email}/${payload.files[0].filename}`,
        },
        image: { S: payload.files[0].filename },
        status: { S: "OPEN" },
      },
    };

    await DynamoClient.send(new PutItemCommand(params));
    return link;
  }

  async sendGalleryObject(images): Promise<Response> {
    return {
      content: JSON.stringify(images),
      statusCode: 200,
    };
  }

  getPagesNumber(total: number, limit: number): number {
    limit = Number(limit);
    const finalResult = Math.ceil(total / limit);

    return finalResult;
  }

  async getEmailFromToken(token: string) {
    const email = jwt.verify(token, getEnv("TOKEN_KEY"));
    // @ts-ignore
    return email.email;
  }
}
