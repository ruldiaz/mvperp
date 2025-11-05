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
            className={`cursor-pointer p-3 rounded-lg flex items-center justify-between transition-colors ${
              isActive
                ? "bg-blue-600 text-white font-bold"
                : "hover:bg-gray-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <span
              className={`transform transition-transform ${
                isSubmenuOpen(item.id) ? "rotate-90" : "rotate-0"
              }`}
            >
              ▶
            </span>
          </div>

          {isSubmenuOpen(item.id) && (
            <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-gray-600 pl-2">
              {item.submenu!.map((subItem) => (
                <Link
                  key={subItem.id}
                  href={subItem.path}
                  onClick={() => handleNavigation(subItem.path, subItem.id)}
                  className={`cursor-pointer p-2 rounded-lg flex items-center gap-3 transition-colors ${
                    pathname === subItem.path
                      ? "bg-blue-500 text-white font-bold"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <span className="text-lg">{subItem.icon}</span>
                  <span className="text-sm">{subItem.label}</span>
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
        className={`cursor-pointer p-3 rounded-lg flex items-center gap-3 transition-colors ${
          pathname === item.path
            ? "bg-blue-600 text-white font-bold"
            : "hover:bg-gray-700"
        }`}
      >
        <span className="text-lg">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-48 bg-gray-800 text-white p-4 flex flex-col gap-2">
      <div className="p-4 text-center border-b border-gray-700 mb-4">
        <h2 className="font-bold text-lg">MENÚ</h2>
      </div>

      {menuItems.map(renderMenuItem)}
    </aside>
  );
}
