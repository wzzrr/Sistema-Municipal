-- 016_infracciones_titular_infractor.sql
-- Separación de datos TITULAR vs INFRACTOR/CONDUCTOR en infracciones
-- Alinea infracciones con el modelo de actas_presenciales
-- Fecha: 2025-10-20

-- ============================================
-- CAMPOS DEL CONDUCTOR/INFRACTOR
-- ============================================
ALTER TABLE infracciones
  ADD COLUMN IF NOT EXISTS conductor_nombre TEXT,
  ADD COLUMN IF NOT EXISTS conductor_dni TEXT,
  ADD COLUMN IF NOT EXISTS conductor_domicilio TEXT,
  ADD COLUMN IF NOT EXISTS conductor_licencia TEXT,
  ADD COLUMN IF NOT EXISTS conductor_licencia_clase TEXT,
  ADD COLUMN IF NOT EXISTS conductor_cp TEXT,
  ADD COLUMN IF NOT EXISTS conductor_departamento TEXT,
  ADD COLUMN IF NOT EXISTS conductor_provincia TEXT;

-- ============================================
-- CAMPOS DEL TITULAR DEL VEHÍCULO
-- ============================================
ALTER TABLE infracciones
  ADD COLUMN IF NOT EXISTS titular_nombre TEXT,
  ADD COLUMN IF NOT EXISTS titular_dni_cuit TEXT,
  ADD COLUMN IF NOT EXISTS titular_domicilio TEXT,
  ADD COLUMN IF NOT EXISTS titular_cp TEXT,
  ADD COLUMN IF NOT EXISTS titular_departamento TEXT,
  ADD COLUMN IF NOT EXISTS titular_provincia TEXT;

-- ============================================
-- ÍNDICES PARA BÚSQUEDAS FRECUENTES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_infracciones_conductor_dni ON infracciones(conductor_dni);
CREATE INDEX IF NOT EXISTS idx_infracciones_titular_dni ON infracciones(titular_dni_cuit);

-- ============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================
COMMENT ON COLUMN infracciones.conductor_nombre IS 'Nombre completo del conductor/infractor al momento de la infracción';
COMMENT ON COLUMN infracciones.conductor_dni IS 'DNI del conductor/infractor';
COMMENT ON COLUMN infracciones.conductor_domicilio IS 'Domicilio del conductor/infractor';
COMMENT ON COLUMN infracciones.conductor_licencia IS 'Número de licencia de conducir del infractor';
COMMENT ON COLUMN infracciones.conductor_licencia_clase IS 'Clase de licencia (B1, B2, C, D, etc.)';

COMMENT ON COLUMN infracciones.titular_nombre IS 'Nombre del titular registral del vehículo';
COMMENT ON COLUMN infracciones.titular_dni_cuit IS 'DNI o CUIT del titular del vehículo';
COMMENT ON COLUMN infracciones.titular_domicilio IS 'Domicilio del titular del vehículo';

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Los campos de conductor son opcionales para infracciones automáticas (cámaras)
-- Los campos de titular se pueden autocompletar desde la tabla 'titulares' por dominio
-- En actas presenciales ambos conjuntos son obligatorios ya que se labran en el acto
