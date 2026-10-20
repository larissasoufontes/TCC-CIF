from typing import Literal
from uuid import UUID

import psycopg2.errors
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator

from app.auth import SOMENTE_ADMIN, gerar_hash
from app.db import get_conn

router = APIRouter(
    prefix='/admin/usuarios',
    tags=['Administração de usuários'],
    dependencies=[Depends(SOMENTE_ADMIN)],
)


class UsuarioCreate(BaseModel):
    login: str = Field(min_length=3, max_length=60, pattern=r'^[A-Za-z0-9._-]+$')
    senha: str = Field(min_length=8, max_length=200)
    perfil: Literal['profissional', 'pesquisador', 'administrador']
    nome: str | None = Field(default=None, max_length=200)
    conselho: str | None = Field(default=None, max_length=120)
    registro: str | None = Field(default=None, max_length=80)

    @model_validator(mode='after')
    def exigir_dados_do_profissional(self):
        if self.perfil == 'profissional' and not (
            self.nome and self.nome.strip()
            and self.conselho and self.conselho.strip()
            and self.registro and self.registro.strip()
        ):
            raise ValueError('Profissional exige nome, conselho e número de registro')
        return self


class AtivoUpdate(BaseModel):
    ativo: bool


class SenhaUpdate(BaseModel):
    senha: str = Field(min_length=8, max_length=200)


class UsuarioResponse(BaseModel):
    id: str
    login: str
    perfil: str
    nome: str | None
    ativo: bool


CONSULTA = '''
    SELECT u.id::text AS id, u.login, u.perfil, p.nome, u.ativo
    FROM usuario u
    LEFT JOIN profissional p ON p.id = u.profissional_id
'''


@router.get('', response_model=list[UsuarioResponse])
def listar_usuarios():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(CONSULTA + ' ORDER BY u.perfil, lower(u.login)')
            return cur.fetchall()


@router.post('', response_model=UsuarioResponse, status_code=201)
def criar_usuario(dados: UsuarioCreate):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                profissional_id = None
                if dados.perfil == 'profissional':
                    cur.execute(
                        '''
                        INSERT INTO profissional (id, nome, conselho_profissional, numero_registro)
                        VALUES (gen_random_uuid(), %s, %s, %s) RETURNING id::text AS id
                        ''',
                        (dados.nome.strip(), dados.conselho.strip(), dados.registro.strip()),
                    )
                    profissional_id = cur.fetchone()['id']

                cur.execute(
                    '''
                    INSERT INTO usuario (login, senha_hash, perfil, profissional_id)
                    VALUES (%s, %s, %s, %s) RETURNING id::text AS id
                    ''',
                    (dados.login, gerar_hash(dados.senha), dados.perfil, profissional_id),
                )
                novo_id = cur.fetchone()['id']
                cur.execute(CONSULTA + ' WHERE u.id = %s', (novo_id,))
                return cur.fetchone()
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail='Já existe um usuário com esse login')


@router.patch('/{usuario_id}/ativo', response_model=UsuarioResponse)
def alterar_ativo(
    usuario_id: UUID,
    dados: AtivoUpdate,
    atual: dict = Depends(SOMENTE_ADMIN),
):
    if str(usuario_id) == atual['sub'] and not dados.ativo:
        raise HTTPException(status_code=400, detail='Você não pode desativar a própria conta')

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE usuario SET ativo = %s WHERE id = %s',
                (dados.ativo, str(usuario_id)),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail='Usuário não encontrado')
            cur.execute(CONSULTA + ' WHERE u.id = %s', (str(usuario_id),))
            return cur.fetchone()


@router.put('/{usuario_id}/senha', status_code=204)
def redefinir_senha(usuario_id: UUID, dados: SenhaUpdate):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE usuario SET senha_hash = %s WHERE id = %s',
                (gerar_hash(dados.senha), str(usuario_id)),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail='Usuário não encontrado')
