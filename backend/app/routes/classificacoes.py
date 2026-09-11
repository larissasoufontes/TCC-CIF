import os
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.db import get_conn
from app.schemas.classificacao import ClassificacaoCreate, ClassificacaoResponse

router = APIRouter(
    prefix='/pacientes/{paciente_id}/classificacoes',
    tags=['Classificações CIF'],
)

def classification_query():
    return '''
        SELECT c.id::text AS id, c.paciente_id::text AS paciente_id,
               c.cif_codigo AS codigo_cif,
               c.qualificador_generico AS qualificador,
               c.created_at::date AS data,
               c.observacao
        FROM classificacao_cif c
    '''

@router.get('', response_model=list[ClassificacaoResponse])
def listar_classificacoes(paciente_id: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                classification_query()
                + ' WHERE c.paciente_id = %s ORDER BY c.created_at DESC',
                (paciente_id,),
            )
            return cur.fetchall()

@router.post('', response_model=ClassificacaoResponse, status_code=201)
def criar_classificacao(paciente_id: str, classificacao: ClassificacaoCreate):
    profissional_id = classificacao.profissional_id or os.getenv('DEFAULT_PROFISSIONAL_ID')
    if not profissional_id:
        raise HTTPException(status_code=400, detail='profissional_id é obrigatório')

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT 1 FROM paciente WHERE id = %s', (paciente_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail='Paciente não encontrado')

            cur.execute(
                'SELECT 1 FROM cif_codigo WHERE codigo = %s',
                (classificacao.codigo_cif.strip(),),
            )
            if not cur.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail=f'Código CIF não encontrado: {classificacao.codigo_cif}',
                )

            codigo_completo = f'{classificacao.codigo_cif.strip()}.{classificacao.qualificador}'
            cur.execute(
                '''
                INSERT INTO classificacao_cif (
                    id, paciente_id, profissional_id, cif_codigo,
                    qualificador_generico, codigo_completo_qualificado,
                    observacao, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id::text AS id, paciente_id::text AS paciente_id,
                          cif_codigo AS codigo_cif,
                          qualificador_generico AS qualificador,
                          created_at::date AS data,
                          observacao
                ''',
                (
                    str(uuid4()), paciente_id, profissional_id,
                    classificacao.codigo_cif.strip(), classificacao.qualificador,
                    codigo_completo, classificacao.observacao, classificacao.data,
                ),
            )
            return cur.fetchone()
