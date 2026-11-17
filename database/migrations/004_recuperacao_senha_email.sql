ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS email text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_email
    ON usuario (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS password_reset_token (
    token_hash char(64) PRIMARY KEY,
    usuario_id uuid NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_usuario
    ON password_reset_token (usuario_id);

GRANT SELECT, INSERT, DELETE ON password_reset_token TO cifuser;