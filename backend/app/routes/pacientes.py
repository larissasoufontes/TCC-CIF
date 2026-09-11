from datetime import date
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.db import get_conn
from app.schemas.paciente import PacienteCreate, PacienteResponse

router = APIRouter()

def patient_query():
    return '''
        SELECT id::text AS id, nome,
               EXTRACT(YEAR FROM age(CURRENT_DATE, data_nascimento))::int AS idade
        FROM paciente
    '''

@router.get('/pacientes', response_model=list[PacienteResponse])
def listar_pacientes():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(patient_query() + ' ORDER BY nome')
            return cur.fetchall()

@router.get('/pacientes/{paciente_id}', response_model=PacienteResponse)
def buscar_paciente(paciente_id: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(patient_query() + ' WHERE id = %s', (paciente_id,))
            paciente = cur.fetchone()
    if not paciente:
        raise HTTPException(status_code=404, detail='Paciente não encontrado')
    return paciente

def birth_date_from_age(age: int) -> date:
    if age < 0 or age > 130:
        raise HTTPException(status_code=400, detail='Idade deve estar entre 0 e 130')
    today = date.today()
    try:
        return today.replace(year=today.year - age)
    except ValueError:
        return today.replace(year=today.year - age, day=28)

@router.post('/pacientes', response_model=PacienteResponse, status_code=201)
def criar_paciente(paciente: PacienteCreate):
    nome = paciente.nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail='Nome é obrigatório')

    paciente_id = str(uuid4())
    nascimento = birth_date_from_age(paciente.idade)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                INSERT INTO paciente (
                    id, nome, data_nascimento, sexo, municipio, estado
                ) VALUES (%s, %s, %s, 'O', 'Não informado', 'SP')
                ''',
                (paciente_id, nome, nascimento),
            )
            cur.execute(patient_query() + ' WHERE id = %s', (paciente_id,))
            return cur.fetchone()

@router.put('/pacientes/{paciente_id}', response_model=PacienteResponse)
def atualizar_paciente(paciente_id: str, paciente: PacienteCreate):
    nome = paciente.nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail='Nome é obrigatório')

    nascimento = birth_date_from_age(paciente.idade)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'UPDATE paciente SET nome = %s, data_nascimento = %s WHERE id = %s',
                (nome, nascimento, paciente_id),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail='Paciente não encontrado')
            cur.execute(patient_query() + ' WHERE id = %s', (paciente_id,))
            return cur.fetchone()

@router.delete('/pacientes/{paciente_id}')
def deletar_paciente(paciente_id: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute('DELETE FROM paciente WHERE id = %s', (paciente_id,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail='Paciente não encontrado')
    return {'mensagem': 'Paciente deletado com sucesso'}
