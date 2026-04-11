CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(180) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE negocio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(120) NOT NULL DEFAULT 'BizBazar',
    telefono VARCHAR(40),
    email_contacto VARCHAR(180),
    direccion TEXT,
    logo JSONB NOT NULL DEFAULT '{}'::jsonb,
    moneda VARCHAR(10) NOT NULL DEFAULT 'MXN',
    incremento_minimo_subasta NUMERIC(12,2) NOT NULL DEFAULT 5.00,
    formato_codigo VARCHAR(30) NOT NULL DEFAULT 'BIZ-%03d',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    fecha_compra DATE NOT NULL,
    precio_total NUMERIC(12,2) NOT NULL CHECK (precio_total >= 0),
    gastos_adicionales NUMERIC(12,2) NOT NULL DEFAULT 0,
    piezas_total INT NOT NULL CHECK (piezas_total > 0),
    costo_por_pieza NUMERIC(12,2) NOT NULL DEFAULT 0,
    recuperado NUMERIC(12,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'cerrado')),
    extra JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(180) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('ropa', 'joyeria')),
    subcategoria_id UUID REFERENCES categorias(id),
    tipo_venta VARCHAR(20) NOT NULL CHECK (tipo_venta IN ('directa', 'subasta')),
    premium BOOLEAN NOT NULL DEFAULT FALSE,
    lote_id UUID REFERENCES lotes(id),
    costo_base NUMERIC(12,2) NOT NULL CHECK (costo_base >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible' 
        CHECK (estado IN ('disponible', 'en_subasta', 'vendido')),
    imagenes JSONB NOT NULL DEFAULT '[]'::jsonb,
    extra JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT ropa_requiere_lote CHECK (
        (categoria = 'ropa' AND lote_id IS NOT NULL) OR
        (categoria != 'ropa')
    )
);

CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('directa', 'subasta')),
    total_venta NUMERIC(12,2) NOT NULL DEFAULT 0,
    ganancia_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    fecha TIMESTAMP NOT NULL DEFAULT NOW(),
    cliente_nombre VARCHAR(120),
    extra JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE venta_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    precio_venta NUMERIC(12,2) NOT NULL CHECK (precio_venta > 0),
    costo_base NUMERIC(12,2) NOT NULL CHECK (costo_base >= 0),
    ganancia NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(venta_id, producto_id)
);

CREATE TABLE subastas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    producto_id UUID NOT NULL REFERENCES productos(id),
    precio_inicial NUMERIC(12,2) NOT NULL CHECK (precio_inicial >= 0),
    incremento_minimo NUMERIC(12,2) NOT NULL DEFAULT 5,
    precio_final NUMERIC(12,2),
    ganadora_nombre VARCHAR(120),
    ganancia NUMERIC(12,2) DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'finalizada')),
    fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMP,
    venta_id UUID REFERENCES ventas(id),
    extra JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_lote ON productos(lote_id);
CREATE INDEX idx_productos_usuario ON productos(usuario_id);
CREATE INDEX idx_lotes_usuario ON lotes(usuario_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_subastas_estado ON subastas(estado);
CREATE INDEX idx_subastas_usuario ON subastas(usuario_id);
CREATE INDEX idx_productos_imagenes ON productos USING GIN(imagenes);
CREATE INDEX idx_productos_extra ON productos USING GIN(extra);

-- TRIGGER
CREATE OR REPLACE FUNCTION fn_calcular_costo_por_pieza()
RETURNS TRIGGER AS $$
BEGIN
    NEW.costo_por_pieza := ROUND((NEW.precio_total + NEW.gastos_adicionales) / NEW.piezas_total, 2);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lotes_costo_por_pieza
BEFORE INSERT OR UPDATE OF precio_total, gastos_adicionales, piezas_total
ON lotes FOR EACH ROW EXECUTE FUNCTION fn_calcular_costo_por_pieza();

INSERT INTO usuarios (nombre, email, password_hash) VALUES
('Administrador', 'admin@bizbazar.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- El negocio ahora debe estar vinculado a un usuario, ejemplo:
-- INSERT INTO negocio (usuario_id, nombre) VALUES ((SELECT id FROM usuarios LIMIT 1), 'BizBazar');

-- Las categorías ahora son creadas dinámicamente por la API de configuración para cada usuario
-- eliminando la necesidad de inserciones globales manuales aquí.
