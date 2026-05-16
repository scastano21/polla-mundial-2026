import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createServiceClient } from "@/lib/supabase/service";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? "",
});

export async function POST(request: Request) {
  let body: { type?: string; data?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ received: true });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ received: true });
  }

  const paymentApi = new Payment(mp);
  const paymentData = await paymentApi.get({ id: body.data.id });

  const donationId = paymentData.metadata?.donation_id as string | undefined;
  if (!donationId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();
  await supabase
    .from("donations")
    .update({
      mp_payment_id: String(body.data.id),
      mp_status: paymentData.status ?? "unknown",
      donor_email: paymentData.payer?.email ?? null,
    })
    .eq("id", donationId);

  return NextResponse.json({ received: true });
}
