-- 013_actas_presenciales_campos_adicionales.sql
-- Agrega campos adicionales para actas presenciales
-- Fecha: 2025-10-20

-- Agregar campos faltantes a la tabla actas_presenciales
ALTER TABLE actas_presenciales
  ADD COLUMN IF NOT EXISTS conductor_licencia_clase TEXT,
  ADD COLUMN IF NOT EXISTS lugar_infraccion TEXT,
  ADD COLUMN IF NOT EXISTS remitido_a TEXT,
  ADD COLUMN IF NOT EXISTS tipo_infraccion TEXT,
  ADD COLUMN IF NOT EXISTS velocidad_medida INTEGER,
  ADD COLUMN IF NOT EXISTS velocidad_limite INTEGER;

-- Comentarios para documentación
COMMENT ON COLUMN actas_presenciales.conductor_licencia_clase IS 'Clase de licencia de conducir del infractor (ej: B1, B2, C, D, etc.)';
COMMENT ON COLUMN actas_presenciales.lugar_infraccion IS 'Lugar específico donde se cometió la infracción';
COMMENT ON COLUMN actas_presenciales.remitido_a IS 'Autoridad o dependencia a la que se remite el acta';
COMMENT ON COLUMN actas_presenciales.tipo_infraccion IS 'Tipo de infracción cometida (ej: Exceso de velocidad)';
COMMENT ON COLUMN actas_presenciales.velocidad_medida IS 'Velocidad medida por el dispositivo cinemático en km/h';
COMMENT ON COLUMN actas_presenciales.velocidad_limite IS 'Velocidad máxima permitida en el lugar de la infracción en km/h';
