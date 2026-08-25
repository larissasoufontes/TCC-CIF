from fastapi import APIRouter
from app.schemas.paciente import Paciente


router = APIRouter()


@router.get("/pacientes")
def listar_pacientes():
    return [
        {"id": 1, "nome": "Maria da Silva", "idade": 52},
        {"id": 2, "nome": "João Santos", "idade": 40},
        {"id": 3, "nome": "Ana Oliveira", "idade": 31},
    ]


@router.post("/pacientes")
def criar_paciente(paciente: Paciente):
    return {
        "mensagem": "Paciente recebido com sucesso",
        "paciente": paciente
    }