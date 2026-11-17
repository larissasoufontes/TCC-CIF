from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

UFS_VALIDAS = frozenset({
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
})


class PacienteCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    data_nascimento: date
    sexo: Literal['M', 'F', 'O', 'N']
    municipio: str = Field(min_length=1, max_length=120)
    estado: str = Field(min_length=2, max_length=20)

    @field_validator('nome', 'municipio', 'estado', mode='before')
    @classmethod
    def remover_espacos(cls, valor: str) -> str:
        return valor.strip() if isinstance(valor, str) else valor

    @field_validator('data_nascimento')
    @classmethod
    def validar_data_nascimento(cls, valor: date) -> date:
        hoje = date.today()
        idade = hoje.year - valor.year - ((hoje.month, hoje.day) < (valor.month, valor.day))
        if valor > hoje:
            raise ValueError('Data de nascimento não pode estar no futuro')
        if idade > 130:
            raise ValueError('Data de nascimento deve corresponder a até 130 anos')
        return valor

    @field_validator('estado')
    @classmethod
    def normalizar_estado(cls, valor: str) -> str:
        if valor.casefold() == 'não informado':
            return 'Não informado'
        estado = valor.upper()
        if estado not in UFS_VALIDAS:
            raise ValueError('Informe uma sigla válida de UF ou Não informado')
        return estado


class PacienteResponse(BaseModel):
    id: str
    nome: str
    data_nascimento: date | None = None
    sexo: str
    municipio: str
    estado: str
    idade: int | None = None
    chave_pesquisa: str