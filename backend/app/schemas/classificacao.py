from datetime import date

from pydantic import BaseModel, Field


class ClassificacaoCreate(BaseModel):
    codigo_cif: str
    qualificador: int = Field(ge=0, le=4)
    data: date
    observacao: str = ""
    profissional_id: str | None = None


class ClassificacaoResponse(BaseModel):
    id: str
    paciente_id: str
    codigo_cif: str
    qualificador: int
    data: date
    observacao: str