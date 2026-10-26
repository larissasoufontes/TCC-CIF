
from fastapi import APIRouter, HTTPException, status

from app.schemas.cadastro import (
    CadastroResposta,
    CadastroSolicitacao,
)

router = APIRouter(
    prefix="/auth",
    tags=["Cadastro de usuários"],
)


@router.post(
    "/cadastro",
    response_model=CadastroResposta,
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        503: {
            "description": "Persistência de cadastros ainda não disponível"
        }
    },
)
def solicitar_cadastro(dados: CadastroSolicitacao):
    """
    Recebe e valida solicitações de cadastro.

    Perfis permitidos:
    - profissional
    - pesquisador

    A persistência e o status pendente serão implementados
    após a migração do banco de dados.

    Nenhuma conta é criada nesta etapa.
    """

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "O formulário foi validado, mas o recebimento de "
            "solicitações ainda não está habilitado. "
            "Nenhum cadastro foi salvo."
        ),
    )
