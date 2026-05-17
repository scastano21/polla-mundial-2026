-- ═══════════════════════════════════════════════════════════════
-- Admin del TORNEO (panel /admin — resultados del Mundial)
-- Ejecutar en Supabase → SQL Editor (después de migrations o FIX_PRODUCTION)
-- ═══════════════════════════════════════════════════════════════

-- Cambia el correo por el de la cuenta con la que entras a la app:
SELECT public.grant_tournament_admin('sebascossio1990@gmail.com');

-- Verificar:
SELECT u.email, p.username, p.is_admin, p.id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) = lower('sebascossio1990@gmail.com');
