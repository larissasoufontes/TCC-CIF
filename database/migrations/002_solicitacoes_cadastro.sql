
-- Migração 002: solicitações de cadastro
-- Sistema CIF
--
-- Executar no PostgreSQL somente após revisão
-- e autorização da responsável pelo banco.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS solicitacao_cadastro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Dados de acesso
    login VARCHAR(60) NOT NULL,
    email VARCHAR(254) NOT NULL,
    senha_hash TEXT NOT NULL,

    -- Identificação
    nome VARCHAR(200) NOT NULL,
    perfil VARCHAR(20) NOT NULL
        CHECK (perfil IN ('profissional', 'pesquisador')),

    instituicao VARCHAR(200) NOT NULL,

    -- Dados específicos do profissional
    conselho VARCHAR(120),
    registro VARCHAR(80),
    especialidade VARCHAR(150),

    -- Situação da solicitação
    status_acesso VARCHAR(20) NOT NULL DEFAULT 'pendente'
        CHECK (
            status_acesso IN (
                'pendente',
                'aprovado',
                'rejeitado'
            )
        ),

    -- Controle da análise
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    analisado_em TIMESTAMPTZ,
    analisado_por UUID REFERENCES usuario(id),

    -- Conta criada após a aprovação
    usuario_id UUID UNIQUE REFERENCES usuario(id),

    -- Profissionais precisam informar conselho e registro
    CONSTRAINT dados_profissional_obrigatorios CHECK (
        perfil <> 'profissional'
        OR (
            NULLIF(TRIM(conselho), '') IS NOT NULL
            AND NULLIF(TRIM(registro), '') IS NOT NULL
        )
    )
);

-- Impede solicitações pendentes duplicadas
-- para o mesmo nome de usuário.
CREATE UNIQUE INDEX IF NOT EXISTS
    idx_solicitacao_login_pendente
ON solicitacao_cadastro (LOWER(login))
WHERE status_acesso = 'pendente';

-- Impede solicitações pendentes duplicadas
-- para o mesmo endereço de e-mail.
CREATE UNIQUE INDEX IF NOT EXISTS
    idx_solicitacao_email_pendente
ON solicitacao_cadastro (LOWER(email))
WHERE status_acesso = 'pendente';

-- Facilita a listagem das solicitações pendentes.
CREATE INDEX IF NOT EXISTS
    idx_solicitacao_status
ON solicitacao_cadastro (status_acesso, criado_em DESC);
