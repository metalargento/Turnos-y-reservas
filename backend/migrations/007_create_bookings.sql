-- ============================================
-- Migración 007: Tabla de reservas
-- ============================================
-- Reservas de turnos de clientes finales

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,

    -- Datos del cliente final (sin registro)
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    client_notes TEXT,

    -- Tiempo
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,

    -- Estado
    status TEXT CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')) DEFAULT 'confirmed',
    cancelled_by TEXT CHECK (cancelled_by IN ('client', 'professional', 'admin')),
    cancellation_reason TEXT,

    -- Pago (plugin de cobro)
    payment_required BOOLEAN DEFAULT FALSE,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    payment_amount DECIMAL(10,2),
    payment_id TEXT,  -- ID de pago de Mercado Pago

    -- Tracking
    confirmation_token TEXT UNIQUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bookings_business_id ON bookings(business_id);
CREATE INDEX idx_bookings_professional_id ON bookings(professional_id);
CREATE INDEX idx_bookings_starts_at ON bookings(starts_at);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_confirmation_token ON bookings(confirmation_token);
CREATE INDEX idx_bookings_client_email ON bookings(client_email);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE bookings IS 'Reservas de turnos de clientes finales';
COMMENT ON COLUMN bookings.status IS 'confirmed: activo, cancelled: cancelado, rescheduled: reprogramado, completed: finalizado';
COMMENT ON COLUMN bookings.confirmation_token IS 'Token único para que el cliente pueda cancelar/reprogramar sin cuenta';
COMMENT ON COLUMN bookings.payment_id IS 'ID de pago de Mercado Pago (si aplica)';
