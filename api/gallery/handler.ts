import { GalleryService } from "./gallery.service";
import { createResponse } from "@helper/http-api/response";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { log } from "@helper/logger";
import * as multipartParser from "lambda-multipart-parser";
import { Response } from "./gallery.interfaces";
import { GalleryManager } from "./gallery.manager";
import { errorHandler } from "../../helper/http-api/error-handler";

export const getGallery: APIGatewayProxyHandlerV2<Response> = async (event) => {
  const query = event.queryStringParameters;
  const manager = new GalleryManager();
  const service = new GalleryService();
  //@ts-ignore
  const token = await event.multiValueHeaders.Authorization.toString().replace(
    "Bearer ",
    ""
  );
  const email = await service.getEmailFromToken(token);
  const images = await manager.getGalleryObjects(query!, email);
  //@ts-ignore
  const presignedImgsUrls = await manager.presignImagesUrls(images);

  if (query!.page && query!.limit) {
    const toSendImages = await service.sendGalleryObject(
      await manager.getPagedImages(
        presignedImgsUrls,
        Number(query!.page),
        Number(query!.limit)
      )
    );
    return createResponse(toSendImages.statusCode, toSendImages.content);
  } else {
    const toSendImages = await service.sendGalleryObject(presignedImgsUrls);
    return createResponse(toSendImages.statusCode, toSendImages.content);
  }
};

export const updateStatus = async (event) => {
  log("hello from upload!!!");
  log(event.Records);
  const manager = new GalleryManager();

  try {
    const user = decodeURIComponent(
      event.Records[0].s3.object.key.split("/")[0]
    );
    const filename = event.Records[0].s3.object.key.split("/")[1];
    log("this is filename: ", filename);

    // return await manager.updateValue(filename, user);
    await manager.updateValue(filename, user);
    await manager.saveSubclip(filename, user);
    await manager.updateSubclipStatus(filename, user);
  } catch (error) {
    log("Error occured: " + JSON.stringify(error));
    return errorHandler(error);
  }
};

export const getPresignedUrl = async (event) => {
  log("hello from presigning url");
  try {
    const service = new GalleryService();
    //@ts-ignore
    const user: string = event.requestContext.authorizer.user;
    const payload = await multipartParser.parse(event);
    const link = await service.getPresignedUrl(user, payload);
    const result = { statusCode: 200, content: link };
    return createResponse(result.statusCode, result.content);
  } catch (error) {
    return errorHandler(error);
  }
};

export const saveSubclipToDynamo = async (event) => {
  log("saving subcli to dynamo: ", event);
};
