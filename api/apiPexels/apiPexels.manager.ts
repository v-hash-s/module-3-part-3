import { log } from "../../helper/logger";
import * as jwt from "jsonwebtoken";
import { getEnv } from "../../helper/environment";
const axios = require("axios");
import { ListObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@services/s3Client";
import { PexelsService } from "./apiPexels.service";
import { DynamoClient } from "../../services/dynamodb-client";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import * as crypto from "crypto";
import * as sharp from "sharp";

export class PexelsManager {
  private readonly service: PexelsService;
  constructor() {
    this.service = new PexelsService();
  }
  async getUserEmail(token: string) {
    const email = jwt.verify(token, getEnv("TOKEN_KEY"));
    // @ts-ignore
    return email.email;
  }

  async savePexelsImagesToS3(email, ids) {
    const photos = await this.service.getPexelsPhotosByIds(ids);

    for (const photo of photos) {
      //@ts-ignore

      const image = await axios.get(photo.src.original, {
        responseType: "arraybuffer",
      });
      //@ts-ignore
      log(`${email}/pexels_${photo.id}.jpeg`);

      const command = new PutObjectCommand({
        Bucket: getEnv("IMAGES_BUCKET_NAME"),
        Body: image.data,
        // Body: resizedImage,

        //@ts-ignore

        Key: `${email}/pexels_${photo.id}.jpeg`,
        ACL: "public-read",
        ContentType: "image/jpeg",
      });
      log("sendResponse: " + JSON.stringify(await s3Client.send(command)));
    }
  }

  async savePexelsImagesToDynamoDB(email, imageId) {
    const id: string = crypto
      .createHash("md5")
      .update(String(`pexels_${imageId}.jpeg`))
      .digest("hex");
    log(id);
    const params = {
      TableName: getEnv("USERS_TABLE_NAME"),
      Item: {
        email: { S: email },
        data: { S: `image_${id}` },
        URL: {
          S: `https://vs-sls-prod-gallerys3.s3.amazonaws.com/${email}/${imageId}`,
        },
        image: { S: `pexels_${imageId}.jpeg` },
        status: { S: "OPEN" },
      },
    };

    await DynamoClient.send(new PutItemCommand(params));
  }

  async savePexelsImages(ids, email) {
    const photos = await this.service.getPexelsPhotosByIds(ids);
    // log("photos: ", photos[0].id);
    for (const photo of photos) {
      // log(photo);
      //@ts-ignore
      await this.savePexelsImagesToDynamoDB(email, photo.id);
      await this.savePexelsImagesToS3(email, ids);
    }
  }
}
