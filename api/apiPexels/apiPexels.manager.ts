import { log } from "../../helper/logger";
import * as jwt from "jsonwebtoken";
import { getEnv } from "../../helper/environment";
const axios = require("axios");
import { ListObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@services/s3Client";
import { PexelsService } from "./apiPexels.service";

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
      const command = new PutObjectCommand({
        Bucket: getEnv("IMAGES_BUCKET_NAME"),
        Body: image.data,
        //@ts-ignore

        Key: `${email}/pexels_${photo.id}.jpeg`,
        ACL: "public-read",
        ContentType: "image/jpeg",
      });
      await s3Client.send(command);
    }
  }
}
