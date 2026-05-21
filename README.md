# Chocogol — Polla Mundialista FIFA 2026

Aplicación web para crear pollas privadas del Mundial 2026: pronósticos, tabla de puntos, cuadro de honor y calendario oficial.

- **Producción:** https://www.chocogol.site
- **Stack:** Next.js 14 · Supabase · Vercel · Mercado Pago

## Documentación

Toda la documentación técnica (arquitectura, base de datos, APIs, despliegue) está en **[docs/](./docs/)**:

- [Documentación técnica completa](./docs/DOCUMENTACION-TECNICA.md)
- [Dominio y correos](./docs/DOMINIO-Y-EMAILS.md)
- [Mercado Pago](./docs/MERCADOPAGO.md)

## Desarrollo local

```bash
cp .env.example .env.local
# Completar variables Supabase (ver .env.example)
npm install
npm run seed    # opcional: equipos y 104 partidos
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Build producción (copia banderas + Next) |
| `npm run seed` | Carga inicial en Supabase |
| `npm run set-admin -- email@ejemplo.com` | Admin del torneo |

## Licencia

Proyecto privado — uso del repositorio según acuerdo del mantenedor.
