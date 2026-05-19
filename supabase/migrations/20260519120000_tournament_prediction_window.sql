-- Cierre global de pronósticos: 5 minutos antes del partido inaugural (#1).

CREATE OR REPLACE FUNCTION public.tournament_predictions_window_open()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    now() < (
      SELECT COALESCE(
        (SELECT m.match_date - interval '5 minutes'
         FROM matches m
         WHERE m.match_number = 1
         LIMIT 1),
        (SELECT min(m2.match_date) - interval '5 minutes' FROM matches m2)
      )
    ),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.tournament_predictions_window_open() TO authenticated;

DROP POLICY IF EXISTS "predictions_insert_own" ON predictions;
CREATE POLICY "predictions_insert_own" ON predictions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.tournament_predictions_window_open()
  );

DROP POLICY IF EXISTS "predictions_update_own_unlocked" ON predictions;
CREATE POLICY "predictions_update_own_unlocked" ON predictions
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND is_locked = false
    AND public.tournament_predictions_window_open()
  );

DROP POLICY IF EXISTS "honor_pred_insert_own" ON honor_predictions;
CREATE POLICY "honor_pred_insert_own" ON honor_predictions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.tournament_predictions_window_open()
  );

DROP POLICY IF EXISTS "honor_pred_update_own_open" ON honor_predictions;
CREATE POLICY "honor_pred_update_own_open" ON honor_predictions
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND public.tournament_predictions_window_open()
  );
