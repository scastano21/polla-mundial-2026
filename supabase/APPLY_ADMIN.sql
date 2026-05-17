-- ═══════════════════════════════════════════════════════════════
-- PEGA TODO ESTE ARCHIVO en Supabase → SQL Editor → Run (una vez)
-- Luego cierra sesión en la web y vuelve a entrar.
-- ═══════════════════════════════════════════════════════════════

-- ── 1) Funciones y trigger de perfil ──────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''),
      'user_' || replace(substr(NEW.id::text, 1, 8), '-', '')
    ),
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
      split_part(COALESCE(NEW.email, 'usuario'), '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.ensure_my_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  uname text;
  dname text;
  rec public.profiles;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO rec FROM public.profiles WHERE id = uid;
  IF FOUND THEN
    RETURN rec;
  END IF;

  SELECT
    COALESCE(
      NULLIF(trim(u.raw_user_meta_data->>'username'), ''),
      'user_' || replace(substr(uid::text, 1, 8), '-', '')
    ),
    COALESCE(
      NULLIF(trim(u.raw_user_meta_data->>'display_name'), ''),
      split_part(COALESCE(u.email, 'usuario'), '@', 1)
    )
  INTO uname, dname
  FROM auth.users u
  WHERE u.id = uid;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (uid, uname, dname)
  ON CONFLICT (id) DO NOTHING
  RETURNING * INTO rec;

  IF NOT FOUND THEN
    SELECT * INTO rec FROM public.profiles WHERE id = uid;
  END IF;

  RETURN rec;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;

CREATE OR REPLACE FUNCTION public.grant_tournament_admin(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  uname text;
  dname text;
BEGIN
  SELECT id INTO uid
  FROM auth.users
  WHERE lower(trim(email)) = lower(trim(p_email))
  LIMIT 1;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'No existe usuario en Auth con email: %', p_email;
  END IF;

  SELECT
    COALESCE(
      NULLIF(trim(raw_user_meta_data->>'username'), ''),
      'user_' || replace(substr(uid::text, 1, 8), '-', '')
    ),
    COALESCE(
      NULLIF(trim(raw_user_meta_data->>'display_name'), ''),
      split_part(COALESCE(email, 'admin'), '@', 1)
    )
  INTO uname, dname
  FROM auth.users
  WHERE id = uid;

  INSERT INTO public.profiles (id, username, display_name, is_admin)
  VALUES (uid, uname, dname, true)
  ON CONFLICT (id) DO UPDATE SET is_admin = true;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_tournament_admin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_tournament_admin(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_tournament_admin(text) TO postgres;

-- ── 2) Marcar TU cuenta como admin (cambia el email si hace falta) ──

SELECT public.grant_tournament_admin('sebascossio1990@gmail.com'::text);

-- ── 3) Verificar ──────────────────────────────────────────────

SELECT u.email, p.username, p.is_admin, p.id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = lower('sebascossio1990@gmail.com');
