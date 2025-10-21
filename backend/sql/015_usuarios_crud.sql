-- 015_usuarios_crud.sql
-- Mejoras para gestión completa de usuarios
-- Fecha: 2025-10-20

-- Agregar campo actualizado_en para tracking de modificaciones
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ;

-- Crear índice para búsquedas por rol
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Crear índice para búsquedas por activo
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Trigger para actualizar automáticamente actualizado_en
CREATE OR REPLACE FUNCTION actualizar_timestamp_usuarios()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_actualizado_en ON usuarios;
CREATE TRIGGER trg_usuarios_actualizado_en
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_timestamp_usuarios();

-- Comentarios para documentación
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con autenticación y roles';
COMMENT ON COLUMN usuarios.id IS 'Identificador único del usuario';
COMMENT ON COLUMN usuarios.email IS 'Correo electrónico (único, usado para login)';
COMMENT ON COLUMN usuarios.password_hash IS 'Hash de contraseña (sha256 con salt)';
COMMENT ON COLUMN usuarios.rol IS 'Rol del usuario: dev, admin, agente';
COMMENT ON COLUMN usuarios.activo IS 'Usuario habilitado para acceder al sistema';
COMMENT ON COLUMN usuarios.nombre IS 'Nombre completo del usuario';
COMMENT ON COLUMN usuarios.creado_en IS 'Fecha y hora de creación del usuario';
COMMENT ON COLUMN usuarios.actualizado_en IS 'Fecha y hora de última modificación';
