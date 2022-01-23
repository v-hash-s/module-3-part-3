import { AWSPartitial } from "../types";

export const BucketSubclipConfig: AWSPartitial = {
  provider: {
    environment: {
      IMAGES_BUCKET_NAME_SUBCLIP:
        "${self:custom.bucketsNames.ImageBucket.${self:provider.stage}}",
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: [
              "s3:CreateBucket",
              "s3:ListBuckets",
              "s3:GetBucketCors",
              "s3:GetBucket",
              "s3:GetObject",
              "s3:GetObjectAcl",
              "s3:PutObject",
              "s3:PutObjectAcl",
            ],
            Resource: [
              "arn:aws:s3:::${file(env.yml):${self:provider.stage}.IMAGES_BUCKET_NAME_SUBCLIP}",
              "arn:aws:s3:::${file(env.yml):${self:provider.stage}.IMAGES_BUCKET_NAME_SUBCLIP}/*",
            ],
          },
        ],
      },
    },
  },
  resources: {
    Resources: {
      imagesBucketSubclip: {
        Type: "AWS::S3::Bucket",
        DeletionPolicy: "Delete",
        Properties: {
          AccessControl: "PublicReadWrite",
          BucketName:
            "${file(env.yml):${self:provider.stage}.IMAGES_BUCKET_NAME_SUBCLIP}",
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "HEAD", "POST", "DELETE"],
                AllowedOrigins: ["*"],
              },
            ],
          },
        },
      },
    },
  },
  custom: {
    bucketsNames: {
      ImageBucket: {
        local: "${self:service}-local-gallerys3-subclip",
        dev: "${self:service}-dev-gallerys3-subclip",
        test: "${self:service}-test-gallerys3-subclip",
        prod: "${self:service}-prod-gallerys3-subclip",
      },
    },
  },
};
