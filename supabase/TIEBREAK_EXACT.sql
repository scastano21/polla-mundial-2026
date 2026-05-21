-- Producción: desempate por marcadores exactos (tras puntos totales).

CREATE OR REPLACE FUNCTION public.recalculate_pool_rankings(p_pool_id UUID) RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             ORDER BY total_points DESC, exact_scores DESC, user_id ASC
           ) AS new_rank
    FROM pool_members WHERE pool_id = p_pool_id
  )
  UPDATE pool_members pm SET rank = r.new_rank FROM ranked r WHERE pm.id = r.id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.list_pool_members(p_pool_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  total_points int,
  exact_scores int,
  correct_results int,
  rank int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    pm.user_id,
    pr.username,
    pr.display_name,
    pm.total_points,
    pm.exact_scores,
    pm.correct_results,
    pm.rank
  FROM public.pool_members pm
  JOIN public.profiles pr ON pr.id = pm.user_id
  WHERE pm.pool_id = p_pool_id
    AND (
      public.user_in_pool(p_pool_id, auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.pools p
        WHERE p.id = p_pool_id AND p.admin_id = auth.uid()
      )
    )
  ORDER BY pm.total_points DESC, pm.exact_scores DESC, pm.user_id ASC;
$$;

-- Recalcular posiciones en todas las pollas (una vez, opcional):
-- SELECT public.recalculate_pool_rankings(id) FROM public.pools;
