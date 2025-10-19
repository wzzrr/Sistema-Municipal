-- 010_usuarios.sql
-- Tabla de usuarios con roles del sistema

CREATE TABLE IF NOT EXISTS usuarios (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol           TEXT NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_rol_check
    CHECK (rol IN ('dev','admin','agente'))
);
