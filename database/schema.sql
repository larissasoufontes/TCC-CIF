CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profissional (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome varchar(200) NOT NULL,
    conselho_profissional varchar(120) NOT NULL,
    numero_registro varchar(80) NOT NULL,
    especialidade varchar(120),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paciente (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome varchar(200) NOT NULL,
    data_nascimento date NOT NULL,
    sexo varchar(1) NOT NULL DEFAULT 'O' CHECK (sexo IN ('M', 'F', 'O')),
    municipio varchar(120) NOT NULL DEFAULT 'Nao informado',
    estado varchar(2) NOT NULL DEFAULT 'SP',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cif_codigo (
    codigo text PRIMARY KEY,
    componente varchar(1),
    categoria text,
    descricao_pt text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classificacao_cif (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id uuid NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT,
    profissional_id uuid NOT NULL REFERENCES profissional(id) ON DELETE RESTRICT,
    cif_codigo text NOT NULL REFERENCES cif_codigo(codigo),
    qualificador_generico integer NOT NULL DEFAULT 0 CHECK (qualificador_generico BETWEEN 0 AND 4),
    qualificador_extensor varchar(20),
    codigo_completo_qualificado text NOT NULL,
    observacao text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classificacao_paciente
    ON classificacao_cif (paciente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cif_codigo_descricao
    ON cif_codigo USING gin (to_tsvector('simple', descricao_pt));
