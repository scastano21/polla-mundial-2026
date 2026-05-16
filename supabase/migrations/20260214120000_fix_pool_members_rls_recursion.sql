-- Corrige: infinite recursion detected in policy for relation "pool_members"
-- Las políticas que consultaban pool_members desde sí mismas re-disparaban RLS.
-- Ejecutar una vez en SQL Editor de Supabase si ya aplicaste un schema anterior.

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

DROP POLICY IF EXISTS "profiles_select_copool" ON profiles;
CREATE POLICY "profiles_select_copool" ON profiles FOR SELECT USING (
  public.users_share_pool(auth.uid(), profiles.id)
);

DROP POLICY IF EXISTS "pools_select_member_or_public" ON pools;
CREATE POLICY "pools_select_member_or_public" ON pools FOR SELECT USING (
  is_public = true
  OR admin_id = auth.uid()
  OR public.user_in_pool(id, auth.uid())
);

DROP POLICY IF EXISTS "pool_members_select_pool" ON pool_members;
CREATE POLICY "pool_members_select_pool" ON pool_members FOR SELECT USING (
  public.user_in_pool(pool_id, auth.uid())
  OR EXISTS (SELECT 1 FROM pools p WHERE p.id = pool_members.pool_id AND p.admin_id = auth.uid())
);

DROP POLICY IF EXISTS "scoring_rules_select_pool" ON scoring_rules;
CREATE POLICY "scoring_rules_select_pool" ON scoring_rules FOR SELECT USING (
  public.user_in_pool(scoring_rules.pool_id, auth.uid())
  OR EXISTS (SELECT 1 FROM pools p WHERE p.id = scoring_rules.pool_id AND p.admin_id = auth.uid())
);
