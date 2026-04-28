-- ============================================
-- Migración 006: Tablas de disponibilidad y bloqueos
-- ============================================
-- Disponibilidad semanal regular y bloqueos manuales

-- Disponibilidad semanal del profesional (horarios regulares)
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Domingo, 1=Lunes... 6=Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_availability_professional_id ON availability(professional_id);
CREATE INDEX idx_availability_day_of_week ON availability(day_of_week);
CREATE INDEX idx_availability_is_active ON availability(is_active);

-- Comentarios
COMMENT ON TABLE availability IS 'Disponibilidad semanal regular de cada profesional';
COMMENT ON COLUMN availability.day_of_week IS '0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado';

-- ============================================
-- Bloqueos de fechas (feriados, vacaciones, ausencias)
-- ============================================

CREATE TABLE schedule_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    blocked_from TIMESTAMPTZ NOT NULL,
    blocked_until TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_schedule_blocks_professional_id ON schedule_blocks(professional_id);
CREATE INDEX idx_schedule_blocks_dates ON schedule_blocks(blocked_from, blocked_until);

-- Comentarios
COMMENT ON TABLE schedule_blocks IS 'Bloqueos manuales de agenda (vacaciones, feriados, ausencias)';
COMMENT ON COLUMN schedule_blocks.reason IS 'Motivo del bloqueo (visible solo para admin)';
