import { GalleryService } from "./gallery.service";
import { getEnv } from "@helper/environment";
import { QueryParameters } from "./gallery.interfaces";
import { DynamoClient } from "../../services/dynamodb-client";
import { ListObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { s3Client } from "@services/s3Client";
import { GalleryResponse, Response } from "./gallery.interfaces";
import { APIGatewayProxyEventQueryStringParameters } from "aws-lambda";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { log } from "../../helper/logger";
import { S3Service } from "../../services/s3.service";
// const S3 = new S3Service();
import * as crypto from "crypto";

// const converter = require("aws-sdk").DynamoDB.Converter.unmarshall;
import { DynamoDB } from "aws-sdk";
const converter = DynamoDB.Converter.unmarshall;

export class GalleryManager {
  private readonly service: GalleryService;

  constructor() {
    this.service = new GalleryService();
  }

  async getPagesNumber(queryParameters: QueryParameters): Promise<number> {
    let limit = Number(queryParameters.limit);
    const counts = await this.getTotal();
    const finalResult = Math.ceil(counts / limit);
    return finalResult;
  }

  async getTotal(): Promise<number> {
    const params = {
      Bucket: getEnv("IMAGES_BUCKET_NAME"),
    };
    const command = new ListObjectsCommand(params);
    const response = await s3Client.send(command);
    let total = 0;
    for (let i = 0; i < response?.Contents?.length!; i++) {
      total++;
    }
    return total;
  }

  async getPagedImages(
    images,
    pageNumber: number,
    limit: number
  ): Promise<GalleryResponse> {
    limit = Number(limit);
    pageNumber = Number(pageNumber);
    const photos = [] as any;
    for (
      let i = (pageNumber - 1) * limit;
      //@ts-ignore
      i < limit + (pageNumber - 1) * limit && i < images.length;
      i++
    ) {
      photos.push(images[i]);
    }
    return {
      objects: await photos,
      total: await this.service.getPagesNumber(await this.getTotal(), limit),
    };
  }

  async getGalleryObjects(
    query: APIGatewayProxyEventQueryStringParameters,
    email: string
  ): Promise<
    | {
        [key: string]: AttributeValue;
      }[]
    | undefined
  > {
    if (query.filter != "true") {
      const params = {
        TableName: getEnv("USERS_TABLE_NAME"),
        ExpressionAttributeNames: {
          "#d": "data",
        },
        ExpressionAttributeValues: {
          ":data": {
            S: "image_",
          },
        },
        FilterExpression: "begins_with(#d, :data)",
      };

      const GetItem = new ScanCommand(params);

      const img = await DynamoClient.send(GetItem);
      const imgArr = [];
      img.Items!.forEach((element) => {
        //@ts-ignore
        imgArr.push(this.convertItems(element));
      });
      return imgArr;
    } else {
      const params = {
        TableName: getEnv("USERS_TABLE_NAME"),
        ExpressionAttributeNames: {
          "#e": "email",
          "#d": "data",
        },
        ExpressionAttributeValues: {
          ":email": {
            S: email,
          },
          ":data": {
            S: "image_",
          },
        },
        KeyConditionExpression: "#e = :email AND begins_with ( #d, :data )",
      };

      const GetItem = new QueryCommand(params);
      const img = await DynamoClient.send(GetItem);

      const imgArr = [];
      img.Items!.forEach((element) => {
        //@ts-ignore
        imgArr.push(this.convertItems(element));
      });
      return imgArr;
    }
  }

  convertItems(element: { [key: string]: AttributeValue }): string {
    let formattedString = `${converter(element).email}/${
      converter(element).image
    }`;
    return formattedString;
  }

  async presignImagesUrls(arr: string[]): Promise<string[]> {
    const S3 = new S3Service();

    const presignedUrls: string[] = [];
    arr.forEach((el) => {
      presignedUrls.push(
        S3.getPreSignedGetUrl(el, getEnv("IMAGES_BUCKET_NAME"))
      );
    });
    return presignedUrls;
  }

  async updateValue(filename: string, email: string): Promise<void> {
    const hashedImage = crypto.createHash("md5").update(filename).digest("hex");
    const params = {
      TableName: getEnv("USERS_TABLE_NAME"),
      Key: {
        email: { S: email },
        data: { S: `image_${hashedImage}` },
      },
      UpdateExpression: "SET #status = :st",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":st": { S: "CLOSED" },
      },
    };
    const updateCommand = new UpdateItemCommand(params);
    await DynamoClient.send(updateCommand).then(() => log("saved to db"));
  }
  // async saveImageInDB(payload, email): Promise<Response> {
  //   const result = await this.service.isExist(payload, email);
  //   if (!result) {
  //     // log(
  //     //   S3.getPreSignedPutUrl(
  //     //     `${email}/${payload.files[0].filename}`,
  //     //     getEnv("IMAGES_BUCKET_NAME")
  //     //   )
  //     // );
  //     // const command = new PutObjectCommand({
  //     //   Bucket: getEnv("IMAGES_BUCKET_NAME"),
  //     //   Body: payload.files[0].content,
  //     //   Key: `${email}/${payload.files[0].filename}`,
  //     //   ACL: "public-read",
  //     //   ContentType: payload.files[0].contentType,
  //     //   // ContentType: "application/octet-stream",
  //     // });
  //     // const response = await s3Client.send(command);
  //     const res = await this.service.isExist(payload, email);
  //     if (!res) {
  //       return {
  //         statusCode: 404,
  //         content: "Something went wrong. Try again later",
  //       };
  //     } else {
  //       await this.service.saveImageToDB(
  //         payload.files[0],
  //         `${email}/${payload.files[0].filename}`,
  //         email
  //       );
  //       return {
  //         statusCode: 200,
  //         content: "Image is successfully uploaded",
  //       };
  //     }
  //   } else {
  //     await this.service.saveImageToDB(
  //       payload.files[0],
  //       `${email}/${payload.files[0].filename}`,
  //       email
  //     );
  //     return {
  //       statusCode: 309,
  //       content: "Image already exists",
  //     };
  //   }
  // }
}
