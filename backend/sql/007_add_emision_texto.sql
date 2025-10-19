-- 007_add_emision_texto.sql
-- Añade columna textual con la fecha de emisión (usada por InfraccionesService y el PDF)

ALTER TABLE IF EXISTS public.infracciones
  ADD COLUMN IF NOT EXISTS emision_texto text;
