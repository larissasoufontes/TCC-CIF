# Banco de Dados e Interface para Organização de Informações em Saúde com base na CIF

**Autoras:** Carine Guzzi Santos e Larissa de Souza Fontes  
**Orientador:** Prof. Dr. Chi Nan Pai  
**Escola Politécnica — USP — TCC 2026**

---

```mermaid
erDiagram
  INSTITUICAO {
    uuid id PK
    string nome
    string tipo
    string cidade
    string estado
    timestamp criado_em
  }

  PROFISSIONAL {
    uuid id PK
    string nome
    string conselho_profissional
    string numero_registro
    string especialidade
    timestamp criado_em
  }

  PROFISSIONAL_INSTITUICAO {
    uuid profissional_id FK
    uuid instituicao_id FK
    date inicio_vinculo
    date fim_vinculo
  }

  PACIENTE {
    uuid id PK
    string nome
    date data_nascimento
    string sexo
    string municipio
    string estado
    timestamp criado_em
  }

  CIF_CODIGO {
    string codigo PK
    char componente
    string categoria
    text descricao_pt
    timestamp importado_em
  }

  CLASSIFICACAO_CIF {
    uuid id PK
    uuid paciente_id FK
    uuid profissional_id FK
    string cif_codigo FK
    smallint qualificador_generico
    smallint qualificador_extensor
    string codigo_completo
    text observacao
    date data_registro
    timestamp criado_em
  }

  EXPORTACAO {
    uuid id PK
    uuid paciente_id FK
    uuid profissional_id FK
    string formato
    string caminho_arquivo
    timestamp gerado_em
  }

  INSTITUICAO ||--o{ PROFISSIONAL_INSTITUICAO : "integra"
  PROFISSIONAL ||--o{ PROFISSIONAL_INSTITUICAO : "possui"
  PROFISSIONAL ||--o{ CLASSIFICACAO_CIF : "registra"
  PACIENTE ||--o{ CLASSIFICACAO_CIF : "recebe"
  CIF_CODIGO ||--o{ CLASSIFICACAO_CIF : "referencia"
  PACIENTE ||--o{ EXPORTACAO : "origina"
  PROFISSIONAL ||--o{ EXPORTACAO : "solicita"
```

---

## Decisões de arquitetura

**PostgreSQL** foi escolhido em vez de SQLite por suportar múltiplos usuários simultâneos, múltiplas instituições e armazenamento em servidor dedicado.

**Snapshot local da CIF** — os códigos são importados via API da OMS e armazenados na tabela `cif_codigo`. Isso garante funcionamento offline e independência de conectividade durante o uso clínico.

**Qualificadores separados** — o qualificador genérico (0–4) e o extensor ficam em colunas distintas para permitir consultas analíticas (ex: filtrar casos graves). O campo `codigo_completo` armazena o código no formato padronizado da CIF (ex: `b1301.2_3`) para uso em relatórios e exportações.

**Vínculo profissional–instituição** — modelado como tabela de junção com data de início e fim, preservando o histórico mesmo quando um profissional muda de instituição.
