-- Cadastro de unidades de saúde (base do sistema).
CREATE TABLE IF NOT EXISTS "instituicao" (
	"id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"tipo" varchar(100) NOT NULL,
	"cidade" varchar(120) NOT NULL,
	"estado" varchar(2) NOT NULL,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id")
);
-- Cadastro de profissionais de saúde.
CREATE TABLE IF NOT EXISTS "profissional" (
	"id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"conselho_profissional" varchar(120) NOT NULL,
	"numero_registro" varchar(80) NOT NULL,
	"especialidade" varchar(120),
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id")
);
-- Vínculo entre profissional e instituição (1 profissional pode ter múltiplos vínculos).
CREATE TABLE IF NOT EXISTS "profissional_instituicao" (
	"id" uuid NOT NULL,
	"profissional_id" uuid NOT NULL,
	"instituicao_id" uuid NOT NULL,
	"data_inicio" date NOT NULL,
	"data_fim" date,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id"),
	CONSTRAINT "ck_prof_inst_datas" CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);
-- Cadastro de pacientes.
CREATE TABLE IF NOT EXISTS "paciente" (
	"id" uuid NOT NULL,
	"nome" varchar(200) NOT NULL,
	"data_nascimento" date NOT NULL,
	"sexo" varchar(1) NOT NULL,
	"municipio" varchar(120) NOT NULL,
	"estado" varchar(2) NOT NULL,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id"),
	CONSTRAINT "ck_paciente_sexo" CHECK (sexo IN ('M','F','O'))
);
-- Códigos CIF importados via API da OMS.
CREATE TABLE IF NOT EXISTS "cif_codigo" (
	"codigo" varchar(30) NOT NULL,
	"componente" varchar(1) NOT NULL,
	"categoria" varchar(50),
	"descricao_pt" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("codigo"),
	CONSTRAINT "ck_cif_componente" CHECK (componente IN ('b','s','d','e'))
);
-- Tabela central: associa paciente + profissional + código CIF com qualificadores.
CREATE TABLE IF NOT EXISTS "classificacao_cif" (
	"id" uuid NOT NULL,
	"paciente_id" uuid NOT NULL,
	"profissional_id" uuid NOT NULL,
	"cif_codigo" text NOT NULL,
	"qualificador_generico" integer NOT NULL DEFAULT 0,
	"qualificador_extensor" varchar(20),
	"codigo_completo_qualificado" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id"),
	CONSTRAINT "ck_classif_qualificador_generico" CHECK (qualificador_generico BETWEEN 0 AND 4)
);
-- Registro de relatórios exportados (CSV/PDF) por paciente e profissional.
CREATE TABLE IF NOT EXISTS "exportacao" (
	"id" uuid NOT NULL,
	"paciente_id" uuid NOT NULL,
	"profissional_id" uuid NOT NULL,
	"tipo_formato" varchar(10) NOT NULL,
	"arquivo_url" text,
	"gerado_em" timestamp with time zone NOT NULL DEFAULT 'now()',
	"periodo_inicio" date,
	"periodo_fim" date,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id"),
	CONSTRAINT "ck_export_tipo_formato" CHECK (lower(tipo_formato) IN ('csv','pdf'))
);
ALTER TABLE "profissional_instituicao" ADD CONSTRAINT "profissional_instituicao_fk1" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id");
ALTER TABLE "profissional_instituicao" ADD CONSTRAINT "profissional_instituicao_fk2" FOREIGN KEY ("instituicao_id") REFERENCES "instituicao"("id");
ALTER TABLE "classificacao_cif" ADD CONSTRAINT "classificacao_cif_fk1" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id");
ALTER TABLE "classificacao_cif" ADD CONSTRAINT "classificacao_cif_fk2" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id");
ALTER TABLE "classificacao_cif" ADD CONSTRAINT "classificacao_cif_fk3" FOREIGN KEY ("cif_codigo") REFERENCES "cif_codigo"("codigo");
ALTER TABLE "exportacao" ADD CONSTRAINT "exportacao_fk1" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("id");
ALTER TABLE "exportacao" ADD CONSTRAINT "exportacao_fk2" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("id");
CREATE INDEX "idx_instituicao_estado_cidade" ON "instituicao" USING btree ("estado", "cidade");
CREATE UNIQUE INDEX "idx_profissional_conselho_numero" ON "profissional" USING btree ("conselho_profissional", "numero_registro");
CREATE INDEX "idx_prof_inst_prof" ON "profissional_instituicao" USING btree ("profissional_id");
CREATE INDEX "idx_prof_inst_inst" ON "profissional_instituicao" USING btree ("instituicao_id");
CREATE INDEX "idx_prof_inst_periodo" ON "profissional_instituicao" USING btree ("instituicao_id", "profissional_id", "data_inicio");
CREATE INDEX "idx_paciente_estado_municipio" ON "paciente" USING btree ("estado", "municipio");
CREATE INDEX "idx_cif_componente" ON "cif_codigo" USING btree ("componente");
CREATE INDEX "idx_cif_categoria" ON "cif_codigo" USING btree ("categoria");
CREATE INDEX "idx_classif_paciente" ON "classificacao_cif" USING btree ("paciente_id");
CREATE INDEX "idx_classif_profissional" ON "classificacao_cif" USING btree ("profissional_id");
CREATE INDEX "idx_classif_cif" ON "classificacao_cif" USING btree ("cif_codigo");
CREATE INDEX "idx_classif_pac_prof_cif" ON "classificacao_cif" USING btree ("paciente_id", "profissional_id", "cif_codigo");
CREATE INDEX "idx_export_paciente" ON "exportacao" USING btree ("paciente_id");
CREATE INDEX "idx_export_profissional" ON "exportacao" USING btree ("profissional_id");
CREATE INDEX "idx_export_gerado_em" ON "exportacao" USING btree ("gerado_em");
COMMENT ON TABLE "instituicao" IS 'Cadastro de unidades de saúde (base do sistema).';
COMMENT ON COLUMN "instituicao"."tipo" IS 'Ex.: hospital, clínica, UBS, etc.';
COMMENT ON COLUMN "instituicao"."estado" IS 'UF (sigla).';
COMMENT ON TABLE "profissional" IS 'Cadastro de profissionais de saúde.';
COMMENT ON COLUMN "profissional"."conselho_profissional" IS 'Ex.: CREFITO, CRM, COREN, etc.';
COMMENT ON TABLE "profissional_instituicao" IS 'Vínculo entre profissional e instituição (1 profissional pode ter múltiplos vínculos).';
COMMENT ON COLUMN "profissional_instituicao"."data_fim" IS 'Nulo indica vínculo ativo.';
COMMENT ON TABLE "paciente" IS 'Cadastro de pacientes.';
COMMENT ON COLUMN "paciente"."sexo" IS 'Ex.: M/F/O (ajustar conforme regra).';
COMMENT ON TABLE "cif_codigo" IS 'Códigos CIF importados via API da OMS.';
COMMENT ON COLUMN "cif_codigo"."codigo" IS 'Código CIF (ex.: b1301.2).';
COMMENT ON COLUMN "cif_codigo"."componente" IS 'b/s/d/e.';
COMMENT ON COLUMN "cif_codigo"."categoria" IS 'Categoria (quando fornecida).';
COMMENT ON TABLE "classificacao_cif" IS 'Tabela central: associa paciente + profissional + código CIF com qualificadores.';
COMMENT ON COLUMN "classificacao_cif"."cif_codigo" IS 'Referência ao código CIF base (não qualificado).';
COMMENT ON COLUMN "classificacao_cif"."qualificador_generico" IS '0 a 4.';
COMMENT ON COLUMN "classificacao_cif"."qualificador_extensor" IS 'Qualificador extensor (formato conforme regra da fonte).';
COMMENT ON COLUMN "classificacao_cif"."codigo_completo_qualificado" IS 'Código completo qualificado no formato b1301.2_3.';
COMMENT ON TABLE "exportacao" IS 'Registro de relatórios exportados (CSV/PDF) por paciente e profissional.';
COMMENT ON COLUMN "exportacao"."tipo_formato" IS 'csv ou pdf.';
COMMENT ON COLUMN "exportacao"."arquivo_url" IS 'Localização do arquivo gerado (se aplicável).';
COMMENT ON COLUMN "exportacao"."periodo_inicio" IS 'Opcional: filtro do relatório.';
COMMENT ON COLUMN "exportacao"."periodo_fim" IS 'Opcional: filtro do relatório.';