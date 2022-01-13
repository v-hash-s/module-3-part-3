import { AWSPartitial } from "../types";

export const TableConfig: AWSPartitial = {
  provider: {
    environment: {},
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:DescribeTable",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:DeleteItem",
              "dynamodb:UpdateItem",
            ],
            Resource: [
              "arn:aws:dynamodb:*:*:table/${file(env.yml):${self:provider.stage}.USERS_TABLE_NAME}",
              "arn:aws:dynamodb:*:*:table/${file(env.yml):${self:provider.stage}.USERS_TABLE_NAME}/index/*",
            ],
          },
        ],
      },
    },
  },

  resources: {
    Resources: {
      galleryTable: {
        DeletionPolicy: "Retain",
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "vs-sls-test-gallery",
          KeySchema: [
            {
              AttributeName: "email",
              KeyType: "HASH",
            },
            {
              AttributeName: "data",
              KeyType: "RANGE",
            },
          ],
          AttributeDefinitions: [
            {
              AttributeName: "email",
              AttributeType: "S",
            },
            {
              AttributeName: "data",
              AttributeType: "S",
            },
            {
              AttributeName: "status",
              AttributeType: "S",
            },
            {
              AttributeName: "image",
              AttributeType: "S",
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "imageIndex",
              KeySchema: [
                {
                  AttributeName: "image",
                  KeyType: "HASH",
                },
                {
                  AttributeName: "status",
                  KeyType: "RANGE",
                },
              ],
              Projection: {
                ProjectionType: "ALL",
              },
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
        },
      },
    },
  },

  custom: {
    tablesNames: {
      GalleryTable: {
        local: "${self:service}-local-gallery",
        dev: "${self:service}-dev-gallery",
        test: "${self:service}-test-gallery",
        prod: "${self:service}-prod-gallery",
      },
    },
  },
};
