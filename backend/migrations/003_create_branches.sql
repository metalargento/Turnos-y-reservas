-- ============================================
-- Migración 003: Tabla de sucursales
-- ============================================
-- Cada negocio puede tener múltiples sucursales

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_branches_business_id ON branches(business_id);
CREATE INDEX idx_branches_is_active ON branches(is_active);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE branches IS 'Sucursales de un negocio';
COMMENT ON COLUMN branches.business_id IS 'Negocio al que pertenece la sucursal';
