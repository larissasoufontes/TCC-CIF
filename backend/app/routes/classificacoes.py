from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import QUALQUER_PERFIL, SOMENTE_PROFISSIONAL
from app.db import get_conn
from app.schemas.classificacao import (
    ClassificacaoCreate,
    ClassificacaoResponse,
    CodigoCifResponse,
)

router = APIRouter(
    prefix='/pacientes/{paciente_id}/classificacoes',
    tags=['Classificações CIF'],
    dependencies=[Depends(SOMENTE_PROFISSIONAL)],
)
router_codigos = APIRouter(
    prefix='/cif/codigos',
    tags=['Códigos CIF'],
    dependencies=[Depends(QUALQUER_PERFIL)],
)

def classification_query():
    return '''
        SELECT c.id::text AS id, c.paciente_id::text AS paciente_id,
             c.cif_codigo AS codigo_cif, codigo.descricao_pt,
               c.qualificador_generico AS qualificador,
               c.created_at::date AS data, c.observacao,
               COALESCE(
                   json_agg(json_build_object(
                       'id', vinculada.id::text,
                       'codigo_cif', vinculada.cif_codigo,
                       'qualificador', vinculada.qualificador_generico,
                       'data', vinculada.created_at::date,
                       'tipo', relacao.tipo
                   )) FILTER (WHERE vinculada.id IS NOT NULL),
                   '[]'
               ) AS relacoes
        FROM classificacao_cif c
        LEFT JOIN classificacao_cif_relacao relacao
            ON c.id = relacao.classificacao_a_id
            OR c.id = relacao.classificacao_b_id
        LEFT JOIN cif_codigo codigo ON codigo.codigo = c.cif_codigo
        LEFT JOIN classificacao_cif vinculada
            ON vinculada.id = CASE
                WHEN relacao.classificacao_a_id = c.id
                THEN relacao.classificacao_b_id
                ELSE relacao.classificacao_a_id
            END
    '''


@router_codigos.get('', response_model=list[CodigoCifResponse])
def buscar_codigos_cif(
    q: str = Query(min_length=1, max_length=100),
    campo: Literal['codigo', 'descricao'] = 'codigo',
    limite: int = Query(default=20, ge=1, le=50),
):
    termo = q.strip()
    if not termo:
        return []

    with get_conn() as conn:
        with conn.cursor() as cur:
            if campo == 'codigo':
                cur.execute(
                    '''
                    SELECT codigo, componente, categoria, descricao_pt
                    FROM cif_codigo
                    WHERE codigo ILIKE %s
                    ORDER BY CASE
                        WHEN lower(codigo) = lower(%s) THEN 0
                        WHEN codigo ILIKE %s THEN 1
                        ELSE 2
                    END, codigo
                    LIMIT %s
                    ''',
                    (f'%{termo}%', termo, f'{termo}%', limite),
                )
            else:
                cur.execute(
                    '''
                    SELECT codigo, componente, categoria, descricao_pt
                    FROM cif_codigo
                    WHERE descricao_pt ILIKE %s
                       OR to_tsvector('simple', descricao_pt)
                          @@ plainto_tsquery('simple', %s)
                    ORDER BY codigo
                    LIMIT %s
                    ''',
                    (f'%{termo}%', termo, limite),
                )
            return cur.fetchall()

@router.get('', response_model=list[ClassificacaoResponse])
def listar_classificacoes(paciente_id: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                classification_query()
                + ' WHERE c.paciente_id = %s GROUP BY c.id, codigo.descricao_pt ORDER BY c.created_at DESC',
                (paciente_id,),
            )
            return cur.fetchall()

@router.post('', response_model=ClassificacaoResponse, status_code=201)
def criar_classificacao(
    paciente_id: str,
    classificacao: ClassificacaoCreate,
    usuario: dict = Depends(SOMENTE_PROFISSIONAL),
):
    profissional_id = usuario['profissional_id']

    codigo_cif = classificacao.codigo_cif.strip().lower()
    if not codigo_cif:
        raise HTTPException(status_code=400, detail='Código CIF é obrigatório')

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT 1 FROM paciente WHERE id = %s', (paciente_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail='Paciente não encontrado')

            cur.execute(
                'SELECT 1 FROM cif_codigo WHERE codigo = %s',
                (codigo_cif,),
            )
            if not cur.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail=f'Código CIF não encontrado: {codigo_cif}',
                )

            classificacao_anterior = None
            if classificacao.classificacao_relacionada_id is not None:
                cur.execute(
                    '''
                    SELECT id, cif_codigo, qualificador_generico, created_at
                    FROM classificacao_cif
                    WHERE id = %s AND paciente_id = %s AND cif_codigo = %s
                    ''',
                    (
                        str(classificacao.classificacao_relacionada_id),
                        paciente_id,
                        codigo_cif,
                    ),
                )
                classificacao_anterior = cur.fetchone()
                if not classificacao_anterior:
                    raise HTTPException(
                        status_code=400,
                        detail='A relação exige outra classificação do mesmo paciente e código CIF',
                    )

            codigo_completo = f'{codigo_cif}.{classificacao.qualificador}'
            cur.execute(
                '''
                INSERT INTO classificacao_cif (
                    id, paciente_id, profissional_id, cif_codigo,
                    qualificador_generico, codigo_completo_qualificado,
                    observacao
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id::text AS id, paciente_id::text AS paciente_id,
                          cif_codigo AS codigo_cif,
                                  (SELECT cc.descricao_pt FROM cif_codigo cc
                                    WHERE cc.codigo = classificacao_cif.cif_codigo)
                                        AS descricao_pt,
                          qualificador_generico AS qualificador,
                          created_at::date AS data,
                          observacao, '[]'::json AS relacoes
                ''',
                (
                    str(uuid4()), paciente_id, profissional_id,
                    codigo_cif, classificacao.qualificador,
                    codigo_completo, classificacao.observacao,
                ),
            )
            resultado = cur.fetchone()

            if classificacao_anterior:
                ids_relacao = sorted((
                    resultado['id'],
                    str(classificacao.classificacao_relacionada_id),
                ))
                cur.execute(
                    '''
                    INSERT INTO classificacao_cif_relacao (
                        classificacao_a_id, classificacao_b_id, tipo
                    ) VALUES (%s, %s, %s)
                    ON CONFLICT (classificacao_a_id, classificacao_b_id)
                    DO UPDATE SET tipo = EXCLUDED.tipo
                    ''',
                    (*ids_relacao, classificacao.tipo_relacao),
                )
                resultado['relacoes'] = [{
                    'id': str(classificacao_anterior['id']),
                    'codigo_cif': classificacao_anterior['cif_codigo'],
                    'qualificador': classificacao_anterior['qualificador_generico'],
                    'data': classificacao_anterior['created_at'].date(),
                    'tipo': classificacao.tipo_relacao,
                }]

            return resultado
