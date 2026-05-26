-- Producción: puntos por equipos que clasifican a cada ronda KO (pronóstico vs oficial).
ALTER TABLE pool_members
  ADD COLUMN IF NOT EXISTS advancement_points INT NOT NULL DEFAULT 0;

ALTER TABLE scoring_rules
  ADD COLUMN IF NOT EXISTS advancement_team_points INT NOT NULL DEFAULT 3;
