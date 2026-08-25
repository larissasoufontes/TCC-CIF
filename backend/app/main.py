from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.pacientes import router as pacientes_router


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(pacientes_router)


@app.get("/")
def home():
    return {"mensagem": "API do Sistema CIF funcionando"}