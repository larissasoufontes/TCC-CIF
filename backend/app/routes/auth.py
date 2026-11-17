import hashlib
import logging
import os
import secrets
import smtplib
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Literal
from urllib.parse import quote

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.auth import HASH_FALSO, criar_token, gerar_hash, verificar_senha
from app.db import get_conn

router = APIRouter(prefix='/auth', tags=['Autenticação'])

MAX_FALHAS = 5
JANELA_SEGUNDOS = 300
_falhas: dict[str, list[float]] = {}
_solicitacoes_reset: dict[str, list[float]] = {}


class RecuperacaoSenhaRequest(BaseModel):
    email: EmailStr


class RedefinirSenhaRequest(BaseModel):
    token: str = Field(min_length=30, max_length=256)
    senha: str = Field(min_length=8, max_length=200)


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


def _solicitacoes_recentes(chave: str) -> list[float]:
    limite = time.time() - 900
    recentes = [t for t in _solicitacoes_reset.get(chave, []) if t > limite]
    _solicitacoes_reset[chave] = recentes
    return recentes


def _enviar_link_redefinicao(destino: str, token: str) -> None:
    host = os.getenv('SMTP_HOST')
    remetente = os.getenv('SMTP_FROM_EMAIL')
    if not host or not remetente:
        raise RuntimeError('SMTP não configurado')

    url_base = os.getenv('FRONTEND_URL', 'http://127.0.0.1:8000').rstrip('/')
    link = f'{url_base}/recuperar-senha#token={quote(token)}'
    mensagem = EmailMessage()
    mensagem['Subject'] = 'Redefinição de senha - Sistema CIF'
    mensagem['From'] = remetente
    mensagem['To'] = destino
    mensagem.set_content(
        'Recebemos uma solicitação para redefinir sua senha. '
        f'Acesse o link abaixo em até 30 minutos:\n\n{link}\n\n'
        'Se você não solicitou a redefinição, ignore esta mensagem.'
    )

    porta = int(os.getenv('SMTP_PORT', '587'))
    usar_tls = os.getenv('SMTP_USE_TLS', 'true').strip().lower() not in {
        '0', 'false', 'nao', 'não',
    }
    with smtplib.SMTP(host, porta, timeout=15) as servidor:
        if usar_tls:
            servidor.starttls()
        usuario_smtp = os.getenv('SMTP_USERNAME')
        senha_smtp = os.getenv('SMTP_PASSWORD')
        if usuario_smtp:
            servidor.login(usuario_smtp, senha_smtp or '')
        servidor.send_message(mensagem)


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


@router.post('/esqueci-senha', status_code=202)
def solicitar_redefinicao_senha(dados: RecuperacaoSenhaRequest):
    email = str(dados.email).strip().lower()
    recentes = _solicitacoes_recentes(email)
    if len(recentes) >= 3:
        raise HTTPException(
            status_code=429,
            detail='Muitas solicitações. Aguarde alguns minutos e tente novamente.',
        )
    _solicitacoes_reset.setdefault(email, []).append(time.time())

    if not os.getenv('SMTP_HOST') or not os.getenv('SMTP_FROM_EMAIL'):
        raise HTTPException(
            status_code=503,
            detail='A recuperação por e-mail ainda não está configurada.',
        )

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM password_reset_token WHERE expires_at <= now()')
            cur.execute(
                'SELECT id::text AS id FROM usuario WHERE lower(email) = %s AND ativo',
                (email,),
            )
            usuario = cur.fetchone()

    if usuario:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'DELETE FROM password_reset_token WHERE usuario_id = %s',
                    (usuario['id'],),
                )
                cur.execute(
                    '''
                    INSERT INTO password_reset_token (usuario_id, token_hash, expires_at)
                    VALUES (%s, %s, %s)
                    ''',
                    (
                        usuario['id'],
                        token_hash,
                        datetime.now(timezone.utc) + timedelta(minutes=30),
                    ),
                )
        try:
            _enviar_link_redefinicao(email, token)
        except (OSError, ValueError, smtplib.SMTPException, RuntimeError):
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        'DELETE FROM password_reset_token WHERE token_hash = %s',
                        (token_hash,),
                    )
            logging.getLogger(__name__).exception(
                'Falha ao enviar e-mail de recuperação de senha'
            )

    return {'mensagem': 'Se o e-mail estiver cadastrado, enviaremos instruções.'}


@router.post('/redefinir-senha')
def redefinir_senha(dados: RedefinirSenhaRequest):
    token_hash = hashlib.sha256(dados.token.encode('utf-8')).hexdigest()
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                SELECT token.usuario_id::text AS usuario_id
                FROM password_reset_token token
                JOIN usuario ON usuario.id = token.usuario_id AND usuario.ativo
                WHERE token.token_hash = %s AND token.expires_at > now()
                FOR UPDATE OF token
                ''',
                (token_hash,),
            )
            recuperacao = cur.fetchone()
            if not recuperacao:
                raise HTTPException(
                    status_code=400,
                    detail='Link inválido ou expirado. Solicite uma nova recuperação.',
                )

            cur.execute(
                'UPDATE usuario SET senha_hash = %s WHERE id = %s',
                (gerar_hash(dados.senha), recuperacao['usuario_id']),
            )
            cur.execute(
                'DELETE FROM password_reset_token WHERE usuario_id = %s',
                (recuperacao['usuario_id'],),
            )

    return {'mensagem': 'Senha redefinida com sucesso.'}
