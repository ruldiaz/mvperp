// src/app/dashboard/components/Sidebar.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  selectedPage: string;
  setSelectedPage: (page: string) => void;
}

const menuItems = [
  { id: "inicio", path: "/dashboard", label: "INICIO" },
  { id: "productos", path: "/dashboard/products", label: "PRODUCTOS" },
  { id: "clientes", path: "/dashboard/customers", label: "CLIENTES" },
  { id: "ventas", path: "/dashboard/sales", label: "VENTAS" },
  { id: "compras", path: "/dashboard/purchases", label: "COMPRAS" },
  { id: "proveedores", path: "/dashboard/suppliers", label: "PROVEEDORES" },
  { id: "perfil", path: "/dashboard/profile", label: "PERFIL" },
  { id: "ajustes", path: "/dashboard/settings", label: "AJUSTES" },
];

export default function Sidebar({ setSelectedPage }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string, pageId: string) => {
    setSelectedPage(pageId);
    router.push(path);
  };

  return (
    <aside className="w-48 bg-gray-200 p-4 flex flex-col gap-2">
      {menuItems.map((item) => (
        <div
          key={item.id}
          onClick={() => handleNavigation(item.path, item.id)}
          className={`cursor-pointer p-2 rounded ${
            pathname === item.path ? "bg-gray-400 font-bold" : ""
          }`}
        >
          {item.label}
        </div>
      ))}
    </aside>
  );
}
