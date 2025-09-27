-- 001_infracciones.sql
CREATE TABLE IF NOT EXISTS infracciones (
  id BIGSERIAL PRIMARY KEY,
  serie TEXT NOT NULL,
  nro_correlativo BIGINT NOT NULL,
  dominio TEXT NOT NULL,
  tipo_infraccion TEXT NOT NULL,
  fecha_labrado TIMESTAMPTZ NOT NULL,
  velocidad_medida NUMERIC NOT NULL,
  velocidad_autorizada NUMERIC NOT NULL,
  ubicacion_texto TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  estado TEXT NOT NULL DEFAULT 'validada',
  fecha_carga TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_infracciones_dominio ON infracciones (dominio);
