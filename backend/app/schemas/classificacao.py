from datetime import date

from pydantic import BaseModel, Field


class ClassificacaoCreate(BaseModel):
    codigo_cif: str
    qualificador: int = Field(ge=0, le=4)
    data: date
    observacao: str = ""


class ClassificacaoResponse(BaseModel):
    id: int
    paciente_id: int
    codigo_cif: str
    qualificador: int
    data: date
    observacao: str