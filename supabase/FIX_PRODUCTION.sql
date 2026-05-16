-- ═══════════════════════════════════════════════════════════════
-- Ejecutar TODO este archivo en Supabase → SQL Editor (producción)
-- Luego: Settings → API → Reload schema (o esperar 1–2 min)
-- ═══════════════════════════════════════════════════════════════

-- Columnas que a veces faltan si la BD se creó con un schema antiguo
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS max_members INT DEFAULT 100;
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS premium_paid_at TIMESTAMPTZ;
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE public.pools ADD COLUMN IF NOT EXISTS description TEXT;

-- Invitación por código (unirse sin ser miembro aún)
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
