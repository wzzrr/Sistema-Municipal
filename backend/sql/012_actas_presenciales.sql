-- 012_actas_presenciales.sql

-- Asegurar correlativos para serie PRESENCIAL (por defecto 'P')
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM correlativos WHERE serie = COALESCE(current_setting('sv.presencial_serie', true), 'P')) THEN
    INSERT INTO correlativos(serie, ultimo) VALUES (COALESCE(current_setting('sv.presencial_serie', true), 'P'), 0);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS actas_presenciales (
  id                BIGSERIAL PRIMARY KEY,
  serie             TEXT NOT NULL,
  nro_correlativo   BIGINT NOT NULL,
  dominio           TEXT NOT NULL,
  fecha_acta        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Conductor (manual)
  conductor_nombre      TEXT NOT NULL,
  conductor_dni         TEXT NOT NULL,
  conductor_domicilio   TEXT NOT NULL,
  conductor_licencia    TEXT,
  conductor_cp          TEXT,
  conductor_departamento TEXT,
  conductor_provincia    TEXT,

  -- Vehículo (desde padrón o manual)
  veh_tipo   TEXT,
  veh_marca  TEXT,
  veh_modelo TEXT,

  -- Titular (invisible en UI pero persistimos si lo conseguimos)
  titular_nombre    TEXT,
  titular_dni_cuit  TEXT,
  titular_domicilio TEXT,
  titular_cp        TEXT,
  titular_departamento TEXT,
  titular_provincia    TEXT,

  -- Cinemáticos (equipo/control metrológico)
  cine_marca   TEXT,
  cine_modelo  TEXT,
  cine_serie   TEXT,
  cine_aprobacion TEXT, -- "DD-MM-AAAA" (texto exacto para impresión)

  -- Otros
  observaciones TEXT,

  -- Flags de notificación (fijo: notificado en el acto)
  estado              TEXT NOT NULL DEFAULT 'notificada',
  notificado          BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_notificacion  TIMESTAMPTZ NOT NULL DEFAULT now(),

  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_presenciales_serie_nro
  ON actas_presenciales(serie, nro_correlativo);

-- Vista con nro_acta formateado
CREATE OR REPLACE VIEW actas_presenciales_view AS
SELECT
  ap.*,
  (ap.serie || '-' || LPAD(ap.nro_correlativo::text, 7, '0')) AS nro_acta
FROM actas_presenciales ap;
