// src/app/landing/navbar/Navbar.tsx
"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isFuncionalidadesOpen, setIsFuncionalidadesOpen] = useState(false);

  const funcionalidades = [
    { nombre: "Punto de Venta", href: "#punto-venta" },
    { nombre: "Facturación", href: "#facturacion" },
    { nombre: "Inventario", href: "#inventario" },
    { nombre: "Tienda en Línea", href: "#tienda-linea" },
  ];

  const navigationItems = [
    { nombre: "Precios", href: "#precios" },
    { nombre: "Distribuidores", href: "#distribuidores" },
    { nombre: "Compañía", href: "#compania" },
    { nombre: "Soluciones", href: "#soluciones" },
  ];

  return (
    <nav className="w-full bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-200">
      {/* Logo a la izquierda */}
      <div className="flex items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-blue-700 hover:text-blue-800 transition-colors duration-200"
        >
          ERP Software
        </Link>
      </div>

      {/* Menú de navegación */}
      <div className="flex items-center space-x-8">
        {/* Funcionalidades con submenú */}
        <div className="relative">
          <button
            className="text-gray-800 hover:text-blue-600 font-medium flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
            onMouseEnter={() => setIsFuncionalidadesOpen(true)}
            onMouseLeave={() => setIsFuncionalidadesOpen(false)}
            onClick={() => setIsFuncionalidadesOpen(!isFuncionalidadesOpen)}
          >
            <span>Funcionalidades</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isFuncionalidadesOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Submenú desplegable */}
          {isFuncionalidadesOpen && (
            <div
              className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              onMouseEnter={() => setIsFuncionalidadesOpen(true)}
              onMouseLeave={() => setIsFuncionalidadesOpen(false)}
            >
              {funcionalidades.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 border-l-4 border-transparent hover:border-blue-500"
                  onClick={() => setIsFuncionalidadesOpen(false)}
                >
                  <div className="font-medium">{item.nombre}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Descripción breve aquí
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Resto de opciones de navegación */}
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-gray-800 hover:text-blue-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            {item.nombre}
          </Link>
        ))}

        {/* Botón Ingresar */}
        <Link
          href="/login"
          className="ml-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          Ingresar
        </Link>
      </div>
    </nav>
  );
}
