# Dominio y enlaces en correos (chocogol.site)

## 1. Vercel → Environment Variables

En **Production**, agrega o actualiza:

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://www.chocogol.site` |

Sin barra final. Guarda y haz **Redeploy** (los `NEXT_PUBLIC_*` se embeben en el build).

Opcional: si usas también `chocogol.site` sin `www`, configura redirección en Hostinger/Vercel al `www`.

## 2. Supabase → Authentication → URL Configuration

En el proyecto `zpmjazocmuxswkmkzibt` (o el que uses):

- **Site URL:** `https://www.chocogol.site`
- **Redirect URLs** (una por línea):

```
https://www.chocogol.site/**
https://chocogol.site/**
http://localhost:3000/**
```

Si Site URL sigue en `http://localhost:3000`, muchos correos de confirmación y recuperación seguirán saliendo con localhost aunque la app en Vercel esté bien.

## 3. Plantillas de correo (opcional)

**Authentication → Email Templates:** revisa que los botones usen `{{ .ConfirmationURL }}` o `{{ .RedirectTo }}`, no un enlace fijo a localhost.

## 4. Local

En `.env.local` deja `NEXT_PUBLIC_APP_URL=http://localhost:3000` para desarrollo. En producción solo cuenta la variable de Vercel.

## 5. Comprobar

1. Registro o “Olvidé mi contraseña” desde `https://www.chocogol.site`.
2. El enlace del correo debe empezar por `https://www.chocogol.site/...`.
3. En Ajustes de polla, el link de invitación debe usar el mismo dominio.
