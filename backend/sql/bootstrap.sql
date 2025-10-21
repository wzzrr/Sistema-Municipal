CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin','operador','auditor')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Hash generado con: sha256('sv' + 'password') = 675b64aadde955b729917315a121ac327fffd489e50cf516c525281cb910c875
INSERT INTO usuarios(email,password_hash,rol,activo)
VALUES('admin@seguridadvial','675b64aadde955b729917315a121ac327fffd489e50cf516c525281cb910c875', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Usuario dev (password: 'password')
INSERT INTO usuarios(email,password_hash,rol,activo)
VALUES('dev@seguridadvial','675b64aadde955b729917315a121ac327fffd489e50cf516c525281cb910c875', 'dev', true)
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
