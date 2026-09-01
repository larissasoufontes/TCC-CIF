from fastapi import APIRouter, HTTPException
from app.schemas.paciente import PacienteCreate, PacienteResponse

router = APIRouter()

pacientes = [
    {"id": 1, "nome": "Maria da Silva", "idade": 52},
    {"id": 2, "nome": "João Santos", "idade": 40},
    {"id": 3, "nome": "Ana Oliveira", "idade": 31},
]


@router.get("/pacientes", response_model=list[PacienteResponse])
def listar_pacientes():
    return pacientes


@router.get("/pacientes/{paciente_id}", response_model=PacienteResponse)
def buscar_paciente(paciente_id: int):
    for paciente in pacientes:
        if paciente["id"] == paciente_id:
            return paciente

    raise HTTPException(
        status_code=404,
        detail="Paciente não encontrado"
    )


@router.post("/pacientes", response_model=PacienteResponse)
def criar_paciente(paciente: PacienteCreate):
    novo_paciente = {
        "id": len(pacientes) + 1,
        "nome": paciente.nome,
        "idade": paciente.idade,
    }

    pacientes.append(novo_paciente)

    return novo_paciente

@router.put("/pacientes/{paciente_id}", response_model=PacienteResponse)
def atualizar_paciente(paciente_id: int, paciente_atualizado: PacienteCreate):
    for paciente in pacientes:
        if paciente["id"] == paciente_id:
            paciente["nome"] = paciente_atualizado.nome
            paciente["idade"] = paciente_atualizado.idade
            return paciente

    raise HTTPException(
        status_code=404,
        detail="Paciente não encontrado"
    )

@router.delete("/pacientes/{paciente_id}")
def deletar_paciente(paciente_id: int):
    for paciente in pacientes:
        if paciente["id"] == paciente_id:
            pacientes.remove(paciente)

            return {
                "mensagem": "Paciente deletado com sucesso"
            }

    raise HTTPException(
        status_code=404,
        detail="Paciente não encontrado"
    )