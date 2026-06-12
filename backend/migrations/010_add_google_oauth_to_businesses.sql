-- Agregar campos para Google OAuth2 (para envío de emails)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_email VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMP;

-- Índice para búsquedas por google_email
CREATE INDEX IF NOT EXISTS idx_businesses_google_email ON businesses(google_email);
