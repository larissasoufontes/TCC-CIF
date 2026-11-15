# TCC-CIF
Este trabalho de Conclusão de Curso apresenta o desenvolvimento de um banco de dados voltado à classificação de informações em saúde, com base na Classificação Internacional de Funcionalidade, Incapacidade e Saúde (CIF). O projeto propõe a construção de um sistema para armazenar e organizar os dados, além de uma interface responsável pela coleta e organização das classificações, permitindo que os usuários insiram e registrem informações de acordo com a estrutura da CIF. Espera-se, ao final, disponibilizar uma plataforma funcional que apoie a padronização desse processo de forma acessível e eficiente, contribuindo para aplicações nas áreas de saúde pública, pesquisa  e gestão de informações. 

## Servidor e publicação

O PostgreSQL 18 roda no PC servidor. A aplicação usa `DATABASE_URL`; não usamos Supabase. O schema principal está em `database/schema.sql`. O Vite serve apenas para desenvolvimento; para publicar, gere o build e deixe o FastAPI servir o frontend.

### Preparar o site

```powershell
Set-Location frontend
npm install
npm run build
```

Copie `backend/.env.example` para `backend/.env` e preencha `DATABASE_URL` e `AUTH_SECRET` com valores privados. O arquivo `.env` real não deve ser enviado ao Git.

Para iniciar a aplicação integrada:

```powershell
Set-Location backend
& "..\.venv\Scripts\Activate.ps1"
.\iniciar-servidor.ps1
```

O site e a API ficam disponíveis em `http://127.0.0.1:8000`. Mantenha o servidor, o banco e essa janela em execução enquanto a aplicação estiver em uso.

### Acesso pela internet e ao banco

Para visitantes externos, use o Cloudflare Tunnel apontando ao FastAPI, não ao Vite:

```powershell
cloudflared tunnel --url http://127.0.0.1:8000
```

O endereço `trycloudflare.com` é temporário e muda quando o túnel reinicia. Um endereço permanente exige domínio e túnel nomeado. Para acesso ao pgAdmin/DBeaver da dupla, usem Tailscale e uma conta PostgreSQL própria; permitam a porta `5432` somente pela rede Tailscale e não a exponham diretamente à internet.

### Autenticação e usuários

As áreas de profissional de saúde, pesquisador e administrador exigem login. Crie o primeiro administrador localmente, dentro da pasta `backend`:

```powershell
$env:DATABASE_URL = "postgresql://usuario:senha@127.0.0.1:5432/cifdb"
python -m scripts.criar_usuario --perfil administrador --login admin
```

O comando solicita a senha no terminal e guarda somente um hash no banco. Entre pela opção **Administrador** em `/login` para criar contas de profissionais e pesquisadores. O pesquisador consulta pacientes por uma chave aleatória, sem ver o nome; o CSV de histórico também usa essa chave e omite observações clínicas.

Use um `AUTH_SECRET` aleatório e privado para manter sessões válidas após reiniciar a API. Não salve segredos no GitHub. Façam backup antes de mudanças no schema e usem somente dados fictícios durante os testes.

### Importação oficial da CIF

O importador usa a ferramenta oficial da OMS e seus endpoints `codeinfo`/entidade da CIF. Informe os códigos desejados por variáveis de ambiente:

```powershell
Set-Location backend
$env:DATABASE_URL = "postgresql://usuario:senha@127.0.0.1:5432/cifdb"
$env:WHO_CLIENT_ID = "seu-client-id"
$env:WHO_CLIENT_SECRET = "seu-client-secret"
$env:WHO_ICF_CODES = "d450,b1301,e1101"
python scripts/import_who_icf.py
```

O importador carrega o código, o componente, a categoria e a definição em português. Não coloque credenciais no Git.

