ALTER TABLE pool_members
  ADD COLUMN IF NOT EXISTS advancement_points INT NOT NULL DEFAULT 0;

ALTER TABLE scoring_rules
  ADD COLUMN IF NOT EXISTS advancement_team_points INT NOT NULL DEFAULT 3;

COMMENT ON COLUMN scoring_rules.advancement_team_points IS
  'Puntos por cada equipo que el usuario proyectó en una ronda KO y que oficialmente está en esa ronda.';

COMMENT ON COLUMN pool_members.advancement_points IS
  'Suma de puntos por clasificados acertados en eliminatoria (incluido en total_points).';
