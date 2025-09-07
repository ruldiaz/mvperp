// src/app/dashboard/purchases/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface PurchaseDetail {
  id: string;
  date: Date;
  type: string;
  status: string;
  totalAmount: number;
  notes: string;
  user: {
    name: string;
  };
  supplier: {
    name: string;
    contactName: string;
    phone: string;
    email: string;
  };
  purchaseItems: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      id: string;
      name: string;
      sku: string;
    };
  }[];
}

export default function PurchaseDetail() {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const res = await fetch(`/api/purchases/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Error al cargar la compra");
        const data = await res.json();
        setPurchase(data.purchase);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchase();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Cargando detalles de compra...</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Compra no encontrada</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalles de Compra</h1>
        <button
          onClick={() => router.push("/dashboard/purchases")}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Volver a Compras
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500">
              Número de Compra
            </h2>
            <p className="text-lg">#{purchase.id.slice(0, 8)}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Fecha</h2>
            <p className="text-lg">{formatDate(purchase.date)}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Estado</h2>
            <p className="text-lg">
              <span
                className={`px-2 py-1 rounded text-sm ${
                  purchase.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : purchase.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {purchase.status === "completed"
                  ? "Completada"
                  : purchase.status === "pending"
                    ? "Pendiente"
                    : "Cancelada"}
              </span>
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Total</h2>
            <p className="text-lg font-bold">
              {formatCurrency(purchase.totalAmount)}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Información del Proveedor
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nombre</h3>
              <p>{purchase.supplier.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contacto</h3>
              <p>{purchase.supplier.contactName || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Teléfono</h3>
              <p>{purchase.supplier.phone || "N/A"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p>{purchase.supplier.email || "N/A"}</p>
            </div>
          </div>
        </div>

        {purchase.notes && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Notas</h2>
            <p className="bg-gray-100 p-3 rounded">{purchase.notes}</p>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2">Productos</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Producto</th>
                <th className="border px-4 py-2">SKU</th>
                <th className="border px-4 py-2">Cantidad</th>
                <th className="border px-4 py-2">Precio Unitario</th>
                <th className="border px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchase.purchaseItems.map((item) => (
                <tr key={item.id}>
                  <td className="border px-4 py-2">{item.product.name}</td>
                  <td className="border px-4 py-2">
                    {item.product.sku || "N/A"}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    {item.quantity}
                  </td>
                  <td className="border px-4 py-2 text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="border px-4 py-2 text-right">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100">
                <td
                  colSpan={4}
                  className="border px-4 py-2 text-right font-bold"
                >
                  Total:
                </td>
                <td className="border px-4 py-2 text-right font-bold">
                  {formatCurrency(purchase.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
