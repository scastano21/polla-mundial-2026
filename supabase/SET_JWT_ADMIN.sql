-- Ejecutar en Supabase SQL Editor (una vez).
-- Pone admin en profiles Y en el JWT (app_metadata). Luego: cerrar sesión y volver a entrar.

UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('tournament_admin', true)
WHERE lower(trim(email)) = lower('sebascossio1990@gmail.com');

UPDATE public.profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users
  WHERE lower(trim(email)) = lower('sebascossio1990@gmail.com')
  LIMIT 1
);

SELECT
  u.email,
  u.raw_app_meta_data->>'tournament_admin' AS jwt_admin,
  p.is_admin AS db_admin
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = lower('sebascossio1990@gmail.com');
