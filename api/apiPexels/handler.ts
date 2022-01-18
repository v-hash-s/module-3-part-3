import { createResponse } from "../../helper/http-api/response";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { errorHandler } from "../../helper/http-api/error-handler";
import { log } from "../../helper/logger";

export const getPexelsPhotos: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const result = { statusCode: 200, content: "hey" };
    return createResponse(result.statusCode, result.content);
  } catch (err) {
    return errorHandler(err);
  }
};

// export const postPexelsPhotos: APIGatewayProxyHandlerV2<Response> = async (event) => {
//     try {
//       const user = JSON.parse(event.body!);
//       const manager = new AuthManager();
//       const result = await manager.signUp(user);
//       return createResponse(result.statusCode, result.content);
//     } catch (err) {
//       return errorHandler(err);
//     }
//   };
