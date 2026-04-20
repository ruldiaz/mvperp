import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["www.truper.com"], // habilita cargar imágenes desde este dominio
  },
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
