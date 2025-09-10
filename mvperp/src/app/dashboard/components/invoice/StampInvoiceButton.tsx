// components/StampInvoiceButton.tsx (corregido)
"use client";

import { useState } from "react";

interface StampInvoiceButtonProps {
  invoiceId: string;
  onStamped?: () => void;
}

export default function StampInvoiceButton({
  invoiceId,
  onStamped,
}: StampInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStamp = async () => {
    setLoading(true);
    setError("");

    try {
      console.log(`Iniciando timbrado para factura: ${invoiceId}`);
      const response = await fetch(`/api/invoices/${invoiceId}/stamp`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error en respuesta:", errorData);
        throw new Error(errorData.error || "Error al timbrar la factura");
      }

      const result = await response.json();
      console.log("Timbrado exitoso. Resultado:", result);

      if (onStamped) {
        onStamped();
      }

      alert(
        "✅ Factura timbrada correctamente. El PDF puede tardar unos minutos en generarse."
      );

      // Esperar antes de intentar abrir el PDF
      setTimeout(() => {
        if (result.pdfUrl) {
          console.log("Abriendo PDF:", result.pdfUrl);
          window.open(result.pdfUrl, "_blank");
        }
      }, 5000); // 5 segundos de espera
    } catch (err) {
      console.error("Error en timbrado:", err);
      setError(
        err instanceof Error ? err.message : "Error desconocido al timbrar"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleStamp}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "⏳ Timbrando..." : "📝 Timbrar con Facturama"}
      </button>
      {error && (
        <div className="text-red-600 mt-2 text-sm bg-red-50 p-2 rounded">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
