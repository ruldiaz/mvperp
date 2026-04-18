// src/app/dashboard/components/Navbar.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Bell,
  LogOut,
  User as UserIcon,
  Settings,
  ChevronDown,
  Search,
} from "lucide-react";

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Sesión cerrada");
        router.push("/login");
      }
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  const initials = user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase();

  return (
    <Box
      component="nav"
      sx={{
        bgcolor: "white",
        borderBottom: "1px solid #e2e8f0",
        px: 4,
        py: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
          Panel de Control
        </Typography>
        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
          Resumen operativo del día
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Search - Minimalist placeholder */}
        <Box 
          sx={{ 
            display: { xs: "none", sm: "flex" }, 
            alignItems: "center", 
            gap: 1.5, 
            px: 2, 
            py: 1, 
            bgcolor: "#f8fafc", 
            borderRadius: 2, 
            border: "1px solid #f1f5f9",
            color: "#94a3b8",
            mr: 2
          }}
        >
          <Search size={16} />
          <Typography sx={{ fontSize: "0.85rem" }}>Buscar transacciones...</Typography>
        </Box>

        {/* Notifications */}
        <IconButton onClick={handleNotifOpen} sx={{ color: "#64748b", bgcolor: "#f8fafc", "&:hover": { bgcolor: "#f1f5f9" } }}>
          <Badge badgeContent={3} color="error" sx={{ "& .MuiBadge-badge": { fontSize: '0.65rem', height: 16, minWidth: 16 } }}>
            <Bell size={20} strokeWidth={2} />
          </Badge>
        </IconButton>
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleNotifClose}
          elevation={4}
          sx={{ "& .MuiPaper-root": { width: 320, borderRadius: 2, mt: 1.5, border: "1px solid #e2e8f0" } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notificaciones</Typography>
          </Box>
          <Divider />
          {[1, 2, 3].map((i) => (
            <MenuItem key={i} onClick={handleNotifClose} sx={{ py: 1.5, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Nueva Cotización #{i}045</Typography>
              <Typography variant="caption" color="text.secondary">Hace 15 minutos</Typography>
            </MenuItem>
          ))}
        </Menu>

        {/* User Profile */}
        <Box 
          onClick={handleProfileOpen}
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1.5, 
            cursor: "pointer", 
            pl: 1, 
            py: 0.5, 
            pr: 2, 
            borderRadius: 2.5,
            transition: "all 0.2s",
            "&:hover": { bgcolor: "#f8fafc" }
          }}
        >
          <Avatar 
            sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: "#334155", 
              fontSize: "0.9rem", 
              fontWeight: 700 
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
              {user.name || "Usuario"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              Administrador
            </Typography>
          </Box>
          <ChevronDown size={16} color="#94a3b8" />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileClose}
          elevation={4}
          sx={{ "& .MuiPaper-root": { width: 220, borderRadius: 2, mt: 1.5, border: "1px solid #e2e8f0" } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">MI CUENTA</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{user.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleProfileClose(); router.push("/dashboard/profile"); }} sx={{ gap: 1.5, py: 1.2 }}>
            <UserIcon size={16} /> <Typography variant="body2">Perfil Fiscal</Typography>
          </MenuItem>
          <MenuItem onClick={handleProfileClose} sx={{ gap: 1.5, py: 1.2 }}>
            <Settings size={16} /> <Typography variant="body2">Ajustes</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.2, color: "error.main" }}>
            <LogOut size={16} /> <Typography variant="body2" sx={{ fontWeight: 600 }}>Cerrar Sesión</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
