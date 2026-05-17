-- Si is_admin = true en SQL pero NO ves «Admin torneo» en la web, ejecuta ESTO y recarga.

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

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

-- Prueba (logueado en la app no aplica aquí; usa Table Editor o el SELECT de abajo):
-- SELECT public.am_i_tournament_admin();

SELECT u.email, p.is_admin
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = lower('sebascossio1990@gmail.com');
