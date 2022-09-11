import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_s3_notifications as s3n } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_events as events } from 'aws-cdk-lib';
import { aws_events_targets as targets } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';

import * as path from 'path';

export class CdkS3EventStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    // S3バケットを作成
    const eventBucket = new s3.Bucket(this, 'EventBucket', {
      accessControl: s3.BucketAccessControl.PRIVATE,
      encryption: s3.BucketEncryption.KMS,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: 'event-bucket-matsudayu-tes',
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(7)
        }
      ]
    })


    // Tableを定義
    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'hogehoge',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Lambda Function 作成
    // 関数を定義
    const lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'controlEcsTaskRun.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda')),
      environment: {
        'DYNAMODB_TABLE_NAME': table.tableName
      },
    })

    // DynamoDBへのREADWRITEの権限をLambdaに付与
    table.grantReadWriteData(lambdaFunction)


    // eventルールを設定
    eventBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaFunction)
    )



  }
}
