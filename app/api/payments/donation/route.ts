import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createServiceClient } from "@/lib/supabase/service";
import { MIN_DONATION_COP } from "@/lib/donation";
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

  const { amount, donorName, message, donorEmail } = await request.json();
  const amt = Number(amount);
  if (!amt || amt < MIN_DONATION_COP) {
    return NextResponse.json(
      { error: `Monto mínimo: $${MIN_DONATION_COP.toLocaleString("es-CO")} COP` },
      { status: 400 }
    );
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

  const isTestToken = token.startsWith("TEST-");
  const mp = new MercadoPagoConfig({ accessToken: token });
  const preference = new Preference(mp);

  const email =
    typeof donorEmail === "string" && donorEmail.includes("@") ? donorEmail.trim() : undefined;

  const result = await preference.create({
    body: {
      items: [
        {
          id: `donation-${donation.id}`,
          title: "Donación Chocogol",
          description: (message as string) || `Donación de ${donorName || "Anónimo"}`,
          quantity: 1,
          currency_id: "COP",
          unit_price: amt,
        },
      ],
      payer: email ? { email, name: (donorName as string) || undefined } : undefined,
      back_urls: {
        success: `${appUrl}/donate/gracias?id=${donation.id}`,
        failure: `${appUrl}/donate?status=error`,
        pending: `${appUrl}/donate/gracias?id=${donation.id}&status=pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/payments/webhook-donation`,
      external_reference: donation.id,
      metadata: { donation_id: donation.id },
      statement_descriptor: "CHOCOGOL",
    },
  });

  const initPoint = isTestToken
    ? (result.sandbox_init_point ?? result.init_point)
    : (result.init_point ?? result.sandbox_init_point);

  if (!initPoint) {
    return NextResponse.json(
      {
        error: "Mercado Pago no devolvió URL de pago.",
        hint: isTestToken
          ? "Revisa que MP_ACCESS_TOKEN sea de prueba y la app esté activa en Developers."
          : "Usa credenciales de producción (APP_USR-) con cuenta vendedor verificada.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    preferenceId: result.id,
    initPoint,
    testMode: isTestToken,
  });
}
