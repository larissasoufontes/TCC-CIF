
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.cadastro import router as cadastro_router
from app.routes.solicitacoes import router as solicitacoes_router
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
app.include_router(cadastro_router)
app.include_router(admin_router)
app.include_router(solicitacoes_router)
app.include_router(pacientes_router)
app.include_router(pesquisa_router)
app.include_router(classificacoes_router)
app.include_router(codigos_cif_router)

FRONTEND_DIST = Path(__file__).resolve().parents[2] / 'frontend' / 'dist'
FRONTEND_INDEX = FRONTEND_DIST / 'index.html'

if (FRONTEND_DIST / 'assets').is_dir():
    app.mount(
        '/assets',
        StaticFiles(directory=FRONTEND_DIST / 'assets'),
        name='frontend-assets',
    )


@app.get("/")
def inicio():
    if FRONTEND_INDEX.is_file():
        return FileResponse(FRONTEND_INDEX)
    return {
        "mensagem": "API do Sistema CIF"
    }


@app.get('/{caminho:path}', include_in_schema=False)
def servir_frontend(caminho: str, request: Request):
    if not FRONTEND_INDEX.is_file():
        raise HTTPException(status_code=404)

    arquivo = (FRONTEND_DIST / caminho).resolve()
    try:
        arquivo.relative_to(FRONTEND_DIST.resolve())
    except ValueError:
        raise HTTPException(status_code=404)

    if arquivo.is_file():
        return FileResponse(arquivo)
    if 'text/html' in request.headers.get('accept', ''):
        return FileResponse(FRONTEND_INDEX)
    raise HTTPException(status_code=404)
