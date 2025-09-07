"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include", // permite recibir la cookie HttpOnly
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("¡Ingreso exitoso!");
      router.push("/dashboard");
    } else {
      toast.error(data.error || "Error en login");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-4xl font-bold mb-6 text-center">Login</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="font-semibold">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="font-semibold">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 cursor-pointer"
          >
            Ingresar
          </button>

          {/* Enlace a "Olvidé mi contraseña" */}
          <div className="text-right mt-2">
            <button
              type="button"
              className="text-blue-600 hover:underline text-sm cursor-pointer"
              onClick={() => router.push("/forgot-password")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          {/* Enlace a "Registrarse" */}
          <div className="text-center mt-4">
            <button
              type="button"
              className="text-blue-900 hover:underline text-sm cursor-pointer"
              onClick={() => router.push("/register")}
            >
              ¿No tienes cuenta? Regístrate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
