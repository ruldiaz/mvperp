"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { Customer } from "@/types/customer";
import { toast } from "react-hot-toast";

const IVA_PERCENTAGE = 0.16;

type PricingMode = "manual" | "individual_margin" | "global_margin";
type TaxMode = "net" | "gross"; // net = Sin IVA, gross = Con IVA

interface ExtendedSaleItem {
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

export default function CreateSale() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ExtendedSaleItem[]>([]);
  
  // Pricing Mode State
  const [pricingMode, setPricingMode] = useState<PricingMode>("manual");
  const [globalMargin, setGlobalMargin] = useState<number>(0);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Derived Totals
  const totalAmountWithoutIVA = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const ivaAmount = totalAmountWithoutIVA * IVA_PERCENTAGE;
  const totalAmountWithIVA = totalAmountWithoutIVA * (1 + IVA_PERCENTAGE);
  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, customersRes] = await Promise.all([
          fetch("/api/products", { credentials: "include" }),
          fetch("/api/customers", { credentials: "include" }),
        ]);

        if (!productsRes.ok) throw new Error(`Error productos: ${productsRes.status}`);
        if (!customersRes.ok) throw new Error(`Error clientes: ${customersRes.status}`);

        const productsData = await productsRes.json();
        const customersData = await customersRes.json();

        setProducts(productsData.products || []);
        setCustomers(customersData.customers || []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error al cargar los datos necesarios");
        toast.error("Error al cargar datos");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.rfc?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Use useCallback so we dont get stale closures
  const calculateItemMath = useCallback((item: ExtendedSaleItem, mode: PricingMode, gMargin: number): ExtendedSaleItem => {
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
      const activeMargin = mode === "global_margin" ? gMargin : item.margin;
      basePrice = actualCost * (1 + activeMargin / 100);
      
      // Auto-calculate what the typedPrice visually represents
      item.typedPrice = item.taxMode === "gross" ? basePrice * (1 + IVA_PERCENTAGE) : basePrice;
    }

    return {
      ...item,
      unitPrice: basePrice,
      totalPrice: basePrice * item.quantity,
    };
  }, []);

  // Recalculate all items when global margin changes
  useEffect(() => {
    if (pricingMode === "global_margin") {
      setItems((prevItems) =>
        prevItems.map((item) => calculateItemMath(item, pricingMode, globalMargin))
      );
    }
  }, [globalMargin, pricingMode, calculateItemMath]);

  const handleModeChange = (newMode: PricingMode) => {
    setPricingMode(newMode);
    setItems((prevItems) =>
      prevItems.map((item) => calculateItemMath(item, newMode, globalMargin))
    );
  };

  const addItem = () => {
    if (items.length >= 10) {
      toast.error("Máximo 10 productos por venta");
      return;
    }

    const newItem: ExtendedSaleItem = {
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

  const updateItem = (index: number, field: keyof ExtendedSaleItem, value: any) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      const updatedItem = { ...newItems[index], [field]: value };
      newItems[index] = calculateItemMath(updatedItem, pricingMode, globalMargin);
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
    toast.success("Producto eliminado");
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const dbPrice = product?.price || 0;
    const dbCost = product?.cost || 0;

    if (product?.stock == 0) {
      toast.error(`El producto ${product.name} no tiene existencias`);
      return;
    }

    setItems((prevItems) => {
      const newItems = [...prevItems];
      const currentItem = newItems[index];
      
      const updatedItem = {
        ...currentItem,
        productId,
        satProductKey: product?.satKey || "",
        satUnitKey: product?.satUnitKey || "",
        description: product?.name || "",
        cost: dbCost, 
        typedPrice: dbPrice,
      };
      
      newItems[index] = calculateItemMath(updatedItem, pricingMode, globalMargin);
      return newItems;
    });

    if (product) {
      toast.success(`${product.name} agregado`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      setError("Selecciona un cliente");
      toast.error("Selecciona un cliente");
      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un producto");
      toast.error("Agrega al menos un producto");
      return;
    }

    const hasEmptyProducts = items.some((item) => !item.productId);
    if (hasEmptyProducts) {
      setError("Todos los productos deben estar seleccionados");
      toast.error("Selecciona todos los productos");
      return;
    }

    // Validar stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.stock !== undefined && product.stock < item.quantity) {
        toast.error(`Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const saleData = {
        customerId: selectedCustomer,
        // Enviar SOLAMENTE precio base real a la API
        saleItems: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice, 
          satProductKey: item.satProductKey,
          satUnitKey: item.satUnitKey,
          description: item.description,
        })),
        notes,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
        credentials: "include",
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Error al crear la venta");
      }

      toast.success("¡Venta creada exitosamente!");
      setTimeout(() => {
        router.push("/dashboard/sales");
      }, 1500);
    } catch (err) {
      console.error("Error creando venta:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al crear la venta";
      setError(errorMessage);
      toast.error(errorMessage);
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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos de venta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Crear Nueva Venta</h1>
          <p className="text-gray-600">Completa el formulario para registrar una nueva venta</p>
        </div>

        <button
          onClick={() => router.back()}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Cancelar
        </button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Global Configuration Banner for Sales */}
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
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección de cliente */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Datos del Cliente</h2>
              <p className="text-gray-600">Selecciona el cliente para esta venta</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar Cliente *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 outline-none"
                  placeholder="Buscar por nombre, email o RFC..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Seleccionar Cliente *</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 outline-none appearance-none bg-gradient-to-r from-gray-50 to-white"
                required
              >
                <option value="">Selecciona un cliente</option>
                {filteredCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id} className="py-2">
                    {customer.name} {customer.email && `(${customer.email})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCustomerData && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedCustomerData.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedCustomerData.name}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedCustomerData.email && `${selectedCustomerData.email} • `}
                      {selectedCustomerData.rfc && `RFC: ${selectedCustomerData.rfc}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer("");
                    setCustomerSearch("");
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sección de productos */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Productos de la Venta</h2>
                <p className="text-gray-600">
                  {items.length > 0
                    ? `${items.length} producto(s) agregado(s) - ${totalItems} unidades totales`
                    : "Agrega los productos que se incluirán en la venta"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Producto
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar Productos (Opcional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:ring-opacity-50 transition-all duration-200 outline-none"
                placeholder="Filtra las opciones de los listados desplegables por nombre o SKU..."
              />
            </div>
          </div>

          {items.map((item, index) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <div
                key={index}
                className="mb-6 p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-all duration-300 group relative"
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

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-4">
                  {/* Select Product - 4 columns */}
                  <div className="xl:col-span-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Producto *</label>
                    <div className="flex items-center gap-2 mb-2">
                       {product?.stock !== undefined && (
                         <span className={`text-xs font-bold px-2 py-1 rounded ${product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                           Stock: {product.stock}
                         </span>
                       )}
                    </div>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white"
                      required
                    >
                      <option value="">Buscar o seleccionar producto...</option>
                      {filteredProducts.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          className={`py-2 ${p.stock === 0 ? "text-red-600 bg-red-50" : ""}`}
                          disabled={p.stock === 0}
                        >
                          {p.name} {p.sku && `(${p.sku})`} {p.stock !== undefined && ` - Stock: ${p.stock}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity - 1 column */}
                  <div className="xl:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-[34px]">Cant *</label>
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

                  {/* Calculator Math Columns - 7 cols */}
                  <div className="xl:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-3 mt-4 xl:mt-0 xl:mb-0 rounded-xl border border-gray-100 shadow-inner place-content-end">
                    
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

                    {/* Total purely for visual reference */}
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

                {/* Campos SAT Expendables */}
                <details className="mt-4 group/details">
                  <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-blue-600 flex items-center gap-1 select-none">
                    <svg className="w-4 h-4 transition-transform group-open/details:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    Más detalles (SAT / Descripción)
                  </summary>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Clave Producto SAT</label>
                      <input
                        type="text"
                        value={item.satProductKey || ""}
                        onChange={(e) => updateItem(index, "satProductKey", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none"
                        placeholder="Clave SAT"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Clave Unidad SAT</label>
                      <input
                        type="text"
                        value={item.satUnitKey || ""}
                        onChange={(e) => updateItem(index, "satUnitKey", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none"
                        placeholder="Clave unidad"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descripción para Factura</label>
                      <input
                        type="text"
                        value={item.description || ""}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none"
                        placeholder="Descripción detallada"
                      />
                    </div>
                  </div>
                </details>

              </div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay productos agregados</h3>
              <p className="text-gray-500 mb-6">Haz clic en Agregar Producto para comenzar a añadir productos a la venta</p>
            </div>
          )}
        </div>

        {/* Sección de notas */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Notas Adicionales</h2>
              <p className="text-gray-600">Información adicional sobre la venta (opcional)</p>
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:ring-opacity-50 transition-all duration-200 outline-none min-h-[120px]"
            rows={3}
            placeholder="Escribe aquí cualquier información adicional sobre la venta, condiciones especiales, términos de pago, etc..."
          />
        </div>

        {/* Resumen y botones */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1 w-full lg:w-1/2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de la Venta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Productos</p>
                  <p className="text-xl font-bold text-gray-800">{items.length}</p>
                </div>
                <div className="bg-gradient-to-r from-teal-50 to-green-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Unidades</p>
                  <p className="text-xl font-bold text-gray-800">{totalItems}</p>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">IVA (16%)</p>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(ivaAmount)}</p>
                </div>
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-xl font-black text-emerald-700">{formatCurrency(totalAmountWithIVA)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto mt-4 lg:mt-0">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || items.length === 0 || !selectedCustomer}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Confirmar Venta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
