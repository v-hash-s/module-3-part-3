import { createResponse } from "../../helper/http-api/response";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { errorHandler } from "../../helper/http-api/error-handler";
import { log } from "../../helper/logger";
import { createClient } from "pexels";
import { getEnv } from "@helper/environment";
import { Response } from "api/auth/auth.interfaces";
import { PexelsManager } from "./apiPexels.manager";
import { PexelsService } from "./apiPexels.service";
import * as multipartParser from "lambda-multipart-parser";
const axios = require("axios");
import { S3Service } from "../../services/s3.service";
import * as sharp from "sharp";
import { SQSService } from "../../services/sqs.service";

const S3 = new S3Service();
export const getPexelsPhotos: APIGatewayProxyHandlerV2<Response> = async (
  event
) => {
  const client = createClient(getEnv("PEXELS_API_KEY"));
  const service = new PexelsService(event, client);
  //@ts-ignore
  const photos = await service.getPexelsPhotosByQuery();
  try {
    //@ts-ignore
    const result = { statusCode: 200, content: photos };
    return createResponse(result.statusCode, result.content);
  } catch (err) {
    return errorHandler(err);
  }
};

export const saveImagesSubclip = async (event) => {
  log("hey from subclipping");
};

export const postPexelsPhotos = async (event) => {
  log("event: ", JSON.parse(event.Records[0].body));
  log("hello from post pexels");
  const manager = new PexelsManager();
  const service = new PexelsService();
  const body = JSON.parse(event.Records[0].body);
  const token = body.token;
  const ids = body.ids;

  //@ts-ignore
  // const token = event.headers.Authorization.split(" ")[1]; !!!!!!!!!!!
  // const ids = JSON.parse(event.body!).ids;!!!!!!!!!!!!
  const email = await manager.getUserEmail(token);
  // const client = createClient(getEnv("PEXELS_API_KEY"));
  // await manager.savePexelsImagesToDynamoDB(email, );
  // await manager.savePexelsImagesToS3(email, ids);
  await manager.savePexelsImages(ids, email);
  // const photosIds = await Promise.all(
  //   ids.map(async (id) => {
  //     return await client.photos.show({ id: id });
  //   })
  // );

  // for (const photo of photos) {
  //   const image = await axios.get(photo.src.original, {
  //     responseType: "arraybuffer",
  //   });
  //   const command = new PutObjectCommand({
  //     Bucket: getEnv("IMAGES_BUCKET_NAME"),
  //     Body: image.data,
  //     Key: `${email}/pexels_${photo.id}.jpeg`,
  //     ACL: "public-read",
  //     ContentType: "image/jpeg",
  //   });
  //   await s3Client.send(command);
  // }

  // const res = await axios.put(url, image.data);
  // const axiosResponse = await axios.put(
  //   url,
  //   {
  //     data: image.data,
  //   },
  //   {
  //     headers: {
  //       "Content-Type": "image/jpeg",
  //     },
  //   }
  // );

  // await axios
  //   .put(url, image.data, {
  //     headers: {
  //       "Content-Type": image.headers["content-type"],
  //     },
  //   })
  //   .then(log("uploaded"));

  //@ts-ignore
  try {
    //@ts-ignore
    const result = { statusCode: 200, content: "lol" };
    return createResponse(result.statusCode, result.content);
  } catch (err) {
    return errorHandler(err);
  }
};

export const sendMessageSQS = async (event) => {
  log("event from sqs: ", event);
  const token: string = event.headers.Authorization.split(" ")[1];
  const ids = event.body!.ids;
  log(ids);
  const sqs = new SQSService(getEnv("SQS_QUEUE_URL"));
  log("is about to send sqs message");

  await sqs.sendMessage(JSON.stringify({ token: token, ids: ids }));
};
