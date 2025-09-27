-- 002_titulares.sql
CREATE TABLE IF NOT EXISTS titulares (
  dominio   TEXT PRIMARY KEY,
  nombre    TEXT NOT NULL,
  dni       TEXT NOT NULL,
  domicilio TEXT NOT NULL
);

INSERT INTO titulares(dominio, nombre, dni, domicilio) VALUES
('AB123CD','Juan Pérez','20123456','Calle Falsa 123'),
('ABC123','María Gómez','23111222','Av. Siempre Viva 742')
ON CONFLICT (dominio) DO NOTHING;
