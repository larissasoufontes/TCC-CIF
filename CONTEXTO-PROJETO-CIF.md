# Contexto do Projeto — TCC Sistema de Classificação CIF

> Documento de contexto pra usar no Claude (claude.ai) ou com qualquer assistente.
> Resume tudo que foi construído. Última atualização: 11/09/2026.

## O que é o projeto
TCC da Larissa (com uma dupla): um sistema web para **classificar pacientes usando a CIF** — a Classificação Internacional de Funcionalidade da OMS. A CIF descreve o **impacto funcional** de uma pessoa (ex.: `d450` = "Andar").

⚠️ **Importante não confundir:** CIF/ICF (funcionalidade, ex.: andar) é diferente da CID/ICD-11 (doenças, ex.: diabetes). No começo o projeto usou por engano a API da CID; isso foi corrigido (ver abaixo).

## Arquitetura (como as peças se conectam)
```
Front-end React/Vite  →  Backend FastAPI (porta 8000)  →  PostgreSQL (banco "cifdb")
```
- **Front-end**: React + Vite, feito pela dupla. Fica em `frontend-repo/frontend/`. O Vite é usado no desenvolvimento; em produção, o build `frontend/dist` é servido pelo FastAPI na mesma origem.
- **Backend**: FastAPI em `frontend-repo/backend/` — é o **backend oficial único**. Conecta no PostgreSQL, salva pacientes e classificações, e **valida o código CIF no servidor** (código inexistente → HTTP 400; existente → 201).
  - (Existiu uma API Flask em `api/app.py` na porta 5000, mas foi **abandonada**. Não usar mais.)
- **Banco**: PostgreSQL 18, banco `cifdb`, usuário local `cifuser`. O computador atual da Larissa é o servidor; não há migração para outro computador nem uso de Supabase.

## A grande correção: ICD vs CIF
- A API usada no início (`https://id.who.int/icd/release/11/2026-01/mms/search`) é da **ICD-11 / CID** (doenças). Trouxe 111 registros errados (diabetes, câncer...) que foram **apagados**.
- A **fonte certa da CIF** é o endpoint `https://id.who.int/icd/release/11/2026-01/icf/codeinfo/<codigo>?flexiblemode=true` (descoberto inspecionando a ferramenta oficial da OMS em https://icd.who.int/ct/icf/pt/2026-01).
- Importador oficial novo: `frontend-repo/backend/scripts/import_who_icf.py` (lê os códigos de `WHO_ICF_CODES`, credenciais só por variável de ambiente).
- Hoje o banco tem 3 códigos CIF reais de demonstração: **d450 (Andar), b1301, e1101**.

## Estado atual (o que já funciona)
- Sistema roda de ponta a ponta **localmente**: cadastra paciente no banco, valida e salva classificação CIF (`d450` aceito; código inválido rejeitado).
- Código versionado no GitHub da dupla (https://github.com/larissasoufontes/TCC-CIF): backend, `database/schema.sql` e importador já estão no repo. Commits: `7c57ac6`, `81479fc`, `f272d6f`, `596f50b`.
- O PostgreSQL 18 está instalado e rodando no PC da Larissa. O acesso remoto direto pelo pgAdmin/DBeaver usa Tailscale; a porta 5432 não deve ser exposta diretamente à internet.
- Em produção, o FastAPI serve o build do React na porta 8000. O Cloudflare Tunnel pode encaminhar visitantes web ao FastAPI; o link rápido é temporário e não hospeda a aplicação.

## Detalhes técnicos úteis
- `DATABASE_URL`: usar `cifuser`, banco `cifdb` e o host local no PC servidor. Não registrar senha real neste documento ou no Git.
- Profissional de teste no banco: UUID fixo `11111111-1111-1111-1111-111111111111` (env `DEFAULT_PROFISSIONAL_ID`).
- Ajustes de schema feitos: colunas de código viraram `text` (URIs da OMS são longas) e foi adicionada coluna de observação.
- Node.js em `C:\Program Files\nodejs\`; PostgreSQL em `C:\Program Files\PostgreSQL\18\bin\`; cloudflared em `C:\Program Files (x86)\cloudflared\`.

## Pendências / próximos passos
1. Instalar e conectar o Tailscale no PC servidor e no computador da dupla.
2. Configurar acesso PostgreSQL restrito à rede Tailscale e criar uma conta individual com permissões para as alterações necessárias.
3. **Ideia de implementação futura:** autocomplete de código CIF + um painel "O que este código significa?" mostrando a descrição oficial da OMS (ex.: `d450` = Andar) antes de salvar.

## Sobre a Larissa (pra qualquer assistente ajudar bem)
Ela está aprendendo programação. Prefere: explicações simples em português, comandos prontos pra copiar e colar (Windows/PowerShell), um passo de cada vez, e entender o "porquê" de cada coisa.
