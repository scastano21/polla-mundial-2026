# Documentación — Chocogol / Polla Mundial 2026

Índice de la documentación técnica del proyecto.

| Documento | Contenido |
|-----------|-----------|
| [DOCUMENTACION-TECNICA.md](./DOCUMENTACION-TECNICA.md) | **Documento principal** — arquitectura, BD, APIs, código, despliegue |
| [DOMINIO-Y-EMAILS.md](./DOMINIO-Y-EMAILS.md) | Dominio, Supabase Auth, URLs de correo |
| [MERCADOPAGO.md](./MERCADOPAGO.md) | Donaciones y Checkout Pro |

## Repositorio

- GitHub: `scastano21/polla-mundial-2026`
- Producción: https://www.chocogol.site

## Inicio rápido (desarrollo)

```bash
cp .env.example .env.local
# Completar NEXT_PUBLIC_SUPABASE_URL, anon key, service role
npm install
npm run seed          # opcional: carga equipos y 104 partidos
npm run dev
```

Ver sección *Desarrollo local* en [DOCUMENTACION-TECNICA.md](./DOCUMENTACION-TECNICA.md).
