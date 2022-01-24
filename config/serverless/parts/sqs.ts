// import { getEnv } from "../../../helper/environment";
import { AWSPartitial } from "../types";
import { GetAtt, Ref, Sub } from "../cf-intristic-fn";

export const SQSQueueConfig: AWSPartitial = {
  provider: {
    environment: {
      SQS_QUEUE: "${self:custom.sqsInfo.sqsName.${self:provider.stage}}",
      SQS_QUEUE_URL: "${self:custom.sqsInfo.sqsURL.${self:provider.stage}}",
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["SQS:*"],
            Resource: [GetAtt("PexelsQueue.Arn")],
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
          QueueName: "${self:custom.sqsInfo.sqsName.${self:provider.stage}}",
          DelaySeconds: 4,
        },
      },
    },
  },
  custom: {
    sqsInfo: {
      sqsName: {
        local: Sub("${self:service}-local-pexels_sqs_queue"),
        dev: Sub("${self:service}-dev-pexels_sqs_queue"),
        test: Sub("${self:service}-test-pexels_sqs_queue"),
        prod: Sub("${self:service}-prod-pexels_sqs_queue"),
      },
      sqsURL: {
        prod: Sub(
          "https://${resourceName}.${region}.${suffix}/${accountId}/${path}",
          {
            resourceName: "sqs",
            region: Ref("AWS::Region"),
            suffix: Ref("AWS::URLSuffix"),
            accountId: Ref("AWS::AccountId"),
            path: "${self:custom.sqsInfo.sqsName.${self:provider.stage}}",
          }
        ),
      },
    },
  },
};
