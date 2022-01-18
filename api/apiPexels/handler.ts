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
import * as axios from "axios";
import { S3Service } from "../../services/s3.service";
import * as sharp from "sharp";

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
  const photos = await Promise.all(
    ids.map(async (id) => {
      return await client.photos.show({ id: id });
    })
  );

  // log("photos from array: ");
  // log(photos);

  /// upload to s3 image
  //@ts-ignore

  const image = await axios.get(
    "https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg?auto=compress&cs=tinysrgb&h=130",
    { responseType: "arraybuffer" }
  );

  // S3.put(
  //   "image.jpeg",
  //   `${image.data}.jpeg`,
  //   getEnv("IMAGES_BUCKET_NAME"),
  //   "public-read"
  // );
  //@ts-ignore
  try {
    //@ts-ignore
    const result = { statusCode: 200, content: "lol" };
    return createResponse(result.statusCode, result.content);
  } catch (err) {
    return errorHandler(err);
  }
};
