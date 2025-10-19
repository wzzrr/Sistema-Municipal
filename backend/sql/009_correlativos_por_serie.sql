-- 010_correlativos_por_serie.sql
-- Contador por serie (tabla + trigger) y vista con nro_acta formateado.

BEGIN;

-- 1) Tabla de contadores por serie
CREATE TABLE IF NOT EXISTS serie_correlativos (
  serie     text PRIMARY KEY,
  next_nro  bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Único por (serie, nro_correlativo) en infracciones (si no existiera el índice aún)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public'
       AND indexname  = 'ux_infracciones_serie_nro'
  ) THEN
    CREATE UNIQUE INDEX ux_infracciones_serie_nro
      ON infracciones(serie, nro_correlativo);
  END IF;
END$$;

-- 3) Trigger function: asigna correlativo si viene NULL
CREATE OR REPLACE FUNCTION trg_set_correlativo_por_serie()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  assigned bigint;
BEGIN
  -- Si ya viene seteado desde la app, respetar (pero igual está la unique)
  IF NEW.nro_correlativo IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Asignación atómica del próximo número por serie
  LOOP
    UPDATE serie_correlativos
       SET next_nro = next_nro + 1,
           updated_at = now()
     WHERE serie = NEW.serie
     RETURNING next_nro - 1 INTO assigned;

    IF FOUND THEN
      NEW.nro_correlativo := assigned;
      EXIT;
    END IF;

    -- Si no existía la fila de esa serie, la creo con next_nro=2 y asigno 1
    BEGIN
      INSERT INTO serie_correlativos(serie, next_nro)
      VALUES (NEW.serie, 2);
      NEW.nro_correlativo := 1;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- carrera: alguien la insertó en paralelo; reintentar UPDATE
    END;
  END LOOP;

  RETURN NEW;
END
$$;

-- 4) Trigger BEFORE INSERT
DROP TRIGGER IF EXISTS before_insert_infracciones_set_correlativo ON infracciones;
CREATE TRIGGER before_insert_infracciones_set_correlativo
BEFORE INSERT ON infracciones
FOR EACH ROW
EXECUTE FUNCTION trg_set_correlativo_por_serie();

-- 5) Inicializar contadores con el máximo actual + 1 por serie
INSERT INTO serie_correlativos(serie, next_nro)
SELECT i.serie, COALESCE(MAX(i.nro_correlativo), 0) + 1
  FROM infracciones i
 GROUP BY i.serie
ON CONFLICT (serie) DO UPDATE
   SET next_nro = EXCLUDED.next_nro,
       updated_at = now();

-- 6) Vista con nro_acta formateado (LPAD a 7 dígitos)
CREATE OR REPLACE VIEW v_infracciones AS
SELECT
  i.*,
  (i.serie || '-' || lpad(i.nro_correlativo::text, 7, '0')) AS nro_acta
FROM infracciones i;

COMMIT;
