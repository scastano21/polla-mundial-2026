-- Solo funciona DESPUÉS de ejecutar APPLY_ADMIN.sql (o la migración 20260217120000).
-- Si ves "function does not exist", usa APPLY_ADMIN.sql completo.

SELECT public.grant_tournament_admin('sebascossio1990@gmail.com'::text);

SELECT u.email, p.username, p.is_admin, p.id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = lower('sebascossio1990@gmail.com');
