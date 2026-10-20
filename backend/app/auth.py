import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db import get_conn

# Sem AUTH_SECRET definido, os tokens deixam de valer a cada reinício da API.
SEGREDO = os.getenv('AUTH_SECRET') or secrets.token_urlsafe(48)
VALIDADE_HORAS = 8
ALGORITMO = 'HS256'

_bearer = HTTPBearer(auto_error=False)


def _b64(dados: bytes) -> str:
    return base64.b64encode(dados).decode('ascii')


def gerar_hash(senha: str) -> str:
    sal = secrets.token_bytes(16)
    derivado = hashlib.scrypt(senha.encode('utf-8'), salt=sal, n=2**14, r=8, p=1, dklen=32)
    return f'scrypt${_b64(sal)}${_b64(derivado)}'


def verificar_senha(senha: str, armazenado: str) -> bool:
    try:
        _, sal_b64, hash_b64 = armazenado.split('$')
        sal = base64.b64decode(sal_b64)
        esperado = base64.b64decode(hash_b64)
    except ValueError:
        return False
    derivado = hashlib.scrypt(senha.encode('utf-8'), salt=sal, n=2**14, r=8, p=1, dklen=32)
    return hmac.compare_digest(derivado, esperado)


# Usado quando o login não existe, para o tempo de resposta não revelar isso.
HASH_FALSO = gerar_hash(secrets.token_urlsafe(16))


def criar_token(usuario_id: str, perfil: str, profissional_id: str | None) -> str:
    expira = datetime.now(timezone.utc) + timedelta(hours=VALIDADE_HORAS)
    return jwt.encode(
        {
            'sub': usuario_id,
            'perfil': perfil,
            'profissional_id': profissional_id,
            'exp': expira,
        },
        SEGREDO,
        algorithm=ALGORITMO,
    )


def exigir_perfil(*perfis: str):
    def dependencia(
        credenciais: HTTPAuthorizationCredentials | None = Depends(_bearer),
    ) -> dict:
        if credenciais is None:
            raise HTTPException(
                status_code=401,
                detail='Autenticação necessária',
                headers={'WWW-Authenticate': 'Bearer'},
            )
        try:
            dados = jwt.decode(credenciais.credentials, SEGREDO, algorithms=[ALGORITMO])
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=401,
                detail='Sessão inválida ou expirada',
                headers={'WWW-Authenticate': 'Bearer'},
            )
        # O banco é a fonte da verdade: conta desativada perde o acesso na hora.
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'SELECT perfil, ativo FROM usuario WHERE id = %s', (dados['sub'],)
                )
                atual = cur.fetchone()
        if not atual or not atual['ativo']:
            raise HTTPException(
                status_code=401,
                detail='Conta desativada ou inexistente',
                headers={'WWW-Authenticate': 'Bearer'},
            )
        if atual['perfil'] not in perfis:
            raise HTTPException(status_code=403, detail='Acesso não permitido para este perfil')
        dados['perfil'] = atual['perfil']
        return dados

    return dependencia


SOMENTE_PROFISSIONAL = exigir_perfil('profissional')
SOMENTE_PESQUISADOR = exigir_perfil('pesquisador')
SOMENTE_ADMIN = exigir_perfil('administrador')
QUALQUER_PERFIL = exigir_perfil('profissional', 'pesquisador')
