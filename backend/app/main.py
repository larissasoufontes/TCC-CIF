from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {"mensagem": "API do Sistema CIF funcionando"}


@app.get("/pacientes")
def listar_pacientes():
    return [
        {"id": 1, "nome": "Maria da Silva"},
        {"id": 2, "nome": "João Santos"},
        {"id": 3, "nome": "Ana Oliveira"}
    ]