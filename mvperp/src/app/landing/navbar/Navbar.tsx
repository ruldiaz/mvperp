"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-gray-100 p-4 flex justify-end">
      <Link href="/login" className="text-blue-600 font-semibold">
        Ingresar
      </Link>
    </nav>
  );
}
