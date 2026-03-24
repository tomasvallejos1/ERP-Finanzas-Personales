-- 1. Enums
CREATE TYPE tipo_producto_enum AS ENUM ('Caja de Ahorro', 'Tarjeta de Crédito');
CREATE TYPE tipo_categoria_enum AS ENUM ('Ingreso', 'Gasto', 'Inversion');
CREATE TYPE tipo_movimiento_enum AS ENUM ('Ingreso', 'Gasto', 'Transferencia');
CREATE TYPE estado_cuota_enum AS ENUM ('Pendiente', 'Pagada');
CREATE TYPE tipo_plataforma_broker_enum AS ENUM ('Local', 'Internacional');
CREATE TYPE tipo_activo_financiero_enum AS ENUM ('Accion', 'Bono', 'FCI', 'Cripto', 'CEDEAR');
CREATE TYPE moneda_compra_activo_enum AS ENUM ('ARS', 'USD');

-- 2. Tablas
-- USUARIOS
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CUENTAS_BANCARIAS
CREATE TABLE cuentas_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    banco_nombre VARCHAR(255) NOT NULL
);

-- PRODUCTOS_BANCARIOS
CREATE TABLE productos_bancarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_bancaria_id UUID NOT NULL REFERENCES cuentas_bancarias(id) ON DELETE CASCADE,
    tipo_producto tipo_producto_enum NOT NULL,
    identificador VARCHAR(255) NOT NULL,
    saldo_o_limite DECIMAL(12, 2) NOT NULL DEFAULT 0.00
);

-- CATEGORIAS
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    tipo_categoria tipo_categoria_enum NOT NULL
);

-- MOVIMIENTOS
CREATE TABLE movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_bancario_id UUID NOT NULL REFERENCES productos_bancarios(id) ON DELETE RESTRICT,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    monto DECIMAL(12, 2) NOT NULL,
    fecha DATE NOT NULL,
    tipo tipo_movimiento_enum NOT NULL,
    descripcion VARCHAR(255)
);

-- CUOTAS
CREATE TABLE cuotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimiento_id UUID NOT NULL REFERENCES movimientos(id) ON DELETE CASCADE,
    numero_cuota INT NOT NULL,
    total_cuotas INT NOT NULL,
    monto_cuota DECIMAL(12, 2) NOT NULL,
    mes_cobro DATE NOT NULL,
    estado estado_cuota_enum NOT NULL DEFAULT 'Pendiente'
);

-- BROKERS
CREATE TABLE brokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    tipo_plataforma tipo_plataforma_broker_enum NOT NULL
);

-- ACTIVOS_FINANCIEROS
CREATE TABLE activos_financieros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE RESTRICT,
    ticker VARCHAR(50) NOT NULL,
    tipo_activo tipo_activo_financiero_enum NOT NULL,
    moneda_compra moneda_compra_activo_enum NOT NULL,
    cantidad DECIMAL(18, 8) NOT NULL,
    precio_compra DECIMAL(18, 8) NOT NULL
);

-- 3. Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE activos_financieros ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (RLS)
CREATE POLICY "Permitir gestión de perfil propio" ON usuarios 
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Permitir gestión de cuentas bancarias propias" ON cuentas_bancarias 
    FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Permitir gestión de productos bancarios propios" ON productos_bancarios 
    FOR ALL USING (cuenta_bancaria_id IN (SELECT id FROM cuentas_bancarias WHERE usuario_id = auth.uid()));

CREATE POLICY "Permitir gestión de categorias propias" ON categorias 
    FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Permitir gestión de brokers propios" ON brokers 
    FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Permitir gestión de movimientos propios" ON movimientos 
    FOR ALL USING (producto_bancario_id IN (SELECT id FROM productos_bancarios WHERE cuenta_bancaria_id IN (SELECT id FROM cuentas_bancarias WHERE usuario_id = auth.uid())));

CREATE POLICY "Permitir gestión de cuotas propias" ON cuotas 
    FOR ALL USING (movimiento_id IN (SELECT id FROM movimientos WHERE producto_bancario_id IN (SELECT id FROM productos_bancarios WHERE cuenta_bancaria_id IN (SELECT id FROM cuentas_bancarias WHERE usuario_id = auth.uid()))));

CREATE POLICY "Permitir gestión de activos propios" ON activos_financieros 
    FOR ALL USING (broker_id IN (SELECT id FROM brokers WHERE usuario_id = auth.uid()));

-- 5. Función transaccional para CU02: Registrar Movimiento
-- Garantiza atomicidad ACID: INSERT movimiento + UPDATE saldo_o_limite
CREATE OR REPLACE FUNCTION registrar_movimiento(
    p_producto_bancario_id UUID,
    p_categoria_id UUID,
    p_monto DECIMAL(12, 2),
    p_fecha DATE,
    p_tipo tipo_movimiento_enum,
    p_descripcion VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_movimiento_id UUID;
    v_delta DECIMAL(12, 2);
BEGIN
    -- Calcular delta según tipo de movimiento
    IF p_tipo = 'Ingreso' THEN
        v_delta := p_monto;
    ELSIF p_tipo = 'Gasto' THEN
        v_delta := -p_monto;
    ELSE -- Transferencia: no altera saldo aquí
        v_delta := 0;
    END IF;

    -- 1. Insertar el movimiento
    INSERT INTO movimientos (producto_bancario_id, categoria_id, monto, fecha, tipo, descripcion)
    VALUES (p_producto_bancario_id, p_categoria_id, p_monto, p_fecha, p_tipo, p_descripcion)
    RETURNING id INTO v_movimiento_id;

    -- 2. Actualizar saldo del producto bancario
    UPDATE productos_bancarios
    SET saldo_o_limite = saldo_o_limite + v_delta
    WHERE id = p_producto_bancario_id;

    RETURN v_movimiento_id;
END;
$$ LANGUAGE plpgsql;
