import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: dict, context) -> dict:
    '''Лайки и комментарии к постам без регистрации.'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    sch = os.environ.get('MAIN_DB_SCHEMA', 'public')

    try:
        params = event.get('queryStringParameters') or {}
        action = params.get('action', '')

        if method == 'GET' and action == 'comments':
            post_id = int(params.get('post_id', 0))
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, author, body_text, to_char(created_at, 'DD.MM.YYYY HH24:MI') AS created_at "
                    f"FROM {sch}.comments WHERE post_id = %s ORDER BY created_at DESC",
                    (post_id,),
                )
                rows = cur.fetchall()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'comments': rows}, default=str)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            act = body.get('action', '')
            post_id = int(body.get('post_id', 0))

            if act == 'like':
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"UPDATE {sch}.posts SET likes = likes + 1 WHERE id = %s RETURNING likes", (post_id,))
                    row = cur.fetchone()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'likes': row['likes'] if row else 0})}

            if act == 'comment':
                author = (body.get('author') or 'Гость')[:100]
                text = (body.get('text') or '').strip()
                if not text:
                    return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'empty'})}
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f"INSERT INTO {sch}.comments (post_id, author, body_text) VALUES (%s, %s, %s) "
                        "RETURNING id, author, body_text, to_char(created_at, 'DD.MM.YYYY HH24:MI') AS created_at",
                        (post_id, author, text),
                    )
                    row = cur.fetchone()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'comment': row}, default=str)}

        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'bad request'})}
    finally:
        conn.close()