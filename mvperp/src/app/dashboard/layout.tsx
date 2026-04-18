"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Navbar, { User } from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedPage, setSelectedPage] = useState("inicio");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        window.location.href = "/login";
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (pathname.includes("/products")) setSelectedPage("productos");
    else if (pathname.includes("/customers")) setSelectedPage("clientes");
    else if (pathname.includes("/sales")) setSelectedPage("ventas");
    else if (pathname.includes("/purchases")) setSelectedPage("compras");
    else if (pathname.includes("/suppliers")) setSelectedPage("proveedores");
    else if (pathname.includes("/invoices")) setSelectedPage("facturas");
    else if (pathname.includes("/profile")) setSelectedPage("perfil");
    else if (pathname.includes("/settings")) setSelectedPage("ajustes");
    else setSelectedPage("inicio");
  }, [pathname]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f8fafc" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={40} sx={{ color: "#334155", mb: 2 }} />
          <Typography sx={{ color: "#64748b", fontWeight: 500 }}>Iniciando sesión segura...</Typography>
        </Box>
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f8fafc" }}>
      <Toaster position="top-right" />

      {/* Navbar - Full width at top */}
      <Navbar user={user} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Body: Sidebar + Content side by side */}
      <Box sx={{ flex: 1, display: "flex", minHeight: 0, position: "relative", overflow: "hidden" }}>
        {/* Sidebar */}
        <Sidebar selectedPage={selectedPage} setSelectedPage={setSelectedPage} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Dynamic Content */}
          <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4, lg: 6 }, overflow: "auto" }}>
            <Box sx={{ maxWidth: "1400px", mx: "auto" }}>
              <Box 
                sx={{ 
                  bgcolor: "white", 
                  borderRadius: 3, 
                  border: "1px solid #e2e8f0", 
                  p: { xs: 2, md: 4 },
                  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
                }}
              >
                {children}
              </Box>
            </Box>
          </Box>

          {/* Dashboard Footer */}
          <Box 
            component="footer" 
            sx={{ 
              bgcolor: "white", 
              borderTop: "1px solid #e2e8f0", 
              px: { xs: 3, md: 6 }, 
              py: { xs: 2, md: 3 },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              © {new Date().getFullYear()} MVP ERP v1.2.0 • Terminal Segura
            </Typography>
            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 3 }}>
              <Typography variant="caption" component="button" sx={{ color: "#94a3b8", border: "none", bgcolor: "transparent", cursor: "pointer", "&:hover": { color: "#475569" } }}>Ayuda</Typography>
              <Typography variant="caption" component="button" sx={{ color: "#94a3b8", border: "none", bgcolor: "transparent", cursor: "pointer", "&:hover": { color: "#475569" } }}>Términos</Typography>
              <Typography variant="caption" component="button" sx={{ color: "#94a3b8", border: "none", bgcolor: "transparent", cursor: "pointer", "&:hover": { color: "#475569" } }}>Privacidad</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
