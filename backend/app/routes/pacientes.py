import csv
import io
from datetime import date, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ValidationError

from app.auth import SOMENTE_PROFISSIONAL
from app.db import get_conn
from app.schemas.paciente import PacienteCreate, PacienteResponse

router = APIRouter(dependencies=[Depends(SOMENTE_PROFISSIONAL)])


class ImportacaoPacientesRequest(BaseModel):
    conteudo: str = Field(min_length=1, max_length=5_000_000)

def patient_query():
    return '''
        SELECT id::text AS id, nome, data_nascimento, sexo, municipio, estado,
               chave_pesquisa,
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

@router.post('/pacientes', response_model=PacienteResponse, status_code=201)
def criar_paciente(paciente: PacienteCreate):
    paciente_id = str(uuid4())
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                INSERT INTO paciente (
                    id, nome, data_nascimento, sexo, municipio, estado
                ) VALUES (%s, %s, %s, %s, %s, %s)
                ''',
                (
                    paciente_id,
                    paciente.nome,
                    paciente.data_nascimento,
                    paciente.sexo,
                    paciente.municipio,
                    paciente.estado,
                ),
            )
            cur.execute(patient_query() + ' WHERE id = %s', (paciente_id,))
            return cur.fetchone()


@router.post('/pacientes/importacao')
def importar_pacientes(arquivo: ImportacaoPacientesRequest):
    conteudo = arquivo.conteudo.lstrip('\ufeff')
    amostra = conteudo[:8192]
    try:
        dialeto = csv.Sniffer().sniff(amostra, delimiters=',;\t')
    except csv.Error:
        dialeto = csv.excel

    leitor = csv.DictReader(io.StringIO(conteudo), dialect=dialeto)
    cabecalhos_normalizados = [
        (cabecalho or '').strip().lower()
        for cabecalho in (leitor.fieldnames or [])
    ]
    cabecalhos = {
        (cabecalho or '').strip().lower(): cabecalho
        for cabecalho in (leitor.fieldnames or [])
    }
    colunas_permitidas = {
        'nome', 'data_nascimento', 'sexo', 'municipio', 'estado',
    }
    if (
        len(cabecalhos_normalizados) != len(colunas_permitidas)
        or set(cabecalhos_normalizados) != colunas_permitidas
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                'Este importador aceita somente as colunas nome, data_nascimento, '
                'sexo, municipio e estado. Remova identificadores e campos clínicos '
                'do arquivo; exports de prontuário eletrônico precisam ser tratados '
                'e revisados antes da importação.'
            ),
        )

    validos = []
    erros = []
    quantidade_linhas = 0
    for numero_linha, linha in enumerate(leitor, start=2):
        if not any(str(valor or '').strip() for valor in linha.values()):
            continue
        quantidade_linhas += 1
        if quantidade_linhas > 500:
            raise HTTPException(
                status_code=400,
                detail='O arquivo pode conter no máximo 500 pacientes por importação.',
            )

        valores = {
            coluna: (linha.get(cabecalhos[coluna]) or '').strip()
            for coluna in colunas_permitidas
        }
        try:
            try:
                nascimento = date.fromisoformat(valores['data_nascimento'])
            except ValueError:
                nascimento = datetime.strptime(
                    valores['data_nascimento'], '%d/%m/%Y'
                ).date()
            paciente = PacienteCreate(
                nome=valores['nome'],
                data_nascimento=nascimento,
                sexo=valores['sexo'].upper(),
                municipio=valores['municipio'],
                estado=valores['estado'],
            )
        except (ValueError, ValidationError) as erro_validacao:
            if isinstance(erro_validacao, ValidationError):
                motivo = erro_validacao.errors()[0]['msg'].removeprefix('Value error, ')
            elif not valores['data_nascimento']:
                motivo = 'Data de nascimento é obrigatória.'
            else:
                motivo = 'Data inválida; use AAAA-MM-DD ou DD/MM/AAAA.'
            erros.append({'linha': numero_linha, 'motivo': motivo})
            continue
        validos.append(paciente)

    if quantidade_linhas == 0:
        raise HTTPException(status_code=400, detail='O arquivo não contém pacientes para importar.')

    with get_conn() as conn:
        with conn.cursor() as cur:
            for paciente in validos:
                cur.execute(
                    '''
                    INSERT INTO paciente (
                        id, nome, data_nascimento, sexo, municipio, estado
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    ''',
                    (
                        str(uuid4()),
                        paciente.nome,
                        paciente.data_nascimento,
                        paciente.sexo,
                        paciente.municipio,
                        paciente.estado,
                    ),
                )

    return {
        'importados': len(validos),
        'rejeitados': len(erros),
        'erros': erros,
    }

@router.put('/pacientes/{paciente_id}', response_model=PacienteResponse)
def atualizar_paciente(paciente_id: str, paciente: PacienteCreate):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                UPDATE paciente
                SET nome = %s, data_nascimento = %s, sexo = %s,
                    municipio = %s, estado = %s
                WHERE id = %s
                ''',
                (
                    paciente.nome,
                    paciente.data_nascimento,
                    paciente.sexo,
                    paciente.municipio,
                    paciente.estado,
                    paciente_id,
                ),
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
