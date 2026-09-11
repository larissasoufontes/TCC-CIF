# TCC-CIF
Este trabalho de Conclusão de Curso apresenta o desenvolvimento de um banco de dados voltado à classificação de informações em saúde, com base na Classificação Internacional de Funcionalidade, Incapacidade e Saúde (CIF). O projeto propõe a construção de um sistema para armazenar e organizar os dados, além de uma interface responsável pela coleta e organização das classificações, permitindo que os usuários insiram e registrem informações de acordo com a estrutura da CIF. Espera-se, ao final, disponibilizar uma plataforma funcional que apoie a padronização desse processo de forma acessível e eficiente, contribuindo para aplicações nas áreas de saúde pública, pesquisa  e gestão de informações. 

## Execução local

O front-end usa o backend FastAPI em `http://127.0.0.1:8000`. O backend agora usa PostgreSQL; não há mais armazenamento de pacientes ou classificações em memória.

### Backend

```powershell
Set-Location "backend"
$env:DATABASE_URL = "postgresql://usuario:senha@127.0.0.1:5432/cifdb"
$env:DEFAULT_PROFISSIONAL_ID = "11111111-1111-1111-1111-111111111111"
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Antes do primeiro uso, crie as tabelas no banco vazio:

```powershell
psql -U usuario -d cifdb -f ../database/schema.sql
```

### Front-end

Em outro terminal:

```powershell
Set-Location "frontend"
$env:VITE_API_BASE = "http://127.0.0.1:8000"
npm install
npm run dev
```

O servidor rejeita uma classificação com HTTP 400 quando `codigo_cif` não existe exatamente na tabela `cif_codigo`. O repositório não contém senhas, tokens ou outros segredos.

### Importação oficial da CIF

O importador usa a ferramenta oficial da OMS e seus endpoints `codeinfo`/entidade da CIF. Informe os códigos desejados por variável de ambiente:

```powershell
Set-Location "backend"
$env:DATABASE_URL = "postgresql://usuario:senha@127.0.0.1:5432/cifdb"
$env:WHO_CLIENT_ID = "seu-client-id"
$env:WHO_CLIENT_SECRET = "seu-client-secret"
$env:WHO_ICF_CODES = "d450,b1301,e1101"
python scripts/import_who_icf.py
```

O importador carrega o código, o componente, a categoria e a definição em português. Não coloque credenciais no Git.

### Link temporário para testes

Para uma demonstração até 15/09, mantenha o backend e o Vite rodando na máquina que possui o PostgreSQL e execute, em outro terminal:

```powershell
cloudflared tunnel --url http://127.0.0.1:5173
```

Compartilhe o endereço `https://*.trycloudflare.com` exibido no terminal. O link é temporário e deixa de funcionar quando o processo do túnel ou o computador for desligado. O Vite encaminha as rotas `/pacientes` para o FastAPI local.

