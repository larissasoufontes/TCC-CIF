ALTER TABLE paciente
    ALTER COLUMN data_nascimento DROP NOT NULL;

ALTER TABLE paciente
    ALTER COLUMN estado TYPE varchar(20) USING estado::text;

ALTER TABLE paciente
    ALTER COLUMN estado DROP DEFAULT;

ALTER TABLE paciente
    ALTER COLUMN sexo DROP DEFAULT;

ALTER TABLE paciente
    DROP CONSTRAINT IF EXISTS paciente_sexo_check;

ALTER TABLE paciente
    DROP CONSTRAINT IF EXISTS ck_paciente_sexo;

UPDATE paciente
SET data_nascimento = NULL,
    sexo = 'N',
    municipio = convert_from(decode('4ec3a36f20696e666f726d61646f', 'hex'), 'UTF8'),
    estado = convert_from(decode('4ec3a36f20696e666f726d61646f', 'hex'), 'UTF8')
WHERE sexo = 'O'
  AND encode(convert_to(municipio, 'UTF8'), 'hex') IN (
      '4ec3a36f20696e666f726d61646f',
      '4e616f20696e666f726d61646f'
  )
  AND estado = 'SP';

ALTER TABLE paciente
    ADD CONSTRAINT paciente_sexo_check
    CHECK (sexo IN ('M', 'F', 'O', 'N'));

ALTER TABLE paciente
    ALTER COLUMN sexo SET DEFAULT 'N';

ALTER TABLE paciente
    ALTER COLUMN municipio SET DEFAULT convert_from(
        decode('4ec3a36f20696e666f726d61646f', 'hex'),
        'UTF8'
    );

ALTER TABLE paciente
    ALTER COLUMN estado SET DEFAULT convert_from(
        decode('4ec3a36f20696e666f726d61646f', 'hex'),
        'UTF8'
    );