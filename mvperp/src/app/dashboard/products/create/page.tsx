"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";

export default function CreateProduct() {
  const router = useRouter();
  const [form, setForm] = useState<Product>({
    name: "",
    type: "producto",
    sellAtPOS: false,
    includeInCatalog: false,
    requirePrescription: false,
    useStock: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const target = e.target;

    let value: string | number | boolean | undefined;

    if (target instanceof HTMLInputElement) {
      if (target.type === "checkbox") {
        value = target.checked; // ✅ solo para input checkbox
      } else if (target.type === "number") {
        value = target.value === "" ? undefined : Number(target.value);
      } else {
        value = target.value;
      }
    } else if (
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      value = target.value;
    }

    setForm((prev) => ({
      ...prev,
      [target.name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al crear producto");

      router.push("/dashboard/products");
    } catch (err: unknown) {
      console.error(err);
      setError("Error desconocido al crear el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Crear Producto</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          placeholder="Nombre del producto"
          value={form.name}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="producto">Producto</option>
          <option value="servicio">Servicio</option>
        </select>

        <input
          type="text"
          name="barcode"
          placeholder="Código de barras"
          value={form.barcode || ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="category"
          placeholder="Categoría"
          value={form.category || ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="sku"
          placeholder="SKU"
          value={form.sku || ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <div className="flex gap-4">
          <label>
            <input
              type="checkbox"
              name="sellAtPOS"
              checked={form.sellAtPOS}
              onChange={handleChange}
            />{" "}
            Vender en punto de venta
          </label>

          <label>
            <input
              type="checkbox"
              name="includeInCatalog"
              checked={form.includeInCatalog}
              onChange={handleChange}
            />{" "}
            Incluir en catálogo en línea
          </label>

          <label>
            <input
              type="checkbox"
              name="requirePrescription"
              checked={form.requirePrescription}
              onChange={handleChange}
            />{" "}
            Requerir receta médica
          </label>
        </div>

        <input
          type="text"
          name="saleUnit"
          placeholder="Unidad de venta"
          value={form.saleUnit || ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="text"
          name="brand"
          placeholder="Marca"
          value={form.brand || ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <textarea
          name="description"
          placeholder="Descripción"
          value={form.description || ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="number"
          name="quantity"
          placeholder="Cantidad"
          value={form.quantity ?? ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="number"
          name="price"
          placeholder="Precio"
          value={form.price ?? ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="number"
          name="cost"
          placeholder="Costo"
          value={form.cost ?? ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="number"
          name="stock"
          placeholder="Stock"
          value={form.stock ?? ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="number"
          name="minimumQuantity"
          placeholder="Cantidad mínima"
          value={form.minimumQuantity ?? ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="number"
          name="iva"
          placeholder="IVA (%)"
          value={form.iva ?? ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="number"
          name="ieps"
          placeholder="IEPS (%)"
          value={form.ieps ?? ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Creando..." : "Crear Producto"}
        </button>
      </form>
    </div>
  );
}
