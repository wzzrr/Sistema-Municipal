-- 006_extend_infracciones_extra.sql
-- Extiende "infracciones" con columnas usadas por Ingreso/Notificaciones/ConsultasSV.
-- Idempotente: usa IF NOT EXISTS para no fallar si ya están.

ALTER TABLE IF EXISTS public.infracciones
  ADD COLUMN IF NOT EXISTS notificado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fecha_notificacion timestamptz,
  ADD COLUMN IF NOT EXISTS cam_serie text,
  ADD COLUMN IF NOT EXISTS tipo_vehiculo text,
  ADD COLUMN IF NOT EXISTS vehiculo_marca text,
  ADD COLUMN IF NOT EXISTS vehiculo_modelo text;

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_infracciones_fecha_carga
  ON public.infracciones (fecha_carga);

CREATE INDEX IF NOT EXISTS idx_infracciones_estado
  ON public.infracciones (estado);

CREATE UNIQUE INDEX IF NOT EXISTS ux_infracciones_serie_nro
  ON public.infracciones (serie, nro_correlativo);

-- Asegura tabla titulares (si tu seed ya la creó, esto no hace nada malo)
CREATE TABLE IF NOT EXISTS public.titulares (
  dominio text PRIMARY KEY,
  nombre  text,
  dni     text,
  domicilio text
);

-- Índice por si hay consultas por DNI
CREATE INDEX IF NOT EXISTS idx_titulares_dni ON public.titulares(dni);
