
import os

import psycopg2
from fastapi import APIRouter, HTTPException, status

from app.auth import gerar_hash
from app.db import get_conn
from app.schemas.cadastro import (
    CadastroResposta,
    CadastroSolicitacao,
)

router = APIRouter(
    prefix='/auth',
    tags=['Cadastro de usuários'],
)


@router.post(
    '/cadastro',
    response_model=CadastroResposta,
    status_code=status.HTTP_202_ACCEPTED,
)
def solicitar_cadastro(dados: CadastroSolicitacao):
    """
    Recebe solicitações de cadastro de profissionais
    de saúde e pesquisadores.

    As solicitações ficam pendentes até serem
    analisadas por um administrador.
    """

    # A gravação permanece desativada até a Larissa
    # aplicar e validar a migração do banco.
    if os.getenv('CADASTRO_PERSISTENCIA_ATIVA') != 'true':
        raise HTTPException(
            status_code=503,
            detail=(
                'O recebimento de cadastros ainda não está '
                'habilitado. Nenhuma solicitação foi salva.'
            ),
        )

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:

                # Impede solicitar um login já existente.
                cur.execute(
                    '''
                    SELECT id
                    FROM usuario
                    WHERE lower(login) = lower(%s)
                    ''',
                    (dados.usuario,),
                )

                if cur.fetchone():
                    raise HTTPException(
                        status_code=409,
                        detail='Este nome de usuário já está em uso.',
                    )

                # Verifica solicitações ainda pendentes.
                cur.execute(
                    '''
                    SELECT id
                    FROM solicitacao_cadastro
                    WHERE status_acesso = 'pendente'
                      AND (
                          lower(login) = lower(%s)
                          OR lower(email) = lower(%s)
                      )
                    ''',
                    (dados.usuario, str(dados.email)),
                )

                if cur.fetchone():
                    raise HTTPException(
                        status_code=409,
                        detail=(
                            'Já existe uma solicitação pendente '
                            'para este usuário ou e-mail.'
                        ),
                    )

                # Nunca armazena a senha original.
                senha_hash = gerar_hash(dados.senha)

                cur.execute(
                    '''
                    INSERT INTO solicitacao_cadastro (
                        login,
                        email,
                        senha_hash,
                        nome,
                        perfil,
                        instituicao,
                        conselho,
                        registro,
                        especialidade,
                        status_acesso
                    )
                    VALUES (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, 'pendente'
                    )
                    ''',
                    (
                        dados.usuario,
                        str(dados.email),
                        senha_hash,
                        dados.nome,
                        dados.perfil,
                        dados.instituicao,
                        dados.conselho,
                        dados.registro,
                        dados.especialidade,
                    ),
                )

        return CadastroResposta(
            mensagem='Solicitação recebida com sucesso.',
            status_acesso='pendente',
        )

    except psycopg2.errors.UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail='Usuário ou e-mail já possui solicitação pendente.',
        )

    except psycopg2.Error:
        raise HTTPException(
            status_code=503,
            detail=(
                'O banco de dados não está disponível '
                'para receber cadastros neste momento.'
            ),
        )

    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail='A conexão com o banco ainda não está configurada.',
        )
