CREATE TABLE IF NOT EXISTS notificaciones (
  id            SERIAL PRIMARY KEY,
  infraccion_id INTEGER NOT NULL REFERENCES infracciones(id) ON DELETE CASCADE,
  email         VARCHAR(320),
  estado        VARCHAR(20) NOT NULL DEFAULT 'borrador', -- borrador|generado|enviado|error
  pdf_path      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at       TIMESTAMPTZ
);
