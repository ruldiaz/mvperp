"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar, { User } from "./components/Navbar";
import Sidebar from "./components/Sidebar";

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

  return (
    <div>
      <h1 className="text-2xl font-bold">Bienvenido, {user.name}</h1>
      <p>Esta es la página de inicio.</p>
    </div>
  );
}
