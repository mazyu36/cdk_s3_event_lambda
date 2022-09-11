import boto3
import logging
import os

logger = logging.getLogger()

# DEBUGにすると実行したSQL文をログに出力する。
logger.setLevel(logging.INFO)

DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']


def handler(event, context):
    # 受信イベントを出力
    logger.info("Receieved event:" + str(event))

    # S3イベントからキーを取り出し
    item_name = event['Records'][0]['s3']['object']['key']
    logger.info(f"Receieved Item Name:{item_name}")

    # ファイル種別と実況時刻を取得
    id, actual_time, *_ = item_name.split('-')

    # DynamoDBからidを元に、最後に処理したファイルの実況時刻を取得する
    table = boto3.resource('dynamodb').Table(DYNAMODB_TABLE_NAME)
    response = table.get_item(Key={"id": id})

    # DynamoDBからItemが取得でき、かつ最後に処理したファイルの実況時刻と現在処理しようとしているファイルの実況時刻が一致する場合
    if 'Item' in response.keys() and response['Item']['ActualTime'] == actual_time:
        # 重複のS3イベントを受信したとして処理をスキップ
        logger.info(f'Received Duplicate S3 Event. FileName:{item_name}')

    # 一致しない場合は新規の処理対象としてバッチ処理を呼び出す。
    else:
        table.put_item(Item={'id': id, 'ActualTime': actual_time})

        # TODO implement ECS TASK RUN
        logger.info(
            f'ECS Task run invoked. FileName:{item_name}, ActualTime:{actual_time}')

    return {
        'status': 'ok'
    }
