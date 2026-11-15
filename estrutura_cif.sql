-- =============================================================
-- Sistema de Informação em Saúde baseado na CIF
-- Escola Politécnica - USP | TCC 2026
-- Autoras: Carine Guzzi Santos, Larissa de Souza Fontes
-- =============================================================
-- DDL PostgreSQL — versão 1.0
-- Executar com usuário que tenha permissão CREATE TABLE
-- =============================================================


-- -------------------------------------------------------------
-- Extensão para UUID (nativa no PostgreSQL >= 13)
-- -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================
-- 1. INSTITUICAO
--    Unidades de saúde (hospitais, clínicas, UBSs, etc.)
-- =============================================================
CREATE TABLE instituicao (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        VARCHAR(255) NOT NULL,
    tipo        VARCHAR(100),           -- Ex: 'Hospital', 'UBS', 'Clínica', 'Ambulatório'
    cidade      VARCHAR(100),
    estado      CHAR(2),                -- Sigla UF (ex: 'SP')
    criado_em   TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  instituicao          IS 'Unidades de saúde cadastradas no sistema';
COMMENT ON COLUMN instituicao.tipo     IS 'Tipo da unidade: Hospital, UBS, Clínica, Ambulatório, etc.';
COMMENT ON COLUMN instituicao.estado   IS 'Sigla do estado (UF), ex: SP, RJ';


-- =============================================================
-- 2. PROFISSIONAL
--    Profissionais de saúde (médicos, fisioterapeutas, etc.)
-- =============================================================
CREATE TABLE profissional (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                VARCHAR(255) NOT NULL,
    conselho_profissional VARCHAR(20),  -- Ex: 'CRM', 'CREFITO', 'CRN', 'CRP'
    numero_registro     VARCHAR(50),   -- Número no conselho
    especialidade       VARCHAR(100),
    criado_em           TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  profissional                      IS 'Profissionais de saúde habilitados a registrar classificações CIF';
COMMENT ON COLUMN profissional.conselho_profissional IS 'Sigla do conselho profissional: CRM, CREFITO, CRN, CRP, etc.';
COMMENT ON COLUMN profissional.numero_registro       IS 'Número de registro no conselho profissional';


-- =============================================================
-- 3. PROFISSIONAL_INSTITUICAO
--    Vínculo N:N entre profissional e instituição
--    fim_vinculo NULL = vínculo ativo
-- =============================================================
CREATE TABLE profissional_instituicao (
    profissional_id UUID    NOT NULL REFERENCES profissional(id) ON DELETE CASCADE,
    instituicao_id  UUID    NOT NULL REFERENCES instituicao(id)  ON DELETE CASCADE,
    inicio_vinculo  DATE    NOT NULL DEFAULT CURRENT_DATE,
    fim_vinculo     DATE,               -- NULL enquanto vínculo estiver ativo
    PRIMARY KEY (profissional_id, instituicao_id, inicio_vinculo)
);

COMMENT ON TABLE  profissional_instituicao               IS 'Vínculos entre profissionais e instituições (histórico preservado)';
COMMENT ON COLUMN profissional_instituicao.fim_vinculo   IS 'NULL indica vínculo ativo; data preenchida indica desligamento';


-- =============================================================
-- 4. PACIENTE
--    Dados básicos do paciente (sem informações sensíveis de
--    diagnóstico — estas ficam nas classificações CIF)
-- =============================================================
CREATE TABLE paciente (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    sexo            CHAR(1)     CHECK (sexo IN ('M', 'F', 'O')), -- M/F/O (Outro)
    municipio       VARCHAR(100),
    estado          CHAR(2),
    criado_em       TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  paciente              IS 'Cadastro de pacientes';
COMMENT ON COLUMN paciente.sexo        IS 'M = Masculino, F = Feminino, O = Outro';
COMMENT ON COLUMN paciente.municipio   IS 'Município de residência do paciente';


-- =============================================================
-- 5. CIF_CODIGO
--    Snapshot local da CIF carregado via API da OMS
--    Fonte: https://id.who.int/icd/release/11/2026-01/icf
--    Componentes: b (Funções do Corpo), s (Estruturas do Corpo),
--                 d (Atividades e Participação), e (Fatores Ambientais)
-- =============================================================
CREATE TABLE cif_codigo (
    codigo          VARCHAR(20)  PRIMARY KEY,   -- Ex: 'b1301', 'd450', 'e1101'
    componente      CHAR(1)      NOT NULL CHECK (componente IN ('b','s','d','e')),
    categoria       VARCHAR(255) NOT NULL,       -- Nome curto da categoria
    descricao_pt    TEXT,                        -- Descrição completa em português
    importado_em    TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  cif_codigo             IS 'Snapshot local dos códigos CIF importados via API da OMS (versão 2026-01)';
COMMENT ON COLUMN cif_codigo.codigo      IS 'Código CIF conforme OMS, ex: b1301, d450, e1101';
COMMENT ON COLUMN cif_codigo.componente  IS 'b=Funções do Corpo, s=Estruturas do Corpo, d=Atividades/Participação, e=Fatores Ambientais';
COMMENT ON COLUMN cif_codigo.importado_em IS 'Data da última importação via API da OMS';


-- =============================================================
-- 6. CLASSIFICACAO_CIF
--    Registro central: associa paciente + profissional + código CIF
--    com qualificação completa
--
--    Estrutura do código qualificado (ex: b1301.2_3):
--      qualificador_generico  → número após o ponto  (0–4)
--      qualificador_extensor  → número após o _      (semântica varia por componente)
--      codigo_completo        → string montada para relatórios e exportação
-- =============================================================
CREATE TABLE classificacao_cif (
    id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id             UUID    NOT NULL REFERENCES paciente(id)    ON DELETE RESTRICT,
    profissional_id         UUID    NOT NULL REFERENCES profissional(id) ON DELETE RESTRICT,
    cif_codigo              VARCHAR(20) NOT NULL REFERENCES cif_codigo(codigo),
    qualificador_generico   SMALLINT CHECK (qualificador_generico BETWEEN 0 AND 4),
    qualificador_extensor   SMALLINT,   -- Semântica depende do componente; NULL se não aplicável
    codigo_completo         VARCHAR(30), -- Ex: 'b1301.2_3' — gerado pela aplicação
    observacao              TEXT,
    data_registro           DATE    NOT NULL DEFAULT CURRENT_DATE,
    criado_em               TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  classificacao_cif                       IS 'Registros de classificação CIF por paciente e profissional';
COMMENT ON COLUMN classificacao_cif.qualificador_generico IS '0=sem problema, 1=leve, 2=moderado, 3=grave, 4=completo/absoluto';
COMMENT ON COLUMN classificacao_cif.qualificador_extensor IS 'Significado varia: em Estruturas do Corpo indica natureza da deficiência; em Fatores Ambientais indica barreira(-) ou facilitador(+)';
COMMENT ON COLUMN classificacao_cif.codigo_completo       IS 'Código qualificado montado pela aplicação, ex: b1301.2_3';
COMMENT ON COLUMN classificacao_cif.data_registro         IS 'Data da avaliação clínica (pode diferir de criado_em)';


-- =============================================================
-- 7. EXPORTACAO
--    Auditoria de relatórios gerados (CSV / PDF)
-- =============================================================
CREATE TABLE exportacao (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id     UUID        NOT NULL REFERENCES paciente(id)     ON DELETE RESTRICT,
    profissional_id UUID        NOT NULL REFERENCES profissional(id) ON DELETE RESTRICT,
    formato         VARCHAR(10) NOT NULL CHECK (formato IN ('CSV', 'PDF')),
    caminho_arquivo VARCHAR(500),
    gerado_em       TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE exportacao IS 'Registro de exportações geradas — base para auditoria e conformidade futura com LGPD';


-- =============================================================
-- ÍNDICES
-- Criados nas colunas mais consultadas em cenários de uso real
-- =============================================================

-- Busca de classificações por paciente (histórico clínico)
CREATE INDEX idx_classificacao_paciente
    ON classificacao_cif (paciente_id, data_registro DESC);

-- Busca de classificações por profissional
CREATE INDEX idx_classificacao_profissional
    ON classificacao_cif (profissional_id);

-- Busca de classificações por código CIF (análises populacionais)
CREATE INDEX idx_classificacao_codigo
    ON classificacao_cif (cif_codigo);

-- Busca de vínculos ativos de um profissional
CREATE INDEX idx_vinculo_profissional
    ON profissional_instituicao (profissional_id)
    WHERE fim_vinculo IS NULL;

-- Busca de pacientes por município/estado (relatórios de saúde pública)
CREATE INDEX idx_paciente_municipio
    ON paciente (estado, municipio);

-- Busca de códigos CIF por componente
CREATE INDEX idx_cif_componente
    ON cif_codigo (componente);