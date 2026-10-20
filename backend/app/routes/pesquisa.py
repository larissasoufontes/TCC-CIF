from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import SOMENTE_PESQUISADOR
from app.db import get_conn
from datetime import date

router = APIRouter(
    prefix='/pesquisa',
    tags=['Pesquisa (dados pseudonimizados)'],
    dependencies=[Depends(SOMENTE_PESQUISADOR)],
)


class PacientePesquisa(BaseModel):
    chave: str
    faixa_etaria: str
    total_classificacoes: int


class ClassificacaoPesquisa(BaseModel):
    id: str
    codigo_cif: str
    descricao_pt: str | None = None
    qualificador: int
    data: date


def _faixa_etaria(idade: int) -> str:
    inicio = (idade // 10) * 10
    return f'{inicio}-{inicio + 9}'


# Nunca selecionar nome, id nem observação: o pesquisador só vê a chave.
@router.get('/pacientes', response_model=list[PacientePesquisa])
def listar_pacientes_pesquisa():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                SELECT p.chave_pesquisa AS chave,
                       EXTRACT(YEAR FROM age(CURRENT_DATE, p.data_nascimento))::int AS idade,
                       count(c.id)::int AS total_classificacoes
                FROM paciente p
                LEFT JOIN classificacao_cif c ON c.paciente_id = p.id
                GROUP BY p.id
                ORDER BY p.chave_pesquisa
                '''
            )
            return [
                PacientePesquisa(
                    chave=linha['chave'],
                    faixa_etaria=_faixa_etaria(linha['idade']),
                    total_classificacoes=linha['total_classificacoes'],
                )
                for linha in cur.fetchall()
            ]


@router.get('/pacientes/{chave}', response_model=PacientePesquisa)
def buscar_paciente_pesquisa(chave: str):
    for paciente in listar_pacientes_pesquisa():
        if paciente.chave == chave:
            return paciente
    raise HTTPException(status_code=404, detail='Chave não encontrada')


@router.get('/pacientes/{chave}/classificacoes', response_model=list[ClassificacaoPesquisa])
def listar_classificacoes_pesquisa(chave: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                SELECT c.id::text AS id, c.cif_codigo AS codigo_cif,
                       k.descricao_pt, c.qualificador_generico AS qualificador,
                       c.created_at::date AS data
                FROM paciente p
                JOIN classificacao_cif c ON c.paciente_id = p.id
                LEFT JOIN cif_codigo k ON k.codigo = c.cif_codigo
                WHERE p.chave_pesquisa = %s
                ORDER BY c.created_at DESC
                ''',
                (chave,),
            )
            return cur.fetchall()
