# TCC-CIF
Este trabalho de Conclusão de Curso apresenta o desenvolvimento de um banco de dados voltado à classificação de informações em saúde, com base na Classificação Internacional de Funcionalidade, Incapacidade e Saúde (CIF). O projeto propõe a construção de um sistema para armazenar e organizar os dados, além de uma interface responsável pela coleta e organização das classificações, permitindo que os usuários insiram e registrem informações de acordo com a estrutura da CIF. Espera-se, ao final, disponibilizar uma plataforma funcional que apoie a padronização desse processo de forma acessível e eficiente, contribuindo para aplicações nas áreas de saúde pública, pesquisa  e gestão de informações. 

## Servidor no PC

O computador servidor executa PostgreSQL, FastAPI e serve o build de produção do React. O Vite fica apenas para desenvolvimento; não é necessário para publicar a aplicação. O roteiro para preparar o `.env`, gerar o build e iniciar o servidor está em [README.md](../README.md).

Para a dupla conectar diretamente pelo pgAdmin/DBeaver, usem Tailscale e uma conta PostgreSQL própria. A porta `5432` não deve ser exposta à internet.

### Autenticação e usuários

As áreas de profissional de saúde, pesquisador e administrador exigem login. Não há cadastro público. Crie o primeiro administrador localmente, dentro da pasta `backend`:

```powershell
$env:DATABASE_URL = "postgresql://usuario:senha@127.0.0.1:5432/cifdb"
python -m scripts.criar_usuario --perfil administrador --login admin
```

O comando solicita a senha no terminal e guarda somente um hash no banco. Entre pela opção **Administrador** em `/login` para criar as contas de profissionais e pesquisadores. O pesquisador consulta pacientes por uma chave aleatória, sem ver o nome; o CSV de histórico também usa essa chave e omite observações clínicas.

Para manter sessões válidas após reiniciar a API, defina `AUTH_SECRET` no ambiente do servidor antes de iniciá-la. Use um valor aleatório e privado; não o salve no Git.

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

