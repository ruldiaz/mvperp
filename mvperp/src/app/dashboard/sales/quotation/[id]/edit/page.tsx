"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import QuotationForm from "../../components/QuotationForm";
import { Box, CircularProgress } from "@mui/material";

export default function EditQuotation() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params.id as string;

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuotation = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/quotations/${quotationId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error al cargar la cotización");
      }

      const data = await res.json();
      setInitialData(data.quotation);
    } catch (err) {
      console.error("Error cargando cotización:", err);
      toast.error("No se pudo cargar la cotización");
      router.push("/dashboard/sales/quotation");
    } finally {
      setIsLoading(false);
    }
  }, [quotationId, router]);

  useEffect(() => {
    if (quotationId) {
      fetchQuotation();
    }
  }, [quotationId, fetchQuotation]);

  const handleSubmit = async (quotationData: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationData),
        credentials: "include",
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Error al actualizar la cotización");
      }

      toast.success("Cotización actualizada exitosamente");
      router.push("/dashboard/sales/quotation");
    } catch (err) {
      console.error("Error actualizando cotización:", err);
      const message = err instanceof Error ? err.message : "Error al actualizar la cotización";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "500px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <QuotationForm
      initialData={initialData}
      title="Editar Cotización"
      submitLabel="Guardar Cambios"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
