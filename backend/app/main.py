from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.pacientes import router as pacientes_router
from app.routes.pesquisa import router as pesquisa_router
from app.routes.classificacoes import (
    router as classificacoes_router,
    router_codigos as codigos_cif_router,
)


app = FastAPI(
    title="Sistema CIF API",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(pacientes_router)
app.include_router(pesquisa_router)
app.include_router(classificacoes_router)
app.include_router(codigos_cif_router)


@app.get("/")
def inicio():
    return {
        "mensagem": "API do Sistema CIF"
    }