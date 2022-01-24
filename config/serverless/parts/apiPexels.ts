import { AWSPartitial } from "../types";

import { GetAtt } from "../cf-intristic-fn";

export const apiPexelsConfig: AWSPartitial = {
  provider: {
    httpApi: {
      authorizers: {
        // !!!!
        jwtauth: {
          type: "request",
          enableSimpleResponses: true,
          functionName: "jwtauth",
          identitySource: "$request.header.Authorization",
        },
      },
    },
  },

  functions: {
    getPexelsPhotos: {
      handler: "api/apiPexels/handler.getPexelsPhotos",
      memorySize: 256,
      events: [
        {
          http: {
            path: "/gallery/pexels",
            method: "get",
          },
        },
      ],
    },

    sendMessageSQS: {
      handler: "api/apiPexels/handler.sendMessageSQS",
      memorySize: 256,
      events: [
        {
          http: {
            path: "/gallery/pexels",
            method: "post",
            integration: "lambda",
            cors: true,
            response: {
              headers: {
                "Access-Control-Allow-Origin": "'*'",
                "Content-Type": "'application/json'",
              },
              template: "$input.json('$')",
            },
          },
        },
      ],
    },

    postPexelsPhotos: {
      handler: "api/apiPexels/handler.postPexelsPhotos",
      memorySize: 256,
      events: [
        {
          sqs: {
            arn:
              "arn:aws:sqs:us-east-1:367315594041:vs-sls-prod-pexels_sqs_queue",
          },
        },
      ],
    },
  },
};
