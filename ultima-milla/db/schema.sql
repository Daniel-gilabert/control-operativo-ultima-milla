-- =============================================================
-- SCHEMA: Control Operativo Servicios Última Milla
-- PostgreSQL
-- =============================================================

-- ---------------------------------------------------------------
-- EMPLEADOS
-- ---------------------------------------------------------------
CREATE TABLE empleados (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(100) NOT NULL,
    dni             VARCHAR(20)  UNIQUE NOT NULL,
    telefono        VARCHAR(20),
    email           VARCHAR(100),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- VEHÍCULOS
-- ---------------------------------------------------------------
CREATE TABLE vehiculos (
    id              SERIAL PRIMARY KEY,
    matricula       VARCHAR(20)  UNIQUE NOT NULL,
    marca           VARCHAR(50)  NOT NULL,
    modelo          VARCHAR(50)  NOT NULL,
    anio            SMALLINT,
    -- Documentación con fechas de vencimiento
    itv_vencimiento DATE         NOT NULL,
    seguro_vencimiento DATE      NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- SERVICIOS (permanentes)
-- ---------------------------------------------------------------
CREATE TABLE servicios (
    id              SERIAL PRIMARY KEY,
    codigo          VARCHAR(50)  UNIQUE NOT NULL,
    descripcion     VARCHAR(200) NOT NULL,
    zona            VARCHAR(100),
    -- Asignaciones base permanentes
    empleado_base_id   INTEGER  NOT NULL REFERENCES empleados(id),
    vehiculo_base_id   INTEGER  NOT NULL REFERENCES vehiculos(id),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- SUSTITUCIONES TEMPORALES
-- Solo una activa por servicio en cada fecha
-- ---------------------------------------------------------------
CREATE TABLE sustituciones (
    id              SERIAL PRIMARY KEY,
    servicio_id     INTEGER      NOT NULL REFERENCES servicios(id),
    tipo            VARCHAR(20)  NOT NULL CHECK (tipo IN ('empleado', 'vehiculo')),
    -- Referencia polimórfica controlada
    empleado_id     INTEGER      REFERENCES empleados(id),
    vehiculo_id     INTEGER      REFERENCES vehiculos(id),
    fecha_inicio    DATE         NOT NULL,
    fecha_fin       DATE         NOT NULL,
    motivo          TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    -- Validación: debe tener exactamente uno de los dos
    CONSTRAINT chk_sustitucion_ref CHECK (
        (tipo = 'empleado' AND empleado_id IS NOT NULL AND vehiculo_id IS NULL) OR
        (tipo = 'vehiculo' AND vehiculo_id IS NOT NULL AND empleado_id IS NULL)
    ),
    CONSTRAINT chk_fecha_rango CHECK (fecha_fin >= fecha_inicio)
);

-- Índice para búsqueda rápida por servicio y fecha
CREATE INDEX idx_sustituciones_servicio_fecha
    ON sustituciones (servicio_id, fecha_inicio, fecha_fin);

-- Constraint para evitar solapamiento de sustituciones del mismo tipo en el mismo servicio
-- Se implementa a nivel de aplicación con validación explícita (ver lib/validaciones.ts)
-- PostgreSQL no soporta EXCLUDE sin extensión btree_gist; se usa constraint de exclusión:
-- ALTER TABLE sustituciones ADD CONSTRAINT no_overlap_empleado
--     EXCLUDE USING gist (servicio_id WITH =, daterange(fecha_inicio, fecha_fin, '[]') WITH &&)
--     WHERE (tipo = 'empleado');
-- (Requiere CREATE EXTENSION btree_gist)

-- ---------------------------------------------------------------
-- AUSENCIAS DE EMPLEADOS
-- ---------------------------------------------------------------
CREATE TABLE ausencias (
    id              SERIAL PRIMARY KEY,
    empleado_id     INTEGER      NOT NULL REFERENCES empleados(id),
    fecha_inicio    DATE         NOT NULL,
    fecha_fin       DATE         NOT NULL,
    tipo            VARCHAR(50)  NOT NULL, -- baja, vacaciones, permiso, etc.
    observaciones   TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ausencia_rango CHECK (fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_ausencias_empleado_fecha
    ON ausencias (empleado_id, fecha_inicio, fecha_fin);

-- ---------------------------------------------------------------
-- INCIDENCIAS DE VEHÍCULOS
-- ---------------------------------------------------------------
CREATE TABLE incidencias (
    id              SERIAL PRIMARY KEY,
    vehiculo_id     INTEGER      NOT NULL REFERENCES vehiculos(id),
    gravedad        VARCHAR(20)  NOT NULL CHECK (gravedad IN ('leve', 'grave')),
    descripcion     TEXT         NOT NULL,
    fecha_inicio    DATE         NOT NULL,
    -- NULL = incidencia abierta (no resuelta)
    fecha_fin       DATE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_incidencia_rango CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_incidencias_vehiculo_fecha
    ON incidencias (vehiculo_id, fecha_inicio, fecha_fin);

-- ---------------------------------------------------------------
-- AUDIT LOG (básico)
-- ---------------------------------------------------------------
CREATE TABLE audit_log (
    id              BIGSERIAL    PRIMARY KEY,
    tabla           VARCHAR(50)  NOT NULL,
    operacion       VARCHAR(10)  NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id     INTEGER      NOT NULL,
    datos_anteriores JSONB,
    datos_nuevos    JSONB,
    usuario         VARCHAR(100),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- TRIGGERS para updated_at automático
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empleados_updated_at BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vehiculos_updated_at BEFORE UPDATE ON vehiculos
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_servicios_updated_at BEFORE UPDATE ON servicios
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sustituciones_updated_at BEFORE UPDATE ON sustituciones
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ausencias_updated_at BEFORE UPDATE ON ausencias
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_incidencias_updated_at BEFORE UPDATE ON incidencias
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
