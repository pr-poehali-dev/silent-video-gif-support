import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: dict, context) -> dict:
    '''Управление постами: список, создание, удаление. Кнопки-ссылки внутри постов.'''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
        'Access-Control-Max-Age': '86400',
    }
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    sch = os.environ.get('MAIN_DB_SCHEMA', 'public')
    with conn.cursor() as c:
        c.execute(
            f"CREATE TABLE IF NOT EXISTS {sch}.posts ("
            "id SERIAL PRIMARY KEY, title VARCHAR(255) DEFAULT '', body_text TEXT DEFAULT '', "
            "media_type VARCHAR(20) NOT NULL DEFAULT 'photo', media_url TEXT DEFAULT '', "
            "video_sound BOOLEAN DEFAULT TRUE, likes INTEGER DEFAULT 0, "
            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
        )
        c.execute(
            f"CREATE TABLE IF NOT EXISTS {sch}.post_buttons ("
            "id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL, label VARCHAR(255) NOT NULL DEFAULT '', "
            "url TEXT NOT NULL DEFAULT '', image_url TEXT DEFAULT '', sort_order INTEGER DEFAULT 0)"
        )
        c.execute(
            f"CREATE TABLE IF NOT EXISTS {sch}.comments ("
            "id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL, author VARCHAR(100) DEFAULT 'Guest', "
            "body_text TEXT NOT NULL DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
        )

    try:
        if method == 'GET':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, title, body_text, media_type, media_url, video_sound, likes, "
                    f"to_char(created_at, 'DD.MM.YYYY HH24:MI') AS created_at FROM {sch}.posts ORDER BY created_at DESC"
                )
                posts = cur.fetchall()
                if posts:
                    ids = tuple(p['id'] for p in posts)
                    cur.execute(
                        f"SELECT id, post_id, label, url, image_url FROM {sch}.post_buttons "
                        "WHERE post_id IN %s ORDER BY sort_order, id",
                        (ids,),
                    )
                    buttons = cur.fetchall()
                    cur.execute(
                        f"SELECT post_id, COUNT(*) AS cnt FROM {sch}.comments WHERE post_id IN %s GROUP BY post_id",
                        (ids,),
                    )
                    counts = {r['post_id']: r['cnt'] for r in cur.fetchall()}
                    for p in posts:
                        p['buttons'] = [b for b in buttons if b['post_id'] == p['id']]
                        p['comment_count'] = counts.get(p['id'], 0)
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'posts': posts}, default=str)}

        if method == 'POST':
            admin = os.environ.get('ADMIN_PASSWORD', '')
            given = event.get('headers', {}).get('X-Admin-Password') or event.get('headers', {}).get('x-admin-password')
            if not admin or given != admin:
                return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'forbidden'})}
            body = json.loads(event.get('body') or '{}')
            title = body.get('title', '')
            text = body.get('text', '')
            media_type = body.get('media_type', 'photo')
            media_url = body.get('media_url', '')
            video_sound = bool(body.get('video_sound', True))
            buttons = body.get('buttons', [])
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"INSERT INTO {sch}.posts (title, body_text, media_type, media_url, video_sound) "
                    "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                    (title, text, media_type, media_url, video_sound),
                )
                post_id = cur.fetchone()['id']
                for i, b in enumerate(buttons):
                    cur.execute(
                        f"INSERT INTO {sch}.post_buttons (post_id, label, url, image_url, sort_order) "
                        "VALUES (%s, %s, %s, %s, %s)",
                        (post_id, b.get('label', ''), b.get('url', ''), b.get('image_url', ''), i),
                    )
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': post_id})}

        if method == 'DELETE':
            admin = os.environ.get('ADMIN_PASSWORD', '')
            given = event.get('headers', {}).get('X-Admin-Password') or event.get('headers', {}).get('x-admin-password')
            if not admin or given != admin:
                return {'statusCode': 403, 'headers': cors, 'body': json.dumps({'error': 'forbidden'})}
            params = event.get('queryStringParameters') or {}
            post_id = int(params.get('id', 0))
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {sch}.post_buttons WHERE post_id = %s", (post_id,))
                cur.execute(f"DELETE FROM {sch}.comments WHERE post_id = %s", (post_id,))
                cur.execute(f"DELETE FROM {sch}.posts WHERE id = %s", (post_id,))
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'method not allowed'})}
    finally:
        conn.close()