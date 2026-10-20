import time
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.auth import HASH_FALSO, criar_token, verificar_senha
from app.db import get_conn

router = APIRouter(prefix='/auth', tags=['Autenticação'])

MAX_FALHAS = 5
JANELA_SEGUNDOS = 300
_falhas: dict[str, list[float]] = {}


class LoginRequest(BaseModel):
    login: str = Field(min_length=1, max_length=120)
    senha: str = Field(min_length=1, max_length=200)
    perfil: Literal['profissional', 'pesquisador', 'administrador']


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    perfil: str
    nome: str


def _falhas_recentes(chave: str) -> list[float]:
    limite = time.time() - JANELA_SEGUNDOS
    recentes = [t for t in _falhas.get(chave, []) if t > limite]
    _falhas[chave] = recentes
    return recentes


@router.post('/login', response_model=TokenResponse)
def entrar(dados: LoginRequest):
    chave = dados.login.strip().lower()
    if len(_falhas_recentes(chave)) >= MAX_FALHAS:
        raise HTTPException(
            status_code=429,
            detail='Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        )

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                SELECT u.id::text AS id, u.login, u.senha_hash, u.perfil,
                       u.profissional_id::text AS profissional_id,
                       p.nome AS nome_profissional
                FROM usuario u
                LEFT JOIN profissional p ON p.id = u.profissional_id
                WHERE lower(u.login) = %s AND u.ativo
                ''',
                (chave,),
            )
            usuario = cur.fetchone()

    senha_correta = verificar_senha(
        dados.senha, usuario['senha_hash'] if usuario else HASH_FALSO
    )
    if not usuario or not senha_correta or usuario['perfil'] != dados.perfil:
        _falhas.setdefault(chave, []).append(time.time())
        raise HTTPException(status_code=401, detail='Login, senha ou perfil incorretos')

    _falhas.pop(chave, None)
    return TokenResponse(
        access_token=criar_token(usuario['id'], usuario['perfil'], usuario['profissional_id']),
        perfil=usuario['perfil'],
        nome=usuario['nome_profissional'] or usuario['login'],
    )
