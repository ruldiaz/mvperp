// app/dashboard/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  Building,
  UserCircle,
  Settings,
  ChevronRight,
  HelpCircle,
  Quote,
} from "lucide-react";

interface SidebarProps {
  selectedPage: string;
  setSelectedPage: (page: string) => void;
}

interface MenuItem {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  submenu?: MenuItem[];
}

// Componente para iconos con estilo consistente
const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-5 h-5 flex items-center justify-center">{children}</div>
);

const menuItems: MenuItem[] = [
  {
    id: "inicio",
    path: "/dashboard",
    label: "INICIO",
    icon: (
      <IconWrapper>
        <Home size={18} />
      </IconWrapper>
    ),
  },
  {
    id: "productos",
    path: "/dashboard/products",
    label: "PRODUCTOS",
    icon: (
      <IconWrapper>
        <Package size={18} />
      </IconWrapper>
    ),
  },
  {
    id: "clientes",
    path: "/dashboard/customers",
    label: "CLIENTES",
    icon: (
      <IconWrapper>
        <Users size={18} />
      </IconWrapper>
    ),
  },
  {
    id: "ventas",
    path: "/dashboard/sales",
    label: "VENTAS",
    icon: (
      <IconWrapper>
        <DollarSign size={18} />
      </IconWrapper>
    ),
    submenu: [
      {
        id: "cotizacion",
        path: "/dashboard/sales/quotation",
        label: "COTIZACIÓN",
        icon: (
          <IconWrapper>
            <Quote size={16} />
          </IconWrapper>
        ),
      },
      {
        id: "ventas-list",
        path: "/dashboard/sales",
        label: "LISTA VENTAS",
        icon: (
          <IconWrapper>
            <DollarSign size={16} />
          </IconWrapper>
        ),
      },
    ],
  },
  {
    id: "compras",
    path: "/dashboard/purchases",
    label: "COMPRAS",
    icon: (
      <IconWrapper>
        <ShoppingCart size={18} />
      </IconWrapper>
    ),
  },
  {
    id: "proveedores",
    path: "/dashboard/suppliers",
    label: "PROVEEDORES",
    icon: (
      <IconWrapper>
        <Building size={18} />
      </IconWrapper>
    ),
  },
  {
    id: "facturas",
    path: "/dashboard/invoices",
    label: "FACTURAS",
    icon: (
      <IconWrapper>
        <Building size={18} />
      </IconWrapper>
    ),
  },
  {
    id: "perfil",
    path: "/dashboard/profile",
    label: "PERFIL FISCAL",
    icon: (
      <IconWrapper>
        <UserCircle size={18} />
      </IconWrapper>
    ),
  },
  {
    id: "ajustes",
    path: "/dashboard/settings",
    label: "AJUSTES",
    icon: (
      <IconWrapper>
        <Settings size={18} />
      </IconWrapper>
    ),
  },
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
                ? "bg-gradient-to-r from-blue-800 to-blue-900 text-white font-semibold shadow-sm"
                : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`transition-colors duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              >
                {item.icon}
              </div>
              <span className="font-medium">{item.label}</span>
            </div>
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${
                isSubmenuOpen(item.id) ? "rotate-90" : "rotate-0"
              } ${isActive ? "text-white" : "text-gray-400"}`}
            />
          </div>

          {isSubmenuOpen(item.id) && (
            <div className="ml-10 mt-1 flex flex-col gap-1 border-l border-blue-200 pl-4">
              {item.submenu!.map((subItem) => (
                <Link
                  key={subItem.id}
                  href={subItem.path}
                  onClick={() => handleNavigation(subItem.path, subItem.id)}
                  className={`cursor-pointer p-2.5 rounded-lg flex items-center gap-3 transition-all duration-200 ${
                    pathname === subItem.path
                      ? "bg-blue-100 text-gray-900 font-medium border-l-2 border-blue-900 -ml-0.5"
                      : "text-gray-600 hover:bg-blue-50 hover:text-gray-900"
                  }`}
                >
                  <div
                    className={`${pathname === subItem.path ? "text-gray-900" : "text-gray-500"}`}
                  >
                    {subItem.icon}
                  </div>
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
        className={`cursor-pointer p-3 rounded-lg flex items-center gap-3 transition-all duration-200 group ${
          pathname === item.path
            ? "bg-gradient-to-r from-blue-800 to-blue-900 text-white font-semibold shadow-sm"
            : "text-gray-700 hover:bg-blue-100 hover:text-gray-900"
        }`}
      >
        <div
          className={`transition-colors duration-200 ${
            pathname === item.path
              ? "text-white"
              : "text-gray-500 group-hover:text-gray-700"
          }`}
        >
          {item.icon}
        </div>
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-blue-200 p-6 flex flex-col gap-2 shadow-sm">
      {/* Logo y título */}
      <div className="p-4 mb-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-800 to-blue-900 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow transition-all duration-200">
            <span className="text-white font-bold text-lg">ERP</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Business ERP</h2>
            <p className="text-xs text-gray-500">Administración</p>
          </div>
        </Link>
      </div>

      {/* Separador */}
      <div className="h-px bg-blue-200 mb-4"></div>

      {/* Menú */}
      <div className="space-y-1 flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
          Navegación
        </h3>
        {menuItems.map(renderMenuItem)}
      </div>

      {/* Footer de sidebar */}
      <div className="mt-8 pt-6 border-t border-blue-200">
        <div className="px-3 py-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-gray-600 mb-2">¿Necesitas ayuda?</p>
          <button className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Soporte Técnico
          </button>
        </div>
      </div>
    </aside>
  );
}
