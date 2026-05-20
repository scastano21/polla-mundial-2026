import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createServiceClient } from "@/lib/supabase/service";
import { getSiteUrl, isLocalhostUrl } from "@/lib/seo";

export async function POST(request: Request) {
  const token = process.env.MP_ACCESS_TOKEN;
  const appUrl = getSiteUrl();
  if (!token) {
    return NextResponse.json(
      {
        error: "Falta MP_ACCESS_TOKEN en el servidor.",
        hint: "En Mercado Pago → Tus integraciones crea una aplicación y copia el Access Token (puedes usar credenciales de prueba). Sin esto no se puede crear la preferencia de pago.",
      },
      { status: 500 }
    );
  }
  if (isLocalhostUrl(appUrl) && process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error: "NEXT_PUBLIC_APP_URL debe ser tu dominio público en Vercel.",
        hint: "Ej. https://www.chocogol.site — Mercado Pago y los correos usan esta URL.",
      },
      { status: 500 }
    );
  }

  const { amount, donorName, message } = await request.json();
  const amt = Number(amount);
  if (!amt || amt < 1000) {
    return NextResponse.json({ error: "Monto mínimo: $1.000 COP" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: donation, error: dErr } = await supabase
    .from("donations")
    .insert({
      donor_name: donorName || "Anónimo",
      message: message ?? null,
      amount_cop: amt,
      mp_status: "pending",
    })
    .select()
    .single();

  if (dErr || !donation) {
    return NextResponse.json({ error: dErr?.message ?? "No se pudo crear la donación" }, { status: 500 });
  }

  const mp = new MercadoPagoConfig({ accessToken: token });
  const preference = new Preference(mp);

  const result = await preference.create({
    body: {
      items: [
        {
          id: `donation-${donation.id}`,
          title: "Donación Polla Mundialista 2026",
          description: (message as string) || `Donación de ${donorName || "Anónimo"}`,
          quantity: 1,
          currency_id: "COP",
          unit_price: amt,
        },
      ],
      back_urls: {
        success: `${appUrl}/donate/gracias?id=${donation.id}`,
        failure: `${appUrl}/donate?status=error`,
        pending: `${appUrl}/donate/gracias?id=${donation.id}&status=pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/payments/webhook-donation`,
      metadata: { donation_id: donation.id },
      statement_descriptor: "POLLA MUNDIAL 2026",
    },
  });

  return NextResponse.json({
    preferenceId: result.id,
    initPoint: result.init_point,
  });
}
