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

      if (res.ok) {
        toast.success("Sesión cerrada exitosamente");
        router.push("/login");
      }
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <nav className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
      {/* Breadcrumb y título */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Bienvenido al panel de control</p>
      </div>

      {/* Controles de usuario */}
      <div className="flex items-center gap-4">
        {/* Botón de notificaciones */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200 relative"
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
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Notificaciones</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          Recordatorio importante
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Tienes 3 tareas pendientes para hoy
                        </p>
                        <span className="text-xs text-blue-600 mt-1 block">
                          Hace 2 horas
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-center">
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* Perfil de usuario */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
              <span className="text-white font-bold text-sm">
                {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
              </span>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">
                {user.name || "Usuario"}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                {user.email}
              </p>
            </div>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              {/* Header del menú */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-800">
                  {user.name || "Usuario"}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>

              {/* Opciones del menú */}
              <div className="py-2">
                <button
                  onClick={() => router.push("/dashboard/profile")}
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 flex items-center gap-3"
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Mi Perfil
                </button>

                <button
                  onClick={() => router.push("/dashboard/settings")}
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 flex items-center gap-3"
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Configuración
                </button>
              </div>

              {/* Separador */}
              <div className="h-px bg-gray-200 my-1"></div>

              {/* Cerrar sesión */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 flex items-center gap-3 mt-1"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
