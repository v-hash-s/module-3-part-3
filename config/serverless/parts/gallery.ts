import { AWSPartitial } from "../types";

export const galleryConfig: AWSPartitial = {
  functions: {
    jwtauth: {
      handler: "api/auth/authorizer.authenticationJWT",
      memorySize: 128,
    },

    // saveSubclipToDynamo: {
    //   handler: "api/gallery/handler.saveSubclipToDynamo",
    //   memorySize: 256,
    //   events: [
    //     {
    //       s3: {
    //         bucket: "vs-sls-prod-gallerys3-subclip",
    //         event: "s3:ObjectCreated:*",
    //         existing: true,
    //       },
    //     },
    //   ],
    // },

    getGallery: {
      handler: "api/gallery/handler.getGallery",
      memorySize: 128,
      events: [
        {
          http: {
            path: "/gallery",
            method: "get",
            response: {
              headers: {
                "Access-Control-Allow-Credentials": "*",
              },
            },
            cors: true,
            authorizer: {
              name: "jwtauth",
              type: "request",
            },
          },
        },
      ],
    },

    updateStatus: {
      handler: "api/gallery/handler.updateStatus",
      memorySize: 256,
      events: [
        {
          s3: {
            bucket: "vs-sls-prod-gallerys3",
            event: "s3:ObjectCreated:*",
            existing: true,
          },
        },
      ],
    },

    getPresignedUrl: {
      handler: "api/gallery/handler.getPresignedUrl",
      memorySize: 128,
      events: [
        {
          http: {
            path: "/upload",
            method: "post",
            response: {
              headers: {
                "Access-Control-Allow-Credentials": "*",
              },
            },
            authorizer: {
              name: "jwtauth",
              type: "request",
            },
          },
        },
      ],
    },
  },
};
