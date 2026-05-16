-- Permitir que miembros de la misma polla (y el admin) lean pronósticos de otros para transparencia.

CREATE POLICY "predictions_select_pool_members" ON predictions FOR SELECT USING (
  public.user_in_pool(predictions.pool_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM pools p WHERE p.id = predictions.pool_id AND p.admin_id = auth.uid()
  )
);

CREATE POLICY "honor_pred_select_pool_members" ON honor_predictions FOR SELECT USING (
  public.user_in_pool(honor_predictions.pool_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM pools p WHERE p.id = honor_predictions.pool_id AND p.admin_id = auth.uid()
  )
);
