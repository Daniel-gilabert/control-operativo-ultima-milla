-- Datos de ejemplo para desarrollo
INSERT INTO empleados (nombre, apellidos, dni, telefono, email) VALUES
  ('Carlos',   'López Martínez',   '12345678A', '600111222', 'carlos@empresa.com'),
  ('María',    'García Sánchez',   '23456789B', '600333444', 'maria@empresa.com'),
  ('Pedro',    'Ruiz Fernández',   '34567890C', '600555666', 'pedro@empresa.com'),
  ('Ana',      'Torres Jiménez',   '45678901D', '600777888', 'ana@empresa.com');

INSERT INTO vehiculos (matricula, marca, modelo, anio, itv_vencimiento, seguro_vencimiento) VALUES
  ('1234ABC', 'Ford',       'Transit',      2021, '2026-08-15', '2026-05-01'),
  ('5678DEF', 'Mercedes',   'Sprinter',     2020, '2025-12-30', '2026-03-20'),
  ('9012GHI', 'Volkswagen', 'Crafter',      2022, '2026-06-10', '2026-07-01'),
  ('3456JKL', 'Renault',    'Master',       2019, '2025-11-01', '2026-01-15');

INSERT INTO servicios (codigo, descripcion, zona, empleado_base_id, vehiculo_base_id) VALUES
  ('SRV-001', 'Reparto zona norte',   'Norte',  1, 1),
  ('SRV-002', 'Reparto zona sur',     'Sur',    2, 2),
  ('SRV-003', 'Reparto zona este',    'Este',   3, 3),
  ('SRV-004', 'Reparto zona oeste',   'Oeste',  4, 4);

-- Ausencia: Carlos ausente del 2026-03-01 al 2026-03-10
INSERT INTO ausencias (empleado_id, fecha_inicio, fecha_fin, tipo) VALUES
  (1, '2026-03-01', '2026-03-10', 'baja');

-- Sustitución: María cubre a Carlos en SRV-001 durante su ausencia
INSERT INTO sustituciones (servicio_id, tipo, empleado_id, fecha_inicio, fecha_fin, motivo) VALUES
  (1, 'empleado', 2, '2026-03-01', '2026-03-10', 'Baja temporal empleado base');

-- Incidencia leve en vehículo 3
INSERT INTO incidencias (vehiculo_id, gravedad, descripcion, fecha_inicio) VALUES
  (3, 'leve', 'Luz piloto averiada', '2026-02-28');

-- Incidencia grave en vehículo 4 (en taller)
INSERT INTO incidencias (vehiculo_id, gravedad, descripcion, fecha_inicio) VALUES
  (4, 'grave', 'Avería motor - en taller', '2026-03-01');
