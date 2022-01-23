import { AuthService } from "./auth.service";
import * as bcrypt from "bcryptjs";
import { User, Response } from "./auth.interfaces";
import { getEnv } from "@helper/environment";
import { DynamoClient } from "@services/dynamodb-client";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";

const converter = require("aws-sdk").DynamoDB.Converter.unmarshall;

export class AuthManager {
  private readonly service: AuthService;
  constructor() {
    this.service = new AuthService();
  }

  async sendResponseToUser(user: User): Promise<Response> {
    let isInDB = await this.isUserInDB(user);
    if (isInDB) {
      return {
        statusCode: 200,
        content: { token: this.service.signJWTToken(user.email) },
      };
    } else {
      return {
        statusCode: 404,
        content: { errorMessage: "User not found" },
      };
    }
  }

  async signUp(user: User): Promise<Response> {
    const isInDB = await this.isUserInDB(user);
    if (isInDB) {
      return {
        statusCode: 400,
        content: { errorMessage: "User already exists" },
      };
    } else {
      await this.service.createUser(user);
      return {
        statusCode: 200,
        content: { message: "Signed up" },
      };
    }
  }

  async isUserInDB(user: User): Promise<boolean> {
    const params = {
      TableName: getEnv("USERS_TABLE_NAME"),
      Key: {
        email: {
          S: user.email,
        },
        data: {
          S: "user",
        },
      },
    };
    const GetItem = new GetItemCommand(params);
    const userFindResult = await DynamoClient.send(GetItem);
    if (userFindResult.Item == null) return false;
    const passwordFromDB = converter(userFindResult.Item).password;
    if (bcrypt.compareSync(user.password, passwordFromDB!)) {
      return true;
    }
    return false;
  }
}
