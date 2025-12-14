"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordClient() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Contraseña cambiada con éxito, redirigiendo...");
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setMessage(data.error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow w-80"
      >
        <h1 className="text-xl font-bold mb-4">Nueva contraseña</h1>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-3 py-2 w-full mb-4 rounded"
          required
        />

        <button
          type="submit"
          className="bg-green-600 text-white py-2 rounded w-full"
        >
          Guardar
        </button>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </form>
    </div>
  );
}
