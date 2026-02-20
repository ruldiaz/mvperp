"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { Customer } from "@/types/customer";
import { toast } from "react-hot-toast";

const IVA_PERCENTAGE = 0.16;

type PricingMode = "manual" | "individual_margin" | "global_margin";
type TaxMode = "net" | "gross"; // net = Sin IVA, gross = Con IVA

interface ExtendedQuotationItem {
  productId: string;
  quantity: number;
  
  // Data for calculations
  cost: number;
  margin: number;
  taxMode: TaxMode;
  typedPrice: number; // Used only in manual mode to remember what was typed

  // Resulting calculations
  unitPrice: number; // The final Base Price (without IVA)
  totalPrice: number; // quantity * unitPrice
  
  // Extra fields
  satProductKey?: string;
  satUnitKey?: string;
  description?: string;
}

export default function CreateQuotation() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ExtendedQuotationItem[]>([]);
  
  // Pricing Mode State
  const [pricingMode, setPricingMode] = useState<PricingMode>("manual");
  const [globalMargin, setGlobalMargin] = useState<number>(0);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Derived Totals
  const totalAmountWithoutIVA = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const ivaAmount = totalAmountWithoutIVA * IVA_PERCENTAGE;
  const totalAmountWithIVA = totalAmountWithoutIVA * (1 + IVA_PERCENTAGE);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, customersRes] = await Promise.all([
          fetch("/api/products", { credentials: "include" }),
          fetch("/api/customers", { credentials: "include" }),
        ]);

        if (!productsRes.ok || !customersRes.ok) {
          throw new Error("Error al cargar los datos necesarios");
        }

        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        setProducts(productsData.products || []);
        setCustomers(customersData.customers || []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error al cargar los datos necesarios");
        toast.error("No se pudieron cargar productos o clientes");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Recalculate all items when global margin changes
  useEffect(() => {
    if (pricingMode === "global_margin") {
      setItems((prevItems) =>
        prevItems.map((item) => calculateItemMath({ ...item, margin: globalMargin }, pricingMode))
      );
    }
  }, [globalMargin, pricingMode]);

  // Recalculate all items when mode changes
  const handleModeChange = (newMode: PricingMode) => {
    setPricingMode(newMode);
    setItems((prevItems) =>
      prevItems.map((item) =>
        calculateItemMath(
          { ...item, margin: newMode === "global_margin" ? globalMargin : item.margin },
          newMode
        )
      )
    );
  };

  const calculateItemMath = (item: ExtendedQuotationItem, mode: PricingMode): ExtendedQuotationItem => {
    let basePrice = 0;

    // First calculate the base Cost considering if the entered cost includes IVA
    const actualCost = item.taxMode === "gross" ? item.cost / (1 + IVA_PERCENTAGE) : item.cost;

    if (mode === "manual") {
      // In manual mode, we just look at the typedPrice and taxMode
      basePrice = item.taxMode === "gross" ? item.typedPrice / (1 + IVA_PERCENTAGE) : item.typedPrice;
      
      // Auto-calculate the resulting margin just for UI context, even though it's not the driver
      if (actualCost > 0) {
        item.margin = ((basePrice - actualCost) / actualCost) * 100;
      }
    } else {
      // Both individual_margin and global_margin calculate price from Cost + Margin
      basePrice = actualCost * (1 + item.margin / 100);
      
      // Auto-calculate what the typedPrice visually represents
      item.typedPrice = item.taxMode === "gross" ? basePrice * (1 + IVA_PERCENTAGE) : basePrice;
    }

    return {
      ...item,
      unitPrice: basePrice,
      totalPrice: basePrice * item.quantity,
    };
  };

  const addItem = () => {
    const newItem: ExtendedQuotationItem = {
      productId: "",
      quantity: 1,
      cost: 0,
      margin: pricingMode === "global_margin" ? globalMargin : 0,
      taxMode: "net",
      typedPrice: 0,
      unitPrice: 0,
      totalPrice: 0,
      satProductKey: "",
      satUnitKey: "",
      description: "",
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof ExtendedQuotationItem, value: any) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      const updatedItem = { ...newItems[index], [field]: value };
      newItems[index] = calculateItemMath(updatedItem, pricingMode);
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const dbPrice = product?.price || 0;
    const dbCost = product?.cost || 0;

    setItems((prevItems) => {
      const newItems = [...prevItems];
      const currentItem = newItems[index];
      
      const updatedItem = {
        ...currentItem,
        productId,
        satProductKey: product?.satKey || "",
        satUnitKey: product?.satUnitKey || "",
        description: product?.name || "",
        cost: dbCost, // Load default DB cost
        typedPrice: dbPrice, // Load default DB price for manual mode
      };
      
      newItems[index] = calculateItemMath(updatedItem, pricingMode);
      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error("Por favor selecciona un cliente");
      return;
    }

    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    const hasEmptyProducts = items.some((item) => !item.productId);
    if (hasEmptyProducts) {
      toast.error("Todos los productos deben estar seleccionados");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const quotationData = {
        customerId: selectedCustomer,
        expiryDate: expiryDate || undefined,
        // Send ONLY the base data to the API, hiding all our UI calculator tricks
        quotationItems: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice, // Send purely the calculated Base Price
          satProductKey: item.satProductKey,
          satUnitKey: item.satUnitKey,
          description: item.description,
        })),
        notes,
      };

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
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Nueva Cotización</h1>
          <p className="text-gray-600 mt-1">
            Llena los campos para crear una nueva cotización
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:shadow-md transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancelar
        </button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Global Configuration Banner */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-sm border border-indigo-100 p-6">
        <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configuración Global de Precios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="block text-sm font-semibold text-indigo-900 mb-2">
              Modo de Cálculo de Precios
            </label>
            <select
              value={pricingMode}
              onChange={(e) => handleModeChange(e.target.value as PricingMode)}
              className="w-full border border-indigo-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer shadow-sm"
            >
              <option value="manual">Modo Manual: Escribir Precios Finales</option>
              <option value="individual_margin">Modo Detallado: Costo + Margen por Producto</option>
              <option value="global_margin">Modo Global: Costos + Margen Único General</option>
            </select>
            <p className="text-xs text-indigo-600 mt-2">
              {pricingMode === "manual" && "Escribe los precios de venta directamente. Ignora los costos."}
              {pricingMode === "individual_margin" && "Tus precios se calcularán automáticamente basados en el Costo y Margen de cada línea."}
              {pricingMode === "global_margin" && "Todos los precios se calcularán usando el Margen Global aplicado al costo de cada producto."}
            </p>
          </div>
          {pricingMode === "global_margin" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <label className="block text-sm font-semibold text-indigo-900 mb-2">
                Margen Global (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={globalMargin}
                  onChange={(e) => setGlobalMargin(Number(e.target.value))}
                  className="w-full border border-indigo-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Selección de cliente */}
            <div>
              <label className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Cliente
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                required
              >
                <option value="">Selecciona un cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de vencimiento */}
            <div>
              <label className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha de Vencimiento (Opcional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                Productos ({items.length})
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Producto
              </button>
            </div>

            {items.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                No hay productos agregados a la cotización
              </div>
            )}

            {items.map((item, index) => (
              <div
                key={index}
                className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md relative group"
              >
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Select Product - 4 columns */}
                  <div className="md:col-span-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Producto *</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                      required
                    >
                      <option value="">Buscar producto...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} {product.sku && `(${product.sku})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity - 1 column */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cant *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 shadow-sm bg-white text-center"
                      required
                    />
                  </div>

                  {/* Dynamic Math Columns based on mode */}
                  <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-inner">
                    
                    {/* Tax Selector (Always Visible) */}
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Impuestos</label>
                      <select
                        value={item.taxMode}
                        onChange={(e) => updateItem(index, "taxMode", e.target.value)}
                        className="w-full border-b border-gray-300 py-1 text-sm text-gray-700 focus:outline-none focus:border-blue-500 bg-transparent"
                      >
                        <option value="net">Sin IVA</option>
                        <option value="gross">Con IVA</option>
                      </select>
                    </div>

                    {/* Cost Input (Only in margin modes) */}
                    {pricingMode !== "manual" && (
                      <div className="col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Costo</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.cost || ""}
                          onChange={(e) => updateItem(index, "cost", Number(e.target.value))}
                          className="w-full border-b border-gray-300 py-1 text-sm focus:outline-none focus:border-blue-500 bg-transparent text-right"
                          placeholder="0.00"
                        />
                      </div>
                    )}

                    {/* Margin Input (Only in individual margin mode) */}
                    {pricingMode === "individual_margin" && (
                      <div className="col-span-1 border-l border-gray-100 pl-3">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Margen %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.margin || ""}
                          onChange={(e) => updateItem(index, "margin", Number(e.target.value))}
                          className="w-full border-b border-gray-300 py-1 text-sm font-semibold text-indigo-600 focus:outline-none focus:border-blue-500 bg-transparent text-right"
                          placeholder="0.0"
                        />
                      </div>
                    )}

                    {/* Price Input (Manual only. Auto-calculated/Read-only in Margin modes) */}
                    <div className={pricingMode === "manual" ? "col-span-2" : "col-span-1"}>
                      <label className={`block text-xs font-semibold mb-1 ${pricingMode === "manual" ? "text-gray-700" : "text-gray-500"}`}>
                        Precio {item.taxMode === "gross" ? "(C/IVA)" : "(Base)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pricingMode === "manual" ? (item.typedPrice || "") : item.typedPrice.toFixed(2)}
                        onChange={(e) => pricingMode === "manual" && updateItem(index, "typedPrice", Number(e.target.value))}
                        readOnly={pricingMode !== "manual"}
                        className={`w-full border-b border-gray-300 py-1 text-sm text-right focus:outline-none focus:border-blue-500 bg-transparent ${pricingMode !== "manual" ? "text-gray-400 font-mono" : "font-bold text-gray-800"}`}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Total purely for visual reference (Span logic ensures layout always looks full) */}
                    <div className={pricingMode === "global_margin" ? "col-span-2 border-l border-gray-100 pl-3" : "col-span-1 border-l border-gray-100 pl-3"}>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Total (P.Base)</label>
                      <input
                        type="text"
                        value={formatCurrency(item.totalPrice)}
                        className="w-full py-1 text-sm font-bold text-gray-800 bg-transparent text-right outline-none"
                        readOnly
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                </div>

                {/* Campos SAT Expandibles (Opcionales) */}
                <details className="mt-4 group/details">
                  <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-blue-600 flex items-center gap-1 select-none">
                    <svg className="w-4 h-4 transition-transform group-open/details:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Más detalles (SAT / Descripción)
                  </summary>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Clave Producto SAT</label>
                      <input
                        type="text"
                        value={item.satProductKey || ""}
                        onChange={(e) => updateItem(index, "satProductKey", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Ej. 43211500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Clave Unidad SAT</label>
                      <input
                        type="text"
                        value={item.satUnitKey || ""}
                        onChange={(e) => updateItem(index, "satUnitKey", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Ej. H87"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción para Factura</label>
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>

          {/* Notas */}
          <div>
            <label className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm resize-y"
              rows={3}
              placeholder="Ej: Descuentos especiales, condiciones, observaciones..."
            />
          </div>

          {/* Total y botones */}
          <div className="pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="w-full md:w-1/2 lg:w-1/3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-blue-100">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 font-medium">Subtotal (sin IVA)</p>
                    <p className="font-bold text-gray-800">{formatCurrency(totalAmountWithoutIVA)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600 font-medium">IVA (16%)</p>
                    <p className="font-bold text-amber-600">{formatCurrency(ivaAmount)}</p>
                  </div>
                  <div className="flex justify-between items-center border-t border-blue-200 pt-3 mt-3">
                    <p className="text-lg font-bold text-gray-900">Total</p>
                    <p className="text-2xl font-black text-green-700">{formatCurrency(totalAmountWithIVA)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 md:flex-none px-8 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || items.length === 0 || !selectedCustomer}
                  className="flex-1 md:flex-none px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    "Guardar Cotización"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
