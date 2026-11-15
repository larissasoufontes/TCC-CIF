#!/usr/bin/env python3
"""Importa códigos CIF da API da OMS para a tabela `cif_codigo`.

Uso:
  - Defina `DATABASE_URL` no ambiente (Postgres DSN).
  - Defina `WHO_API_URL` ou passe a URL como primeiro argumento.
  - Opcionalmente defina `WHO_API_KEY` para APIs autenticadas.

Exemplo:
  WHO_API_URL="https://icd.who.int/icdapi/v1/search?q=b1301" python import_who_cif.py
"""
import os
import sys
import requests
import psycopg2
import psycopg2.extras


def get_conn():
    dsn = os.getenv('DATABASE_URL')
    if not dsn:
        raise RuntimeError('DATABASE_URL environment variable is not set')
    return psycopg2.connect(dsn)


def normalize_item(item):
    # Tentativas flexíveis de extrair campos conhecidos da resposta WHO
    # Some endpoints return simple strings (uris) instead of dicts
    if not isinstance(item, dict):
        if isinstance(item, str):
            code = item
            descricao = item
            # when the API returns a URI string, don't try to derive a single-letter
            # componente from the 'http' prefix (that caused constraint violations).
            componente = None
            categoria = None
            return code, componente, categoria, descricao
        # fallback for other non-dict items
        return None, None, None, None

    code = item.get('code') or item.get('id') or item.get('identifier')
    # descrição: tenta recuperar versão em pt, pt-BR ou en
    descricao = None
    for key in ('description', 'descricao', 'title', 'label', 'prefLabel', 'name'):
        v = item.get(key)
        if isinstance(v, str) and v.strip():
            descricao = v.strip()
            break
        if isinstance(v, dict):
            descricao = v.get('pt') or v.get('pt-BR') or v.get('pt_BR') or v.get('en') or next(iter(v.values()), None)
            if descricao:
                break
    componente = None
    if code and isinstance(code, str) and len(code) > 0:
        # If the code is actually a full URI (http...), don't derive componente
        # from the URI prefix (e.g. 'h' from 'http...') because that violates
        # DB constraints. Only derive componente from short codes.
        if not code.startswith('http'):
            componente = code[0]
    categoria = item.get('category') or item.get('categoria') or item.get('class')
    return code, componente, categoria, descricao


def upsert_codes(items):
    inserted = 0
    updated = 0
    with get_conn() as conn:
        with conn.cursor() as cur:
            for it in items:
                code, componente, categoria, descricao = normalize_item(it)
                if not code:
                    continue
                cur.execute(
                    """
                    INSERT INTO cif_codigo (codigo, componente, categoria, descricao_pt)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (codigo) DO UPDATE
                    SET componente = EXCLUDED.componente,
                        categoria = EXCLUDED.categoria,
                        descricao_pt = EXCLUDED.descricao_pt
                    RETURNING (xmax = 0) AS inserted
                    """,
                    (code, componente, categoria, descricao),
                )
                res = cur.fetchone()
                if res and res[0]:
                    inserted += 1
                else:
                    updated += 1
        conn.commit()
    return inserted, updated


def get_token():
    client_id = os.getenv('WHO_CLIENT_ID')
    client_secret = os.getenv('WHO_CLIENT_SECRET')
    if not client_id or not client_secret:
        raise RuntimeError('WHO_CLIENT_ID and WHO_CLIENT_SECRET are required')
    token_url = os.getenv(
        'WHO_OAUTH_TOKEN_URL',
        'https://icdaccessmanagement.who.int/connect/token',
    )
    resp = requests.post(token_url, data={
        'grant_type': 'client_credentials',
        'client_id': client_id,
        'client_secret': client_secret,
    })
    resp.raise_for_status()
    return resp.json()['access_token']


