-- 011_add_usuario_nombre.sql
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS nombre TEXT;
