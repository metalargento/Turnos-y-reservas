-- ============================================
-- Migración 001: Tabla de usuarios del sistema
-- ============================================
-- Usuarios del sistema (owners y profesionales)
-- El rol define si es dueño del negocio o empleado

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('owner', 'professional')) NOT NULL,
    full_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por email (login)
CREATE INDEX idx_users_email ON users(email);

-- Índice para filtrar por rol
CREATE INDEX idx_users_role ON users(role);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios de documentación
COMMENT ON TABLE users IS 'Usuarios del sistema (owners y profesionales)';
COMMENT ON COLUMN users.role IS 'owner: dueño del negocio, professional: empleado';
