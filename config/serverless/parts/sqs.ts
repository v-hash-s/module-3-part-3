import { AWSPartitial } from "../types";

export const SQSQueueConfig: AWSPartitial = {
  provider: {
    environment: {
      PexelsQueueUrl: {
        Ref: "PexelsQueue",
      },
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["sqs:*"],
            Resource: [
              "arn:aws:sqs:::${file(env.yml):${self:provider.stage}.SQS_QUEUE}",
            ],
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
          QueueName: "sqs_queue",
          DelaySeconds: 4,
        },
      },
    },
  },
};
