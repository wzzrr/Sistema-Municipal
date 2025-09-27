CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin','operador','auditor')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO usuarios(email,password_hash,rol,activo)
VALUES('admin@seguridadvial','{ed79d14fb2c45b4130e216eda8992fa0ddc0d7ed81dce28ec66bbe7a3ca7af4a}', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Optional helper to manage correlatives
CREATE TABLE IF NOT EXISTS correlativos (
  serie TEXT PRIMARY KEY,
  ultimo BIGINT NOT NULL DEFAULT 0
);
INSERT INTO correlativos(serie, ultimo) VALUES('A', 0)
ON CONFLICT (serie) DO NOTHING;

-- View for listing with nro_acta
CREATE OR REPLACE VIEW infracciones_view AS
SELECT i.*, (i.serie || '-' || lpad(i.nro_correlativo::text, 7, '0')) AS nro_acta FROM infracciones i;
