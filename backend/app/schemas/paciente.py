from pydantic import BaseModel


class Paciente(BaseModel):
    nome: str
    idade: int