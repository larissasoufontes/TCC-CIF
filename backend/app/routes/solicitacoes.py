
from uuid import UUID

import psycopg2.errors
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import SOMENTE_ADMIN
from app.db import get_conn
from app.schemas.cadastro import (
    DecisaoCadastro,
    SolicitacaoAdministrativa,
)


router = APIRouter(
    prefix='/admin/solicitacoes',
    tags=['Solicitações de cadastro'],
    dependencies=[Depends(SOMENTE_ADMIN)],
)


class DecisaoResposta(BaseModel):
    id: str
    status_acesso: str
    mensagem: str


@router.get('', response_model=list[SolicitacaoAdministrativa])
def listar_solicitacoes():
    """Lista as solicitações para análise do administrador."""

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                SELECT
                    id::text AS id,
                    nome,
                    login AS usuario,
                    email,
                    perfil,
                    instituicao,
                    conselho,
                    registro,
                    especialidade,
                    status_acesso
                FROM solicitacao_cadastro
                ORDER BY
                    CASE
                        WHEN status_acesso = 'pendente' THEN 0
                        ELSE 1
                    END,
                    criado_em DESC
                '''
            )

            return cur.fetchall()


@router.patch(
    '/{solicitacao_id}/decisao',
    response_model=DecisaoResposta,
)
def decidir_solicitacao(
    solicitacao_id: UUID,
    dados: DecisaoCadastro,
    administrador: dict = Depends(SOMENTE_ADMIN),
):
    """Aprova ou rejeita uma solicitação pendente."""

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:

                # Bloqueia a solicitação durante a análise.
                cur.execute(
                    '''
                    SELECT *
                    FROM solicitacao_cadastro
                    WHERE id = %s
                    FOR UPDATE
                    ''',
                    (str(solicitacao_id),),
                )

                solicitacao = cur.fetchone()

                if not solicitacao:
                    raise HTTPException(
                        status_code=404,
                        detail='Solicitação não encontrada.',
                    )

                if solicitacao['status_acesso'] != 'pendente':
                    raise HTTPException(
                        status_code=409,
                        detail='Esta solicitação já foi analisada.',
                    )

                # Rejeição: nenhuma conta é criada.
                if dados.status_acesso == 'rejeitado':
                    cur.execute(
                        '''
                        UPDATE solicitacao_cadastro
                        SET
                            status_acesso = 'rejeitado',
                            analisado_em = NOW(),
                            analisado_por = %s
                        WHERE id = %s
                        ''',
                        (administrador['sub'], str(solicitacao_id)),
                    )

                    return DecisaoResposta(
                        id=str(solicitacao_id),
                        status_acesso='rejeitado',
                        mensagem='Solicitação rejeitada.',
                    )

                # Verifica se o login já pertence a outra conta.
                cur.execute(
                    '''
                    SELECT id
                    FROM usuario
                    WHERE lower(login) = lower(%s)
                    ''',
                    (solicitacao['login'],),
                )

                if cur.fetchone():
                    raise HTTPException(
                        status_code=409,
                        detail='O nome de usuário já está em uso.',
                    )

                profissional_id = None

                # O profissional precisa ter um registro
                # na tabela profissional.
                if solicitacao['perfil'] == 'profissional':
                    cur.execute(
                        '''
                        INSERT INTO profissional (
                            id,
                            nome,
                            conselho_profissional,
                            numero_registro
                        )
                        VALUES (
                            gen_random_uuid(),
                            %s,
                            %s,
                            %s
                        )
                        RETURNING id
                        ''',
                        (
                            solicitacao['nome'],
                            solicitacao['conselho'],
                            solicitacao['registro'],
                        ),
                    )

                    profissional_id = cur.fetchone()['id']

                # A conta só é criada após a aprovação.
                # A senha já deverá estar protegida por hash
                # na tabela de solicitações.
                cur.execute(
                    '''
                    INSERT INTO usuario (
                        login,
                        senha_hash,
                        perfil,
                        profissional_id,
                        ativo
                    )
                    VALUES (%s, %s, %s, %s, TRUE)
                    RETURNING id
                    ''',
                    (
                        solicitacao['login'],
                        solicitacao['senha_hash'],
                        solicitacao['perfil'],
                        profissional_id,
                    ),
                )

                usuario_id = cur.fetchone()['id']

                cur.execute(
                    '''
                    UPDATE solicitacao_cadastro
                    SET
                        status_acesso = 'aprovado',
                        analisado_em = NOW(),
                        analisado_por = %s,
                        usuario_id = %s
                    WHERE id = %s
                    ''',
                    (
                        administrador['sub'],
                        usuario_id,
                        str(solicitacao_id),
                    ),
                )

                return DecisaoResposta(
                    id=str(solicitacao_id),
                    status_acesso='aprovado',
                    mensagem='Solicitação aprovada e conta criada.',
                )

    except psycopg2.errors.UniqueViolation:
        raise HTTPException(
            status_code=409,
            detail='Já existe uma conta com esse login.',
        )
