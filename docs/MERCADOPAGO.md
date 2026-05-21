# Mercado Pago — donaciones

## Flujo

1. Usuario en `/donate` elige monto (mínimo **$10.000 COP**).
2. `POST /api/payments/donation` crea fila en `donations` y preferencia Checkout Pro.
3. Redirección a `init_point` (producción) o `sandbox_init_point` (token `TEST-`).
4. Webhook `POST /api/payments/webhook-donation` actualiza `mp_status` y `mp_payment_id`.

## Variables

| Variable | Uso |
|----------|-----|
| `MP_ACCESS_TOKEN` | Obligatorio en servidor |
| `NEXT_PUBLIC_APP_URL` | `back_urls` y `notification_url` |

## Webhook

URL: `{NEXT_PUBLIC_APP_URL}/api/payments/webhook-donation`

Configurar en Developers → Webhooks → evento **payment**.

## Código

- `components/donations/DonationWidget.tsx`
- `app/api/payments/donation/route.ts`
- `app/api/payments/webhook-donation/route.ts`
- `lib/donation.ts` — `MIN_DONATION_COP`
