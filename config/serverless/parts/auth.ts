import { AWSPartitial } from "../types";

export const authConfig: AWSPartitial = {
  provider: {
    httpApi: {
      authorizers: {
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
    jwtauth: {
      handler: "api/auth/authorizer.authenticationJWT",
      memorySize: 128,
    },

    login: {
      handler: "api/auth/handler.login",
      memorySize: 128,
      events: [
        {
          http: {
            path: "/",
            method: "post",
            response: {
              headers: {
                "Access-Control-Allow-Credentials": "*",
              },
            },
          },
        },
      ],
    },

    signUp: {
      handler: "api/auth/handler.signUp",
      memorySize: 128,
      events: [
        {
          http: {
            path: "/signup",
            method: "post",
            response: {
              headers: {
                "Access-Control-Allow-Credentials": "*",
              },
            },
          },
        },
      ],
    },
  },
};
