-- ============================================
-- Migración 004: Tabla de profesionales
-- ============================================
-- Profesionales (empleados del negocio)
-- Vincula usuarios con negocios y sucursales

CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_professionals_user_id ON professionals(user_id);
CREATE INDEX idx_professionals_business_id ON professionals(business_id);
CREATE INDEX idx_professionals_branch_id ON professionals(branch_id);
CREATE INDEX idx_professionals_is_active ON professionals(is_active);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE professionals IS 'Profesionales (empleados) vinculados a un negocio';
COMMENT ON COLUMN professionals.user_id IS 'Usuario del sistema asociado (puede ser null si no tiene login)';
COMMENT ON COLUMN professionals.branch_id IS 'Sucursal donde trabaja el profesional';
