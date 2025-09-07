// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar, { User } from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Products from "./products/page";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedPage, setSelectedPage] = useState("inicio");

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  if (!user) return null;

  const renderContent = () => {
    switch (selectedPage) {
      case "inicio":
        return (
          <div>
            <h1 className="text-2xl font-bold">Bienvenido, {user.name}</h1>
            <p>Esta es la página de inicio.</p>
          </div>
        );
      case "perfil":
        return (
          <div>
            <h1 className="text-2xl font-bold">Perfil del usuario</h1>
            <p>Correo: {user.email}</p>
          </div>
        );
      case "ajustes":
        return (
          <div>
            <h1 className="text-2xl font-bold">Ajustes</h1>
            <p>Configuraciones de tu cuenta.</p>
          </div>
        );
      case "productos":
        return <Products />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar selectedPage={selectedPage} setSelectedPage={setSelectedPage} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} />
        <main className="flex-1 p-4">{renderContent()}</main>
      </div>
    </div>
  );
}
