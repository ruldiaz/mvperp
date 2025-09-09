// app/dashboard/components/Sidebar.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  selectedPage: string;
  setSelectedPage: (page: string) => void;
}

const menuItems = [
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
  { id: "ventas", path: "/dashboard/sales", label: "VENTAS", icon: "💰" },
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
    icon: "🧾", // Nuevo ítem para facturas
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

  const handleNavigation = (path: string, pageId: string) => {
    setSelectedPage(pageId);
    router.push(path);
  };

  return (
    <aside className="w-48 bg-gray-800 text-white p-4 flex flex-col gap-2">
      <div className="p-4 text-center border-b border-gray-700 mb-4">
        <h2 className="font-bold text-lg">MENÚ</h2>
      </div>

      {menuItems.map((item) => (
        <div
          key={item.id}
          onClick={() => handleNavigation(item.path, item.id)}
          className={`cursor-pointer p-3 rounded-lg flex items-center gap-3 transition-colors ${
            pathname === item.path
              ? "bg-blue-600 text-white font-bold"
              : "hover:bg-gray-700"
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </aside>
  );
}
