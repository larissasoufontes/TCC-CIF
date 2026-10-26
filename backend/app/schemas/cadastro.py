
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class CadastroSolicitacao(BaseModel):
    perfil: Literal['profissional', 'pesquisador']

    nome: str = Field(min_length=2, max_length=200)
    usuario: str = Field(
        min_length=3,
        max_length=60,
        pattern=r'^[A-Za-z0-9._-]+$',
    )
    email: EmailStr
    instituicao: str = Field(min_length=2, max_length=200)

    senha: str = Field(min_length=8, max_length=200)

    conselho: str | None = Field(default=None, max_length=120)
    registro: str | None = Field(default=None, max_length=80)
    especialidade: str | None = Field(default=None, max_length=150)

    @field_validator(
        'nome',
        'usuario',
        'instituicao',
        'conselho',
        'registro',
        'especialidade',
    )
    @classmethod
    def remover_espacos(cls, valor):
        if valor is None:
            return None
        return valor.strip()

    @model_validator(mode='after')
    def validar_dados(self):
        if not self.nome or not self.instituicao:
            raise ValueError(
                'Nome e instituição são obrigatórios.'
            )

        if self.perfil == 'profissional':
            if not self.conselho or not self.registro:
                raise ValueError(
                    'Profissionais de saúde devem informar '
                    'conselho e número de registro.'
                )

        return self


class CadastroResposta(BaseModel):
    mensagem: str
    status_acesso: Literal['pendente'] = 'pendente'


class SolicitacaoAdministrativa(BaseModel):
    id: str
    nome: str
    usuario: str
    email: EmailStr
    perfil: Literal['profissional', 'pesquisador']
    instituicao: str
    conselho: str | None = None
    registro: str | None = None
    especialidade: str | None = None
    status_acesso: Literal[
        'pendente',
        'aprovado',
        'rejeitado',
    ]


class DecisaoCadastro(BaseModel):
    status_acesso: Literal['aprovado', 'rejeitado']
