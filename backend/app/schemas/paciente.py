from pydantic import BaseModel


class PacienteCreate(BaseModel):
    nome: str
    idade: int


class PacienteResponse(BaseModel):
    id: int
    nome: str
    idade: int