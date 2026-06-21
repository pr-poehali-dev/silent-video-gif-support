import json
import os
import base64
import uuid
import boto3


def handler(event: dict, context) -> dict:
    '''Загрузка медиафайлов (фото, видео, GIF, картинки кнопок) в S3-хранилище.'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
        'Access-Control-Max-Age': '86400',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}
    if method != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'method not allowed'})}

    admin = os.environ.get('ADMIN_PASSWORD', '')
    given = event.get('headers', {}).get('X-Admin-Password') or event.get('headers', {}).get('x-admin-password')
    if not admin or given != admin:
        return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'forbidden'})}

    body = json.loads(event.get('body') or '{}')
    data_b64 = body.get('data', '')
    filename = body.get('filename', 'file')
    content_type = body.get('content_type', 'application/octet-stream')
    if ',' in data_b64 and data_b64.strip().startswith('data:'):
        data_b64 = data_b64.split(',', 1)[1]
    raw = base64.b64decode(data_b64)

    ext = ''
    if '.' in filename:
        ext = '.' + filename.rsplit('.', 1)[1].lower()
    key = f"media/{uuid.uuid4().hex}{ext}"

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=content_type)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'url': cdn_url})}
