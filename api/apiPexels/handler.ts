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
import { ListObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@services/s3Client";

const S3 = new S3Service();

export const getPexelsPhotos: APIGatewayProxyHandlerV2<Response> = async (
  event
) => {
  const client = createClient(getEnv("PEXELS_API_KEY"));
  const service = new PexelsService(event, client);
  //@ts-ignore
  const photos = await service.getPexelsPhotos();
  try {
    //@ts-ignore
    const result = { statusCode: 200, content: photos };
    return createResponse(result.statusCode, result.content);
  } catch (err) {
    return errorHandler(err);
  }
};

export const postPexelsPhotos: APIGatewayProxyHandlerV2 = async (event) => {
  const client = createClient(getEnv("PEXELS_API_KEY"));
  const ids = JSON.parse(event.body!).ids;
  // log(ids);
  const photosIds = await Promise.all(
    ids.map(async (id) => {
      return await client.photos.show({ id: id });
    })
  );
  // log(photosIds[0].src.original);

  // log("photos from array: ");
  // log(photos);

  /// upload to s3 image
  //@ts-ignore

  // const image = await axios.get(
  //   "https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg?auto=compress&cs=tinysrgb&h=130",
  //   { responseType: "arraybuffer" }
  // );
  // log(image.data);
  log("ids: ");
  for (const id of photosIds) {
    const image = await axios.get(id.src.original, {
      responseType: "arraybuffer",
    });
    log("photo info: ", id.id);
    log("buffer: ", image.data);
    const command = new PutObjectCommand({
      Bucket: getEnv("IMAGES_BUCKET_NAME"),
      Body: image.data,
      Key: `pexels_${id.id}.jpeg`,
      ACL: "public-read",
      ContentType: "image/jpeg",
    });
    const response = await s3Client.send(command);
  }

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
