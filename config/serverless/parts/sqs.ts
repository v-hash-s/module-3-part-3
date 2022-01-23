// import { getEnv } from "../../../helper/environment";
import { AWSPartitial } from "../types";

export const SQSQueueConfig: AWSPartitial = {
  provider: {
    // environment: {
    //   PexelsQueueUrl: {
    //     Ref:
    //       "https://sqs.us-east-1.amazonaws.com/367315594041/pexels_sqs_queue",
    //   },
    // },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["SQS:*"],
            Resource: ["arn:aws:sqs:us-east-1:367315594041:pexels_sqs_queue"],
          },
        ],
      },
    },
  },

  resources: {
    Resources: {
      PexelsQueue: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "pexels_sqs_queue",
          DelaySeconds: 4,
        },
      },
    },
  },
};
