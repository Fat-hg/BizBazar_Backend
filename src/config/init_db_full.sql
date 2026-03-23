-- ============================================
-- SCHEMA COMPLETO BIZBAZAR - PRODUCCIÓN
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lotes
CREATE TABLE IF NOT EXISTS lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha_compra DATE NOT NULL,
    precio_total NUMERIC(15,2) NOT NULL,
    gastos_adicionales NUMERIC(15,2) DEFAULT 0,
    piezas_total INT NOT NULL,
    recuperado NUMERIC(15,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'abierto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categorías / Subcategorías
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subcategorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Productos
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL,
    subcategoria_id UUID REFERENCES subcategorias(id),
    tipo_venta VARCHAR(20) DEFAULT 'directa',
    lote_id UUID REFERENCES lotes(id),
    costo_base NUMERIC(15,2) NOT NULL,
    imagenes JSONB DEFAULT '[]',
    premium BOOLEAN DEFAULT FALSE,
    estado VARCHAR(20) DEFAULT 'disponible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(20) DEFAULT 'directa',
    total_venta NUMERIC(15,2) NOT NULL,
    ganancia_total NUMERIC(15,2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cliente_nombre VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Venta Items
CREATE TABLE IF NOT EXISTS venta_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    precio_venta NUMERIC(15,2) NOT NULL,
    costo_base NUMERIC(15,2) NOT NULL,
    ganancia NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Subastas
CREATE TABLE IF NOT EXISTS subastas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    precio_inicial NUMERIC(15,2) NOT NULL,
    incremento_minimo NUMERIC(15,2) NOT NULL,
    precio_final NUMERIC(15,2),
    ganadora_nombre VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'activa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Configuración / Negocio
CREATE TABLE IF NOT EXISTS negocio (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email_contacto VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    moneda VARCHAR(10) DEFAULT 'MXN',
    incremento_minimo_subasta NUMERIC(15,2) DEFAULT 50,
    formato_codigo VARCHAR(20) DEFAULT 'PROD-',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos base
INSERT INTO negocio (nombre) 
SELECT 'BizBazar' WHERE NOT EXISTS (SELECT 1 FROM negocio);
