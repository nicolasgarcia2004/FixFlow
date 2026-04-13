-- =============================================
-- FixFlow - Script de inicialización de BD
-- Base de datos: PostgreSQL (Neon)
-- =============================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(10) NOT NULL DEFAULT 'CLIENTE'
        CHECK (tipo_usuario IN ('ADMIN', 'CLIENTE')),
    telefono VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de órdenes de servicio (pedidos)
CREATE TABLE IF NOT EXISTS servicios (
    id_servicio SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario),
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'recibido'
        CHECK (estado IN ('recibido', 'reparando', 'listo', 'entregado')),
    costo_total DECIMAL(10, 2) DEFAULT 0.00,
    diagnostico TEXT,
    solucion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos / repuestos disponibles
CREATE TABLE IF NOT EXISTS productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

-- Tabla intermedia: productos usados en cada servicio
CREATE TABLE IF NOT EXISTS productos_servicios (
    id_ps SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto),
    id_servicio INTEGER NOT NULL REFERENCES servicios(id_servicio) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1
);

-- Índices para mejorar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_servicios_usuario ON servicios(id_usuario);
CREATE INDEX IF NOT EXISTS idx_servicios_estado ON servicios(estado);
CREATE INDEX IF NOT EXISTS idx_ps_servicio ON productos_servicios(id_servicio);
