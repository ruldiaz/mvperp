// src/app/dashboard/components/Navbar.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex justify-end relative">
      <div
        className="cursor-pointer"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {user.name || "Usuario"}
      </div>

      {menuOpen && (
        <div className="absolute right-4 mt-12 bg-white text-black border rounded shadow-md w-48">
          <div className="px-4 py-2 border-b">{user.email}</div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 hover:bg-gray-200"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}
