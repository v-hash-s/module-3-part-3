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
  const manager = new PexelsManager();
  const body = JSON.parse(event.Records[0].body);
  const token = body.token;
  const ids = body.ids;
  //@ts-ignore
  const email = await manager.getUserEmail(token);
  await manager.savePexelsImages(ids, email);

  //@ts-ignore
  try {
    //@ts-ignore
    const result = {
      statusCode: 200,
      content: "Images are successfully saved",
    };
    return createResponse(result.statusCode, result.content);
  } catch (err) {
    return errorHandler(err);
  }
};

export const sendMessageSQS = async (event) => {
  const token: string = event.headers.Authorization.split(" ")[1];
  const ids = event.body!.ids;
  const sqs = new SQSService(getEnv("SQS_QUEUE_URL"));

  await sqs.sendMessage(JSON.stringify({ token: token, ids: ids }));
};
