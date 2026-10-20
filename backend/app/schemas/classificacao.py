from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class ClassificacaoCreate(BaseModel):
    codigo_cif: str
    qualificador: int = Field(ge=0, le=4)
    observacao: str = ""
    classificacao_relacionada_id: UUID | None = None
    tipo_relacao: Literal['duplicidade', 'evolucao'] | None = None

    @model_validator(mode='after')
    def validar_relacao(self):
        if (self.classificacao_relacionada_id is None) != (self.tipo_relacao is None):
            raise ValueError('Informe a classificação relacionada e o tipo de relação')
        return self


class ClassificacaoRelacaoResponse(BaseModel):
    id: str
    codigo_cif: str
    qualificador: int
    data: date
    tipo: Literal['duplicidade', 'evolucao']


class ClassificacaoResponse(BaseModel):
    id: str
    paciente_id: str
    codigo_cif: str
    descricao_pt: str | None = None
    qualificador: int
    data: date
    observacao: str
    relacoes: list[ClassificacaoRelacaoResponse] = Field(default_factory=list)


class CodigoCifResponse(BaseModel):
    codigo: str
    componente: str | None
    categoria: str | None
    descricao_pt: str