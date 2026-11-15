import os

import psycopg2
import psycopg2.extras


def get_conn():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise RuntimeError('DATABASE_URL environment variable is not set')
    if os.name == 'nt':
        os.environ.setdefault('PGCLIENTENCODING', 'WIN1252')
    return psycopg2.connect(
        database_url,
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
