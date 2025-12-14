// src/app/dashboard/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Navbar, { User } from "./components/Navbar";
import Sidebar from "./components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedPage, setSelectedPage] = useState("inicio");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Obtener usuario autenticado
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        window.location.href = "/login";
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Detectar la página activa basándose en la ruta
  useEffect(() => {
    if (pathname.includes("/products")) setSelectedPage("productos");
    else if (pathname.includes("/customers")) setSelectedPage("clientes");
    else if (pathname.includes("/sales")) setSelectedPage("ventas");
    else if (pathname.includes("/purchases")) setSelectedPage("compras");
    else if (pathname.includes("/suppliers")) setSelectedPage("proveedores");
    else if (pathname.includes("/invoices")) setSelectedPage("facturas");
    else if (pathname.includes("/profile")) setSelectedPage("perfil");
    else if (pathname.includes("/settings")) setSelectedPage("ajustes");
    else setSelectedPage("inicio");
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <Sidebar selectedPage={selectedPage} setSelectedPage={setSelectedPage} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar user={user} />

        {/* Contenido dinámico */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6 animate-in fade-in duration-300">
              {children}
            </div>
          </div>
        </main>

        {/* Footer del dashboard */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} ERP Software v1.0.0
            </p>
            <div className="flex items-center gap-4">
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                Ayuda
              </button>
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                Términos
              </button>
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                Privacidad
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
