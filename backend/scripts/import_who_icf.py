import os
import sys

import requests

from app.db import get_conn


TOKEN_URL = os.getenv(
    'WHO_OAUTH_TOKEN_URL',
    'https://icdaccessmanagement.who.int/connect/token',
)
ICF_BASE_URL = os.getenv(
    'WHO_ICF_BASE_URL',
    'https://id.who.int/icd/release/11/2026-01/icf',
).rstrip('/')


def token():
    response = requests.post(TOKEN_URL, data={
        'grant_type': 'client_credentials',
        'client_id': os.environ['WHO_CLIENT_ID'],
        'client_secret': os.environ['WHO_CLIENT_SECRET'],
    })
    response.raise_for_status()
    return response.json()['access_token']


def load(codes):
    headers = {
        'Authorization': f'Bearer {token()}',
        'API-Version': 'v2',
        'Accept': 'application/json',
        'Accept-Language': 'pt',
    }
    items = []
    for code in codes:
        code = code.strip().lower()
        info = requests.get(
            f'{ICF_BASE_URL}/codeinfo/{code}?flexiblemode=true',
            headers=headers,
        )
        info.raise_for_status()
        entity = requests.get(info.json()['stemId'], headers=headers)
        entity.raise_for_status()
        data = entity.json()
        title = data.get('title', {})
        definition = data.get('definition', {})
        items.append((
            data['code'],
            data['code'][0],
            data.get('classKind'),
            definition.get('@value') if isinstance(definition, dict) else definition,
        ))

    with get_conn() as conn:
        with conn.cursor() as cursor:
            for item in items:
                cursor.execute(
                    '''
                    INSERT INTO cif_codigo (codigo, componente, categoria, descricao_pt)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (codigo) DO UPDATE SET
                        componente = EXCLUDED.componente,
                        categoria = EXCLUDED.categoria,
                        descricao_pt = EXCLUDED.descricao_pt
                    ''',
                    item,
                )
        conn.commit()
    print(f'Loaded {len(items)} official ICF codes')


if __name__ == '__main__':
    configured_codes = os.getenv('WHO_ICF_CODES') or ','.join(sys.argv[1:])
    if not configured_codes:
        raise SystemExit('Set WHO_ICF_CODES or pass codes such as d450,b1301')
    load(configured_codes.split(','))
