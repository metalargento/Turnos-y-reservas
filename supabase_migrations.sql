-- ============================================
-- Migración 001: Tabla de usuarios del sistema
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('owner', 'professional')) NOT NULL,
    full_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE users IS 'Usuarios del sistema (owners y profesionales)';
COMMENT ON COLUMN users.role IS 'owner: dueño del negocio, professional: empleado';

-- ============================================
-- Migración 002: Tabla de negocios
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    rubro TEXT,
    description TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#000000',
    secondary_color TEXT DEFAULT '#FFFFFF',
    plan_status TEXT CHECK (plan_status IN ('active', 'expired', 'cancelled')) DEFAULT 'expired',
    plan_expires_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    email_provider TEXT CHECK (email_provider IN ('resend', 'smtp')) DEFAULT 'resend',
    smtp_host TEXT,
    smtp_port INT,
    smtp_user TEXT,
    smtp_password_encrypted TEXT,
    google_calendar_enabled BOOLEAN DEFAULT FALSE,
    google_calendar_token_encrypted TEXT,
    min_advance_hours INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_plan_status ON businesses(plan_status);

DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE businesses IS 'Negocios suscriptos al sistema de reservas';
COMMENT ON COLUMN businesses.slug IS 'Identificador único para URL pública (ej: peluqueria-juan)';
COMMENT ON COLUMN businesses.plan_status IS 'active: pago al día, expired/cancelled: sin servicio';
COMMENT ON COLUMN businesses.min_advance_hours IS 'Horas mínimas de anticipación para reservar';

-- ============================================
-- Migración 003: Tabla de sucursales
-- ============================================
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_business_id ON branches(business_id);
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);

DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;
CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE branches IS 'Sucursales de un negocio';
COMMENT ON COLUMN branches.business_id IS 'Negocio al que pertenece la sucursal';

-- ============================================
-- Migración 004: Tabla de profesionales
-- ============================================
CREATE TABLE IF NOT EXISTS professionals (
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

CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_business_id ON professionals(business_id);
CREATE INDEX IF NOT EXISTS idx_professionals_branch_id ON professionals(branch_id);
CREATE INDEX IF NOT EXISTS idx_professionals_is_active ON professionals(is_active);

DROP TRIGGER IF EXISTS update_professionals_updated_at ON professionals;
CREATE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE professionals IS 'Profesionales (empleados) vinculados a un negocio';
COMMENT ON COLUMN professionals.user_id IS 'Usuario del sistema asociado (puede ser null si no tiene login)';
COMMENT ON COLUMN professionals.branch_id IS 'Sucursal donde trabaja el profesional';

-- ============================================
-- Migración 005: Tabla de servicios
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE services IS 'Servicios que ofrece un negocio';
COMMENT ON COLUMN services.duration_minutes IS 'Duración del servicio en minutos';
COMMENT ON COLUMN services.price IS 'Precio del servicio (null si no tiene cobro online)';

CREATE TABLE IF NOT EXISTS professional_services (
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (professional_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_professional_services_professional ON professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_service ON professional_services(service_id);

COMMENT ON TABLE professional_services IS 'Relación muchos-a-muchos: servicios que puede realizar cada profesional';

-- ============================================
-- Migración 006: Tablas de disponibilidad y bloqueos
-- ============================================
CREATE TABLE IF NOT EXISTS availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_professional_id ON availability(professional_id);
CREATE INDEX IF NOT EXISTS idx_availability_day_of_week ON availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_is_active ON availability(is_active);

COMMENT ON TABLE availability IS 'Disponibilidad semanal regular de cada profesional';
COMMENT ON COLUMN availability.day_of_week IS '0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado';

CREATE TABLE IF NOT EXISTS schedule_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    blocked_from TIMESTAMPTZ NOT NULL,
    blocked_until TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_professional_id ON schedule_blocks(professional_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_dates ON schedule_blocks(blocked_from, blocked_until);

COMMENT ON TABLE schedule_blocks IS 'Bloqueos manuales de agenda (vacaciones, feriados, ausencias)';
COMMENT ON COLUMN schedule_blocks.reason IS 'Motivo del bloqueo (visible solo para admin)';

-- ============================================
-- Migración 007: Tabla de reservas
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    client_notes TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')) DEFAULT 'confirmed',
    cancelled_by TEXT CHECK (cancelled_by IN ('client', 'professional', 'admin')),
    cancellation_reason TEXT,
    payment_required BOOLEAN DEFAULT FALSE,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    payment_amount DECIMAL(10,2),
    payment_id TEXT,
    confirmation_token TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_business_id ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_professional_id ON bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_starts_at ON bookings(starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_token ON bookings(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_bookings_client_email ON bookings(client_email);

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE bookings IS 'Reservas de turnos de clientes finales';
COMMENT ON COLUMN bookings.status IS 'confirmed: activo, cancelled: cancelado, rescheduled: reprogramado, completed: finalizado';
COMMENT ON COLUMN bookings.confirmation_token IS 'Token único para que el cliente pueda cancelar/reprogramar sin cuenta';
COMMENT ON COLUMN bookings.payment_id IS 'ID de pago de Mercado Pago (si aplica)';
