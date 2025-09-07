// src/app/dashboard/layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar, { User } from "./components/Navbar";
import Sidebar from "./components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedPage, setSelectedPage] = useState("inicio");
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  // Obtener usuario autenticado
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // Detectar la página activa basándose en la ruta
  useEffect(() => {
    if (pathname.includes("/products")) setSelectedPage("productos");
    else if (pathname.includes("/purchases")) setSelectedPage("compras");
    else if (pathname.includes("/suppliers")) setSelectedPage("proveedores");
    else if (pathname.includes("/profile")) setSelectedPage("perfil");
    else if (pathname.includes("/settings")) setSelectedPage("ajustes");
    else setSelectedPage("inicio");
  }, [pathname]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar selectedPage={selectedPage} setSelectedPage={setSelectedPage} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} />
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
