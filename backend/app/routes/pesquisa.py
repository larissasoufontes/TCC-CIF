from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
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


class ExportacaoPesquisa(BaseModel):
    chave: str
    faixa_etaria: str
    codigo_cif: str
    descricao_pt: str | None = None
    qualificador: int
    data: date
    relacoes: str


class EstatisticaLocalidade(BaseModel):
    estado: str
    municipio: str
    pacientes: int
    classificacoes: int


def _faixa_etaria(idade: int | None) -> str:
    if idade is None:
        return 'Não informada'
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


@router.get('/estatisticas/localidade', response_model=list[EstatisticaLocalidade])
def estatisticas_por_localidade():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                SELECT p.estado,
                       p.municipio,
                       count(DISTINCT p.id)::int AS pacientes,
                       count(c.id)::int AS classificacoes
                FROM paciente p
                LEFT JOIN classificacao_cif c ON c.paciente_id = p.id
                WHERE p.estado <> 'Não informado'
                  AND p.municipio <> 'Não informado'
                GROUP BY p.estado, p.municipio
                HAVING count(DISTINCT p.id) >= 5
                ORDER BY p.estado, p.municipio
                '''
            )
            return cur.fetchall()


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


@router.get('/classificacoes/exportacao', response_model=list[ExportacaoPesquisa])
def exportar_classificacoes_pesquisa(
    componente: Literal['b', 's', 'd', 'e'] | None = None,
    codigo: str | None = Query(
        default=None,
        max_length=6,
        pattern=r'^[bsde][0-9]{0,5}$',
    ),
):
    filtros = []
    parametros = []
    if componente:
        filtros.append('codigo.componente = %s')
        parametros.append(componente)
    if codigo:
        filtros.append('lower(c.cif_codigo) LIKE %s')
        parametros.append(f'{codigo.strip().lower()}%')
    where = f"WHERE {' AND '.join(filtros)}" if filtros else ''

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f'''
                WITH registros AS (
                    SELECT p.chave_pesquisa AS chave,
                           (EXTRACT(YEAR FROM age(CURRENT_DATE, p.data_nascimento))::int / 10) * 10 AS inicio_faixa,
                           c.id, c.cif_codigo AS codigo_cif,
                           codigo.descricao_pt,
                           c.qualificador_generico AS qualificador,
                           c.created_at::date AS data
                    FROM paciente p
                    JOIN classificacao_cif c ON c.paciente_id = p.id
                    JOIN cif_codigo codigo ON codigo.codigo = c.cif_codigo
                    {where}
                )
                SELECT r.chave,
                       COALESCE(
                           r.inicio_faixa::text || '-' || (r.inicio_faixa + 9)::text,
                           'Não informada'
                       ) AS faixa_etaria,
                       r.codigo_cif, r.descricao_pt, r.qualificador, r.data,
                       COALESCE(
                           string_agg(
                               relacao.tipo || ': ' || vinculada.cif_codigo ||
                               ' (' || to_char(vinculada.created_at::date, 'YYYY-MM-DD') || ')',
                               ', '
                           ),
                           ''
                       ) AS relacoes
                FROM registros r
                LEFT JOIN classificacao_cif_relacao relacao
                    ON r.id = relacao.classificacao_a_id
                    OR r.id = relacao.classificacao_b_id
                LEFT JOIN classificacao_cif vinculada
                    ON vinculada.id = CASE
                        WHEN relacao.classificacao_a_id = r.id
                        THEN relacao.classificacao_b_id
                        ELSE relacao.classificacao_a_id
                    END
                GROUP BY r.id, r.chave, r.inicio_faixa, r.codigo_cif,
                         r.descricao_pt, r.qualificador, r.data
                ORDER BY r.chave, r.data DESC, r.codigo_cif
                ''',
                parametros,
            )
            return cur.fetchall()
