import { AWSPartitial } from "../types";

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
      memorySize: 128,
      events: [
        {
          http: {
            path: "/gallery/pexels",
            method: "get",
          },
        },
      ],
    },
  },
};
