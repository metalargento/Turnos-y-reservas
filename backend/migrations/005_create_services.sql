-- ============================================
-- Migración 005: Tabla de servicios
-- ============================================
-- Servicios que ofrece el negocio
-- Incluye duración y precio opcional

CREATE TABLE services (
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

-- Índice para filtrar por negocio y estado
CREATE INDEX idx_services_business_id ON services(business_id);
CREATE INDEX idx_services_is_active ON services(is_active);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE services IS 'Servicios que ofrece un negocio';
COMMENT ON COLUMN services.duration_minutes IS 'Duración del servicio en minutos';
COMMENT ON COLUMN services.price IS 'Precio del servicio (null si no tiene cobro online)';

-- ============================================
-- Tabla de relación profesional ↔ servicios
-- ============================================
-- Qué servicios puede realizar cada profesional

CREATE TABLE professional_services (
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (professional_id, service_id)
);

-- Índices para consultas eficientes
CREATE INDEX idx_professional_services_professional ON professional_services(professional_id);
CREATE INDEX idx_professional_services_service ON professional_services(service_id);

-- Comentarios
COMMENT ON TABLE professional_services IS 'Relación muchos-a-muchos: servicios que puede realizar cada profesional';
