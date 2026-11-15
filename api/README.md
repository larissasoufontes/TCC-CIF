# CIF API (mínima)

Instruções rápidas:

1. Criar um virtualenv e instalar dependências:

```bash
python -m venv .venv
source .venv/bin/activate  # on Windows: .\.venv\Scripts\activate
pip install -r requirements.txt
```

2. Definir a variável de ambiente `DATABASE_URL` (Postgres DSN), por exemplo:

```bash
export DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'
```

3. Rodar:

```bash
python app.py
```

Endpoints úteis:

- `GET /api/cif/codes` – listar códigos CIF, filtros: `componente`, `categoria`, `q`, `limit`.
- `GET /api/classificacoes` – listar classificações, filtros: `paciente_id`, `profissional_id`, `cif_codigo`, `date_from`, `date_to`, `limit`.
- `GET /api/classificacoes/<id>` – obter classificação por id.

Importar códigos da OMS
-----------------------

Você pode importar códigos diretamente da API da OMS usando o script `import_who_cif.py`.

Exemplo:

```bash
export DATABASE_URL='postgresql://user:pass@localhost:5432/cif_db'
export WHO_API_URL='https://icd.who.int/icdapi/v1/search?q=b1301&includeSynonyms=true&language=pt'
python import_who_cif.py
```

Se a API exigir chave, defina `WHO_API_KEY`.

Obter credenciais da OMS (OAuth2)
---------------------------------

1. Acesse https://icd.who.int/icdapi e registre uma conta.
2. Faça login e clique em "View API access key" para gerar `client_id` e `client_secret`.
3. Você pode usar diretamente o par `client_id`/`client_secret` para obter um token OAuth2 usando o endpoint de token:

```bash
# exemplo com curl
curl -X POST https://icdaccessmanagement.who.int/connect/token \
	-d "grant_type=client_credentials&client_id=SEU_CLIENT_ID&client_secret=SEU_CLIENT_SECRET"

# resposta: {"access_token":"...","expires_in":...}
```

4. Exporte o token ou as credenciais para uso pelo importador:

```powershell
$env:WHO_CLIENT_ID='SEU_CLIENT_ID'
$env:WHO_CLIENT_SECRET='SEU_CLIENT_SECRET'
# ou, se você já tiver o token:
$env:WHO_API_KEY='SEU_ACCESS_TOKEN'
```

Formato do `DATABASE_URL`
-------------------------

Defina a variável `DATABASE_URL` com o DSN do Postgres, por exemplo:

```
postgresql://usuario:senha@localhost:5432/nome_do_banco
```


