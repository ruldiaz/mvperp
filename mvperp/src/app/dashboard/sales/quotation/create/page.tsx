"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import QuotationForm from "../components/QuotationForm";

export default function CreateQuotation() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (quotationData: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationData),
        credentials: "include",
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Error al crear la cotización");
      }

      toast.success("Cotización creada exitosamente");
      router.push("/dashboard/sales/quotation");
    } catch (err) {
      console.error("Error creando cotización:", err);
      const message = err instanceof Error ? err.message : "Error al crear la cotización";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <QuotationForm
      title="Nueva Cotización"
      submitLabel="Guardar Cotización"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
