-- 014_titulares_vehiculos.sql
-- Agrega campos de vehículo y ubicación a la tabla titulares

-- Agregar campos de vehículo y ubicación
ALTER TABLE titulares
  ADD COLUMN IF NOT EXISTS tipo_vehiculo TEXT,
  ADD COLUMN IF NOT EXISTS marca TEXT,
  ADD COLUMN IF NOT EXISTS modelo TEXT,
  ADD COLUMN IF NOT EXISTS cp TEXT,
  ADD COLUMN IF NOT EXISTS departamento TEXT,
  ADD COLUMN IF NOT EXISTS provincia TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN titulares.tipo_vehiculo IS 'Tipo de vehículo (Automóvil, Camión, Moto, etc.)';
COMMENT ON COLUMN titulares.marca IS 'Marca del vehículo';
COMMENT ON COLUMN titulares.modelo IS 'Modelo del vehículo';
COMMENT ON COLUMN titulares.cp IS 'Código postal del titular';
COMMENT ON COLUMN titulares.departamento IS 'Departamento del titular';
COMMENT ON COLUMN titulares.provincia IS 'Provincia del titular';
