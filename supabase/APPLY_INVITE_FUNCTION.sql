-- Ver supabase/FIX_PRODUCTION.sql (incluye columnas + función de invitación)

CREATE OR REPLACE FUNCTION public.pool_by_invite_code(p_code text)
RETURNS TABLE (
  id uuid,
  name text,
  invite_code text,
  max_members int,
  admin_id uuid,
  member_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id,
    p.name,
    p.invite_code,
    COALESCE(p.max_members, 100),
    p.admin_id,
    (SELECT count(*)::bigint FROM public.pool_members pm WHERE pm.pool_id = p.id) AS member_count
  FROM public.pools p
  WHERE upper(trim(p.invite_code)) = upper(trim(p_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.pool_by_invite_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pool_by_invite_code(text) TO authenticated;
