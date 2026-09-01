from fastapi import APIRouter, HTTPException

from app.routes.pacientes import pacientes
from app.schemas.classificacao import (
    ClassificacaoCreate,
    ClassificacaoResponse,
)


router = APIRouter(
    prefix="/pacientes/{paciente_id}/classificacoes",
    tags=["Classificações CIF"],
)


classificacoes = []


def verificar_paciente(paciente_id: int):
    for paciente in pacientes:
        if paciente["id"] == paciente_id:
            return paciente

    raise HTTPException(
        status_code=404,
        detail="Paciente não encontrado",
    )


@router.get(
    "",
    response_model=list[ClassificacaoResponse],
)
def listar_classificacoes(paciente_id: int):
    verificar_paciente(paciente_id)

    return [
        classificacao
        for classificacao in classificacoes
        if classificacao["paciente_id"] == paciente_id
    ]


@router.post(
    "",
    response_model=ClassificacaoResponse,
)
def criar_classificacao(
    paciente_id: int,
    classificacao: ClassificacaoCreate,
):
    verificar_paciente(paciente_id)

    novo_id = (
        max(
            [item["id"] for item in classificacoes],
            default=0,
        )
        + 1
    )

    nova_classificacao = {
        "id": novo_id,
        "paciente_id": paciente_id,
        "codigo_cif": classificacao.codigo_cif,
        "qualificador": classificacao.qualificador,
        "data": classificacao.data,
        "observacao": classificacao.observacao,
    }

    classificacoes.append(nova_classificacao)

    return nova_classificacao