def fetch_icf_codes(codes):
    token = get_token()
    base = os.getenv(
        'WHO_ICF_BASE_URL',
        'https://id.who.int/icd/release/11/2026-01/icf',
    ).rstrip('/')
    headers = {
        'Authorization': f'Bearer {token}',
        'API-Version': 'v2',
        'Accept': 'application/json',
        'Accept-Language': 'pt',
    }
    items = []
    for code in codes:
        code = code.strip().lower()
        info = requests.get(
            f'{base}/codeinfo/{code}?flexiblemode=true',
            headers=headers,
        )
        info.raise_for_status()
        code_info = info.json()
        entity = requests.get(code_info['stemId'], headers=headers)
        entity.raise_for_status()
        data = entity.json()
        title = data.get('title', {})
        definition = data.get('definition', {})
        items.append({
            'code': code_info['code'],
            'category': data.get('classKind'),
            'title': title.get('@value') if isinstance(title, dict) else title,
            'description': definition.get('@value') if isinstance(definition, dict) else definition,
        })
    return items


def main():
    icf_codes = os.getenv('WHO_ICF_CODES')
    if icf_codes:
        print(f'Fetching official WHO ICF codes: {icf_codes}')
        items = fetch_icf_codes(icf_codes.split(','))
        if os.getenv('DRY_RUN') and os.getenv('DRY_RUN') != '0':
            for it in items:
                print(normalize_item(it))
            return
        inserted, updated = upsert_codes(items)
        print(f'Inserted: {inserted}, Updated: {updated}')
        return

    who_url = os.getenv('WHO_API_URL')
    if len(sys.argv) > 1:
        who_url = sys.argv[1]
    if not who_url:
        print('Provide WHO API URL via WHO_API_URL env or as first argument')
        sys.exit(1)

    # WHO API requires API-Version header and prefers JSON
    headers = {'API-Version': 'v2', 'Accept': 'application/json'}
    # Content language header is required by the ICD API; prefer Portuguese if requested
    lang = 'pt' if (who_url and 'language=pt' in who_url) else 'en'
    headers['Accept-Language'] = lang
    # Support either a direct API key (WHO_API_KEY) or OAuth2 client credentials
    api_key = os.getenv('WHO_API_KEY')
    if api_key:
        headers['Authorization'] = f'Bearer {api_key}'
    else:
        # Try client credentials flow if provided
        client_id = os.getenv('WHO_CLIENT_ID')
        client_secret = os.getenv('WHO_CLIENT_SECRET')
        if client_id and client_secret:
            token_url = os.getenv('WHO_OAUTH_TOKEN_URL', 'https://icdaccessmanagement.who.int/connect/token')
            print('Requesting OAuth2 token from', token_url)
            resp = requests.post(token_url, data={
                'grant_type': 'client_credentials',
                'client_id': client_id,
                'client_secret': client_secret,
            })
            resp.raise_for_status()
            token_data = resp.json()
            access_token = token_data.get('access_token')
            if not access_token:
                print('Failed to obtain access_token from token endpoint')
                print(token_data)
                sys.exit(1)
            headers['Authorization'] = f'Bearer {access_token}'

    print('Fetching from', who_url)
    r = requests.get(who_url, headers=headers)
    r.raise_for_status()
    data = r.json()
    # A resposta pode estar em diferentes formatos; tentar localizar a lista de itens
    if isinstance(data, dict):
        # possíveis chaves: 'results', 'items', 'response', or ICD search 'destinationEntities'
        for k in ('results', 'items', 'entry', 'rows', 'destinationEntities'):
            if k in data and isinstance(data[k], (list, tuple)):
                items = data[k]
                break
        else:
            # se for map de códigos por id
            items = []
            for v in data.values():
                if isinstance(v, list):
                    items = v
                    break
    elif isinstance(data, list):
        items = data
    else:
        print('Unexpected WHO API response format')
        sys.exit(1)

    if not items:
        print('No items found in WHO response')
        sys.exit(0)

    dry = os.getenv('DRY_RUN')
    print(f'Found {len(items)} items.')
    if dry and dry != '0':
        print('DRY_RUN enabled — showing first 10 normalized items:')
        for it in items[:10]:
            code, componente, categoria, descricao = normalize_item(it)
            print({'codigo': code, 'componente': componente, 'categoria': categoria, 'descricao_pt': descricao})
        return

    inserted, updated = upsert_codes(items)
    print(f'Inserted: {inserted}, Updated: {updated}')


if __name__ == '__main__':
    main()
