// app/dashboard/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  selectedPage: string;
  setSelectedPage: (page: string) => void;
}

interface MenuItem {
  id: string;
  path: string;
  label: string;
  icon: string;
  submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { id: "inicio", path: "/dashboard", label: "INICIO", icon: "🏠" },
  {
    id: "productos",
    path: "/dashboard/products",
    label: "PRODUCTOS",
    icon: "📦",
  },
  {
    id: "clientes",
    path: "/dashboard/customers",
    label: "CLIENTES",
    icon: "👥",
  },
  {
    id: "ventas",
    path: "/dashboard/sales",
    label: "VENTAS",
    icon: "💰",
    submenu: [
      {
        id: "cotizacion",
        path: "/dashboard/sales/quotation",
        label: "COTIZACIÓN",
        icon: "📝",
      },
      {
        id: "ventas-list",
        path: "/dashboard/sales",
        label: "LISTA VENTAS",
        icon: "💰",
      },
    ],
  },
  { id: "compras", path: "/dashboard/purchases", label: "COMPRAS", icon: "🛒" },
  {
    id: "proveedores",
    path: "/dashboard/suppliers",
    label: "PROVEEDORES",
    icon: "🏢",
  },
  {
    id: "facturas",
    path: "/dashboard/invoices",
    label: "FACTURAS",
    icon: "🧾",
  },
  {
    id: "perfil",
    path: "/dashboard/profile",
    label: "PERFIL FISCAL",
    icon: "🏢",
  },
  { id: "ajustes", path: "/dashboard/settings", label: "AJUSTES", icon: "⚙️" },
];

export default function Sidebar({ setSelectedPage }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>(
    {}
  );

  const handleNavigation = (path: string, pageId: string) => {
    setSelectedPage(pageId);
    router.push(path);
  };

  const toggleSubmenu = (menuId: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const isSubmenuOpen = (menuId: string) => openSubmenus[menuId] || false;

  const renderMenuItem = (item: MenuItem) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isActive =
      pathname === item.path ||
      (item.submenu &&
        item.submenu.some((subItem) => pathname === subItem.path));

    if (hasSubmenu) {
      return (
        <div key={item.id} className="flex flex-col">
          <div
            onClick={() => toggleSubmenu(item.id)}
            className={`cursor-pointer p-3 rounded-lg flex items-center justify-between transition-all duration-200 group ${
              isActive
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg"
                : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isSubmenuOpen(item.id) ? "rotate-90" : "rotate-0"
              } ${isActive ? "text-white" : "text-gray-500"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>

          {isSubmenuOpen(item.id) && (
            <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-blue-200 pl-3">
              {item.submenu!.map((subItem) => (
                <Link
                  key={subItem.id}
                  href={subItem.path}
                  onClick={() => handleNavigation(subItem.path, subItem.id)}
                  className={`cursor-pointer p-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                    pathname === subItem.path
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-md"
                      : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-700 hover:shadow-sm"
                  }`}
                >
                  <span className="text-lg">{subItem.icon}</span>
                  <span className="text-sm font-medium">{subItem.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Para items sin submenú
    return (
      <Link
        key={item.id}
        href={item.path}
        onClick={() => handleNavigation(item.path, item.id)}
        className={`cursor-pointer p-3 rounded-lg flex items-center gap-3 transition-all duration-200 group ${
          pathname === item.path
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg"
            : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:shadow-md"
        }`}
      >
        <span className="text-xl group-hover:scale-110 transition-transform duration-200">
          {item.icon}
        </span>
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 p-6 flex flex-col gap-2 shadow-xl">
      {/* Logo y título */}
      <div className="p-4 mb-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
            <span className="text-white font-bold text-xl">ERP</span>
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-800">ERP Software</h2>
            <p className="text-xs text-gray-500">Panel de Control</p>
          </div>
        </Link>
      </div>

      {/* Separador */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6"></div>

      {/* Menú */}
      <div className="space-y-2 flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
          Navegación Principal
        </h3>
        {menuItems.map(renderMenuItem)}
      </div>

      {/* Footer de sidebar */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="px-3 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">¿Necesitas ayuda?</p>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Soporte Técnico
          </button>
        </div>
      </div>
    </aside>
  );
}
