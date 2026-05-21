"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const PRESET_AMOUNTS = [10000, 20000, 30000, 50000];

export function DonationWidget() {
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const finalAmount = amount ?? (customAmount ? parseInt(customAmount, 10) : null);
  const canDonate = finalAmount != null && finalAmount >= 1000 && !Number.isNaN(finalAmount);

  const handleDonate = async () => {
    if (!canDonate || loading) return;
    setLoading(true);
    const toastId = toast.loading("Preparando pago en Mercado Pago…", {
      description: "En un momento te redirigimos al checkout.",
    });
    try {
      const res = await fetch("/api/payments/donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          donorName: donorName || "Anónimo",
          donorEmail: donorEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = (data as { error?: string; hint?: string }).error ?? "No se pudo iniciar el pago";
        const hint = (data as { hint?: string }).hint;
        toast.error(err, { id: toastId, description: hint });
        setLoading(false);
        return;
      }
      if (data.initPoint) {
        toast.loading("Redirigiendo al checkout…", { id: toastId });
        if (data.testMode) {
          toast.message("Modo prueba de Mercado Pago", {
            description:
              "Usa tarjetas de prueba o cierra sesión de MP. Tus tarjetas reales no funcionan en modo TEST.",
          });
        }
        window.location.href = data.initPoint as string;
        return;
      }
      toast.error("No se recibió el enlace de pago.", { id: toastId });
      setLoading(false);
    } catch {
      toast.error("Error de red. Revisa tu conexión e intenta de nuevo.", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div
      className="relative space-y-5 rounded-2xl border border-zinc-700 bg-zinc-900 p-6"
      data-skip-nav-progress
    >
      {loading && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-zinc-950/85 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="h-11 w-11 animate-spin text-yellow-400" aria-hidden />
          <p className="mt-4 text-sm font-semibold text-white">Preparando tu donación…</p>
          <p className="mt-1 text-xs text-zinc-400">Mercado Pago se abrirá en segundos</p>
        </div>
      )}

      <fieldset disabled={loading} className="space-y-5 border-0 p-0 disabled:opacity-60">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset);
                setCustomAmount("");
              }}
              className={`rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${
                amount === preset && !customAmount
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              ${(preset / 1000).toFixed(0)}k
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Otro valor (COP)</label>
          <input
            type="number"
            min={1000}
            step={1000}
            placeholder="Ej: 25000"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setAmount(null);
            }}
            className="w-full rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Correo (recomendado para el pago)</label>
          <input
            type="email"
            placeholder="tu@correo.com"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Tu nombre (opcional)</label>
          <input
            type="text"
            placeholder="Anónimo"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="w-full rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400"
          />
        </div>

        {canDonate && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-center">
            <p className="font-bold text-yellow-400">
              Donación: ${finalAmount!.toLocaleString("es-CO")} COP
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleDonate}
          disabled={loading || !canDonate}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3 text-base font-bold text-black transition-all hover:bg-yellow-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span>Conectando…</span>
            </>
          ) : (
            "Donar con MercadoPago"
          )}
        </button>
      </fieldset>

      <p className="text-center text-xs text-zinc-500">
        Pago seguro vía MercadoPago · PSE · Nequi · Daviplata · Tarjetas
      </p>
    </div>
  );
}
