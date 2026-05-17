-- Ver tu propio is_admin aunque no estés en ninguna polla (RLS profiles_select_own)

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Lectura fiable de is_admin (bypass RLS solo para la fila del usuario actual)
CREATE OR REPLACE FUNCTION public.am_i_tournament_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.am_i_tournament_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.am_i_tournament_admin() TO authenticated;
