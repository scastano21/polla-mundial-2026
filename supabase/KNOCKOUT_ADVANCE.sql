-- Ejecutar en Supabase SQL Editor si no usas migraciones automáticas.
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS predicted_advance_team_id UUID REFERENCES teams(id);
