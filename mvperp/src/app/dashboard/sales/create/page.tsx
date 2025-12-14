// src/app/dashboard/sales/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { Customer } from "@/types/customer";
import { SaleItem } from "@/types/sale";
import { toast } from "react-hot-toast";

export default function CreateSale() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, customersRes] = await Promise.all([
          fetch("/api/products", { credentials: "include" }),
          fetch("/api/customers", { credentials: "include" }),
        ]);

        if (!productsRes.ok) {
          throw new Error(`Error productos: ${productsRes.status}`);
        }
        if (!customersRes.ok) {
          throw new Error(`Error clientes: ${customersRes.status}`);
        }

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

  const addItem = () => {
    if (items.length >= 10) {
      toast.error("Máximo 10 productos por venta");
      return;
    }

    setItems([
      ...items,
      {
        productId: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        satProductKey: "",
        satUnitKey: "",
        description: "",
      },
    ]);
  };

  const updateItem = (index: number, field: string, value: unknown) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };

      // Calcular totalPrice si cambia quantity o unitPrice
      if (field === "quantity" || field === "unitPrice") {
        const quantity = Number(newItems[index].quantity);
        const unitPrice = Number(newItems[index].unitPrice);
        newItems[index].totalPrice = quantity * unitPrice;
      }

      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
    toast.success("Producto eliminado");
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const price = product?.price || 0;

    if (product?.stock == 0) {
      toast.error(`El producto ${product.name} no tiene existencias`);
      return;
    }

    // Actualizar campos con información del producto
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        productId: productId,
        unitPrice: price,
        totalPrice: newItems[index].quantity * price,
        satProductKey: product?.satKey || "",
        satUnitKey: product?.satUnitKey || "",
        description: product?.name || "",
      };
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

    // Validar que todos los productos estén seleccionados
    const hasEmptyProducts = items.some((item) => !item.productId);
    if (hasEmptyProducts) {
      setError("Todos los productos deben estar seleccionados");
      toast.error("Selecciona todos los productos");
      return;
    }

    // Validar stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (
        product &&
        product.stock !== undefined &&
        product.stock < item.quantity
      ) {
        toast.error(
          `Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}`
        );
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const saleData = {
        customerId: selectedCustomer,
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
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear la venta";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );
  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Cargando datos de venta...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Crear Nueva Venta
          </h1>
          <p className="text-gray-600">
            Completa el formulario para registrar una nueva venta
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Cancelar
        </button>
      </div>

      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sección de cliente */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Datos del Cliente
              </h2>
              <p className="text-gray-600">
                Selecciona el cliente para esta venta
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Buscador de cliente */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Buscar Cliente *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
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

            {/* Selector de cliente */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seleccionar Cliente *
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 outline-none appearance-none bg-gradient-to-r from-gray-50 to-white"
                required
              >
                <option value="">Selecciona un cliente</option>
                {filteredCustomers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                    className="py-2"
                  >
                    {customer.name} {customer.email && `(${customer.email})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Información del cliente seleccionado */}
          {selectedCustomerData && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedCustomerData.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedCustomerData.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedCustomerData.email &&
                        `${selectedCustomerData.email} • `}
                      {selectedCustomerData.rfc &&
                        `RFC: ${selectedCustomerData.rfc}`}
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
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
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
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Productos de la Venta
                </h2>
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
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Agregar Producto
            </button>
          </div>

          {/* Buscador de productos */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar Productos
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:ring-opacity-50 transition-all duration-200 outline-none"
                placeholder="Buscar productos por nombre o SKU..."
              />
            </div>
          </div>

          {/* Lista de productos agregados */}
          {items.map((item, index) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <div
                key={index}
                className="mb-6 p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {product?.name || "Producto no seleccionado"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {product?.sku && `SKU: ${product.sku} • `}
                        Stock disponible: {product?.stock || 0}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="bg-gradient-to-r from-red-50 to-pink-100 text-red-700 px-3 py-2 rounded-lg hover:from-red-100 hover:to-pink-200 hover:text-red-800 transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Producto */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Producto *
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        handleProductChange(index, e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 outline-none"
                      required
                    >
                      <option value="">Seleccionar producto</option>
                      {filteredProducts.map((product) => (
                        <option
                          key={product.id}
                          value={product.id}
                          className={`py-2 ${product.stock === 0 ? "text-red-600 bg-red-50" : ""}`}
                        >
                          {product.name} {product.sku && `(${product.sku})`}
                          {product.stock !== undefined &&
                            ` - Stock: ${product.stock}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", Number(e.target.value))
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 outline-none"
                      required
                    />
                  </div>

                  {/* Precio Unitario */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio Unitario *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, "unitPrice", Number(e.target.value))
                        }
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total
                    </label>
                    <div className="px-4 py-3 border border-gray-200 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 font-bold text-green-700">
                      ${item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Campos SAT */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clave Producto SAT
                    </label>
                    <input
                      type="text"
                      value={item.satProductKey || ""}
                      onChange={(e) =>
                        updateItem(index, "satProductKey", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none"
                      placeholder="Clave SAT"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clave Unidad SAT
                    </label>
                    <input
                      type="text"
                      value={item.satUnitKey || ""}
                      onChange={(e) =>
                        updateItem(index, "satUnitKey", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none"
                      placeholder="Clave unidad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción para Factura
                    </label>
                    <input
                      type="text"
                      value={item.description || ""}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200 outline-none"
                      placeholder="Descripción detallada"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No hay productos agregados
              </h3>
              <p className="text-gray-500 mb-6">
                Haz clic en Agregar Producto para comenzar a añadir productos a
                la venta
              </p>
            </div>
          )}
        </div>

        {/* Sección de notas */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Notas Adicionales
              </h2>
              <p className="text-gray-600">
                Información adicional sobre la venta (opcional)
              </p>
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
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Resumen de la Venta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Productos</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {items.length}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Unidades Totales</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {totalItems}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">
                    Total de la Venta
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || items.length === 0 || !selectedCustomer}
                className={`px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  loading || items.length === 0 || !selectedCustomer
                    ? "bg-gradient-to-r from-blue-400 to-indigo-400 text-white opacity-70 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:from-blue-700 hover:to-indigo-700"
                }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Crear Venta
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
