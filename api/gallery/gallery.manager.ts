import { GalleryService } from "./gallery.service";
import { getEnv } from "@helper/environment";
import { QueryParameters } from "./gallery.interfaces";
import { DynamoClient } from "../../services/dynamodb-client";
import { ListObjectsCommand } from "@aws-sdk/client-s3";
import {
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { s3Client } from "@services/s3Client";
import { GalleryResponse, Response } from "./gallery.interfaces";
import { APIGatewayProxyEventQueryStringParameters } from "aws-lambda";
import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { S3Service } from "../../services/s3.service";
const s3 = new S3Service();
import { S3 } from "aws-sdk";
import { PutObjectRequest } from "aws-sdk/clients/s3";
const s3_other = new S3();
import * as crypto from "crypto";
import { sharpImage } from "../../services/sharp";
import { DynamoDB } from "aws-sdk";
const converter = DynamoDB.Converter.unmarshall;
import { log } from "../../helper/logger";

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

  async updateSubclipStatus(filename, email) {
    const hashedImage = crypto.createHash("md5").update(filename).digest("hex");
    const params = {
      TableName: getEnv("USERS_TABLE_NAME"),
      Key: {
        email: { S: email },
        data: { S: `image_${hashedImage}` },
      },
      UpdateExpression: "set Subclip = :subclipStatus",
      ExpressionAttributeValues: {
        ":subclipStatus": { BOOL: true },
      },
    };

    const updateCommand = new UpdateItemCommand(params);
    await DynamoClient.send(updateCommand).then(() => log("saved to db"));
  }

  async saveSubclip(filename, email) {
    const sharp = new sharpImage();
    const contentType = filename.split(".").pop();
    const imageName = filename.split(".")[0];
    const image = await s3.get(
      `${email}/${filename}`,
      getEnv("IMAGES_BUCKET_NAME")
    );
    const resizedImage = await sharp.sharp(image.Body);
    const params: PutObjectRequest = {
      ACL: "public-read",
      Bucket: getEnv("IMAGES_BUCKET_NAME_SUBCLIP"),
      Key: `${email}/${imageName}_SC.${contentType}`,
      Body: resizedImage,
      ContentType: "image/jpeg",
    };
    await s3_other.putObject(params).promise();
  }
}
