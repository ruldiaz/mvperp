// components/invoice/CancelInvoiceButton.tsx
"use client";

import { useState } from "react";

interface CancelInvoiceButtonProps {
  invoiceId: string;
  onCancelled: () => void;
}

const MOTIVOS_CANCELACION = [
  {
    value: "01",
    label: "01 - Comprobante emitido con errores con relación",
    requiresReplacement: true,
  },
  {
    value: "02",
    label: "02 - Comprobante emitido con errores sin relación",
    requiresReplacement: false,
  },
  {
    value: "03",
    label: "03 - No se llevó a cabo la operación",
    requiresReplacement: false,
  },
  {
    value: "04",
    label: "04 - Operación nominativa relacionada en una factura global",
    requiresReplacement: false,
  },
];

export default function CancelInvoiceButton({
  invoiceId,
  onCancelled,
}: CancelInvoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [folioSustituto, setFolioSustituto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedMotivo = MOTIVOS_CANCELACION.find((m) => m.value === motivo);
  const requiresReplacement = selectedMotivo?.requiresReplacement || false;

  // components/invoice/CancelInvoiceButton.tsx - Manejo de errores mejorado
  const handleCancel = async () => {
    if (!motivo) {
      setError("Selecciona un motivo de cancelación");
      return;
    }

    if (requiresReplacement && !folioSustituto) {
      setError("El folio sustituto es requerido para este motivo");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          motivo,
          folioSustituto: requiresReplacement ? folioSustituto : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 👇 Mostrar el error real del backend
        throw new Error(
          data.message || data.error || "Error al cancelar la factura"
        );
      }

      setIsOpen(false);
      onCancelled();

      alert(data.message || "Factura cancelada correctamente");
    } catch (err) {
      // 👇 Mostrar el error completo
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      console.error("Error completo:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        Cancelar Factura
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Cancelar Factura</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de cancelación *
                </label>
                <select
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value);
                    setFolioSustituto("");
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar motivo</option>
                  {MOTIVOS_CANCELACION.map((motivo) => (
                    <option key={motivo.value} value={motivo.value}>
                      {motivo.label}
                    </option>
                  ))}
                </select>
              </div>

              {requiresReplacement && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UUID de la factura que sustituye *
                  </label>
                  <input
                    type="text"
                    value={folioSustituto}
                    onChange={(e) => setFolioSustituto(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="UUID de la factura sustituta"
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa el UUID de la factura que reemplaza a esta
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleCancel}
                disabled={
                  loading || !motivo || (requiresReplacement && !folioSustituto)
                }
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {loading ? "Cancelando..." : "Confirmar Cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
