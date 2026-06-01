-- Migración para asegurar campos de imagen en businesses y professionals
-- (probablemente ya existan, pero esto es idempotente)

-- Asegurar que businesses tiene logo_url
ALTER TABLE IF EXISTS businesses
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Asegurar que professionals tiene avatar_url
ALTER TABLE IF EXISTS professionals
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Crear buckets en Supabase Storage (nota: esto requiere ejecutarse manualmente en Supabase dashboard)
-- COMMENT: Crear los buckets "logos" y "avatars" en Supabase Storage console
-- 1. Ir a Storage en dashboard de Supabase
-- 2. Crear bucket "logos" (público)
-- 3. Crear bucket "avatars" (público)
