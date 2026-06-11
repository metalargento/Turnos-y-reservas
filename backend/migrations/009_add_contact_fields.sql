-- Add contact information fields to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS facebook_url TEXT;
