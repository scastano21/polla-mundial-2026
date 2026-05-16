"use client";

import { useState } from "react";
import { toast } from "sonner";

const PRESET_AMOUNTS = [5000, 10000, 15000, 20000];

export function DonationWidget() {
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const finalAmount = amount ?? (customAmount ? parseInt(customAmount, 10) : null);

  const handleDonate = async () => {
    if (!finalAmount || finalAmount < 1000 || Number.isNaN(finalAmount)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payments/donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          donorName: donorName || "Anónimo",
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = (data as { error?: string; hint?: string }).error ?? "No se pudo iniciar el pago";
        const hint = (data as { hint?: string }).hint;
        toast.error(err, hint ? { description: hint } : undefined);
        return;
      }
      if (data.initPoint) {
        window.location.href = data.initPoint as string;
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-700 bg-zinc-900 p-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setAmount(preset);
              setCustomAmount("");
            }}
            className={`rounded-xl py-3 text-sm font-bold transition-all ${
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
        <label className="mb-1 block text-xs text-zinc-400">Tu nombre (opcional)</label>
        <input
          type="text"
          placeholder="Anónimo"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          className="w-full rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-400">Mensaje (opcional)</label>
        <input
          type="text"
          placeholder="¡Arriba Colombia!"
          value={message}
          maxLength={100}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400"
        />
      </div>

      {finalAmount != null && finalAmount >= 1000 && !Number.isNaN(finalAmount) && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-center">
          <p className="font-bold text-yellow-400">
            Donación: ${finalAmount.toLocaleString("es-CO")} COP
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleDonate}
        disabled={loading || !finalAmount || finalAmount < 1000}
        className="w-full rounded-xl bg-yellow-500 py-3 text-base font-bold text-black transition-all hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Redirigiendo..." : "Donar con MercadoPago"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Pago seguro vía MercadoPago · PSE · Nequi · Daviplata · Tarjetas
      </p>
    </div>
  );
}
