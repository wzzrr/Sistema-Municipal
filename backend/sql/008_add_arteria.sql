-- 008_add_arteria.sql
-- Añade columna textual con la arteria (usada por InfraccionesService y el PDF)

ALTER TABLE IF EXISTS public.infracciones
  ADD COLUMN IF NOT EXISTS arteria text;
