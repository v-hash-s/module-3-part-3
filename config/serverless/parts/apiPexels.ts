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

    saveImagesSubclip: {
      handler: "api/apiPexels/handler.saveImagesSubclip",
      memorySize: 128,
      events: [
        {
          s3: {
            bucket: "vs-sls-test-gallerys3",
            event: "s3:ObjectCreated:*",
            existing: true,
          },
        },
      ],
    },

    postPexelsPhotos: {
      handler: "api/apiPexels/handler.postPexelsPhotos",
      memorySize: 128,
      events: [
        {
          http: {
            path: "/gallery/pexels",
            method: "post",
          },
        },
      ],
    },
  },
};
