-- Tabla de pollas: listar todos los miembros y unirse sin depender de RLS frágil en producción

CREATE OR REPLACE FUNCTION public.user_in_pool(_pool_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pool_members pm
    WHERE pm.pool_id = _pool_id AND pm.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.users_share_pool(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pool_members x
    JOIN public.pool_members y ON x.pool_id = y.pool_id
    WHERE x.user_id = _a AND y.user_id = _b
  );
$$;

REVOKE ALL ON FUNCTION public.user_in_pool(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.users_share_pool(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_in_pool(uuid, uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.users_share_pool(uuid, uuid) TO authenticated, anon, service_role;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_copool" ON public.profiles;
CREATE POLICY "profiles_select_copool" ON public.profiles FOR SELECT USING (
  public.users_share_pool(auth.uid(), profiles.id)
);

DROP POLICY IF EXISTS "pool_members_select_pool" ON public.pool_members;
CREATE POLICY "pool_members_select_pool" ON public.pool_members FOR SELECT USING (
  public.user_in_pool(pool_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.pools p
    WHERE p.id = pool_members.pool_id AND p.admin_id = auth.uid()
  )
);

-- Leaderboard con nombres (solo si eres miembro o admin de esa polla)
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

REVOKE ALL ON FUNCTION public.list_pool_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_pool_members(uuid) TO authenticated;

-- Unirse a polla (crea perfil si falta; ignora duplicados)
CREATE OR REPLACE FUNCTION public.join_pool(p_pool_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  max_m int;
  cnt bigint;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid) THEN
    INSERT INTO public.profiles (id, username, display_name)
    SELECT
      uid,
      COALESCE(
        NULLIF(trim(u.raw_user_meta_data->>'username'), ''),
        'user_' || replace(substr(uid::text, 1, 8), '-', '')
      ),
      COALESCE(
        NULLIF(trim(u.raw_user_meta_data->>'display_name'), ''),
        split_part(COALESCE(u.email, 'usuario'), '@', 1)
      )
    FROM auth.users u
    WHERE u.id = uid
    ON CONFLICT (id) DO NOTHING;
  END IF;

  SELECT COALESCE(max_members, 100) INTO max_m FROM public.pools WHERE id = p_pool_id;
  IF max_m IS NULL THEN
    RAISE EXCEPTION 'pool_not_found';
  END IF;

  SELECT count(*) INTO cnt FROM public.pool_members WHERE pool_id = p_pool_id;
  IF cnt >= max_m THEN
    RAISE EXCEPTION 'pool_full';
  END IF;

  INSERT INTO public.pool_members (pool_id, user_id)
  VALUES (p_pool_id, uid)
  ON CONFLICT (pool_id, user_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.join_pool(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_pool(uuid) TO authenticated;
