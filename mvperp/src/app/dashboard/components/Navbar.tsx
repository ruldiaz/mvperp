// src/app/dashboard/components/Navbar.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export interface User {
  id: string;
  email: string;
  name?: string;
}

interface NavbarProps {
  user: User;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success("Sesión cerrada exitosamente");
      setMenuOpen(false);
      router.push("/login");
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <nav className="relative z-50 bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Bienvenido al panel de control</p>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border py-2 z-50">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold">Notificaciones</h3>
              </div>
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="px-4 py-3 hover:bg-gray-50 border-b last:border-0"
                >
                  <p className="text-sm">Tienes una notificación pendiente</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Perfil */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
              </span>
            </div>
            <div className="text-left">
              <p className="font-medium">{user.name || "Usuario"}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border z-50">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
