-- ============================================
-- Migración 002: Tabla de negocios
-- ============================================
-- Negocios suscriptos al sistema (pueden tener múltiples sucursales)
-- Incluye configuración de marca blanca, email y Google Calendar

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    rubro TEXT,
    description TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#000000',
    secondary_color TEXT DEFAULT '#FFFFFF',

    -- Estado del plan
    plan_status TEXT CHECK (plan_status IN ('active', 'expired', 'cancelled')) DEFAULT 'expired',
    plan_expires_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT FALSE,

    -- Configuración de email (Resend o SMTP propio)
    email_provider TEXT CHECK (email_provider IN ('resend', 'smtp')) DEFAULT 'resend',
    smtp_host TEXT,
    smtp_port INT,
    smtp_user TEXT,
    smtp_password_encrypted TEXT,

    -- Configuración de Google Calendar
    google_calendar_enabled BOOLEAN DEFAULT FALSE,
    google_calendar_token_encrypted TEXT,

    -- Configuración de agenda
    min_advance_hours INT DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_plan_status ON businesses(plan_status);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE businesses IS 'Negocios suscriptos al sistema de reservas';
COMMENT ON COLUMN businesses.slug IS 'Identificador único para URL pública (ej: peluqueria-juan)';
COMMENT ON COLUMN businesses.plan_status IS 'active: pago al día, expired/cancelled: sin servicio';
COMMENT ON COLUMN businesses.min_advance_hours IS 'Horas mínimas de anticipación para reservar';
