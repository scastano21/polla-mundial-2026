-- Quién pasa en eliminatoria cuando el usuario pronostica empate (solo proyección de cuadro).
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS predicted_advance_team_id UUID REFERENCES teams(id);

COMMENT ON COLUMN predictions.predicted_advance_team_id IS
  'Ganador pronosticado en KO si predicted_home_score = predicted_away_score; no afecta puntos.';
