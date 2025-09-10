// app/dashboard/invoices/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Invoice } from "@/types/invoice";
import StampInvoiceButton from "@/app/dashboard/components/invoice/StampInvoiceButton";

export default function InvoiceDetail() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${params.id}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Error al cargar la factura");

        const data = await res.json();
        setInvoice(data.invoice);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la factura");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id]);

  const handleStamped = () => {
    // Recargar la factura para ver los cambios
    router.refresh();
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!invoice) return <div>Factura no encontrada</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Factura{" "}
          {invoice.serie && invoice.folio
            ? `${invoice.serie}-${invoice.folio}`
            : `#${invoice.id?.slice(0, 8)}`}
        </h1>
        <Link
          href="/dashboard/invoices"
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
        >
          Volver
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="font-semibold text-gray-700">Información General</h2>
            <p>
              Estado:{" "}
              <span
                className={
                  invoice.status === "stamped"
                    ? "text-green-600"
                    : "text-yellow-600"
                }
              >
                {invoice.status}
              </span>
            </p>
            <p>
              Fecha: {new Date(invoice.createdAt || "").toLocaleDateString()}
            </p>
            {invoice.uuid && <p>UUID: {invoice.uuid}</p>}
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Cliente</h2>
            <p>{invoice.customer?.name}</p>
            <p>RFC: {invoice.customer?.rfc || "N/A"}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-2">
            Productos/Servicios
          </h2>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2">Descripción</th>
                <th className="text-right p-2">Cantidad</th>
                <th className="text-right p-2">Precio</th>
                <th className="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoiceItems?.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{item.saleItem?.description}</td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">
                    ${item.totalPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
          <div className="text-right font-semibold">Subtotal:</div>
          <div className="text-right">${invoice.subtotal?.toFixed(2)}</div>

          <div className="text-right font-semibold">IVA (16%):</div>
          <div className="text-right">${invoice.taxes?.toFixed(2)}</div>

          <div className="text-right font-bold text-lg border-t pt-2">
            Total:
          </div>
          <div className="text-right font-bold text-lg border-t pt-2">
            ${((invoice.subtotal || 0) + (invoice.taxes || 0)).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        {invoice.status === "pending" && (
          <StampInvoiceButton
            invoiceId={invoice.id!}
            onStamped={handleStamped}
          />
        )}

        {invoice.status === "stamped" && (
          <>
            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Descargar PDF
            </a>

            {invoice.verificationUrl && (
              <a
                href={invoice.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Verificar en SAT
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
