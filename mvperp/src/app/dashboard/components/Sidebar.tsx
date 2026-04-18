// src/app/dashboard/components/Sidebar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  alpha,
} from "@mui/material";
import {
  Home,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  Building,
  UserCircle,
  Settings,
  ChevronDown,
  HelpCircle,
  Quote,
  ShieldCheck,
  Briefcase,
} from "lucide-react";

interface SidebarProps {
  selectedPage: string;
  setSelectedPage: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "inicio",
    path: "/dashboard",
    label: "Inicio",
    icon: <Home size={20} strokeWidth={1.5} />,
  },
  {
    id: "productos",
    path: "/dashboard/products",
    label: "Productos",
    icon: <Package size={20} strokeWidth={1.5} />,
  },
  {
    id: "clientes",
    path: "/dashboard/customers",
    label: "Clientes",
    icon: <Users size={20} strokeWidth={1.5} />,
  },
  {
    id: "ventas",
    path: "/dashboard/sales",
    label: "Ventas",
    icon: <DollarSign size={20} strokeWidth={1.5} />,
    submenu: [
      {
        id: "cotizacion",
        path: "/dashboard/sales/quotation",
        label: "Cotización",
        icon: <Quote size={18} strokeWidth={1.5} />,
      },
      {
        id: "ventas-list",
        path: "/dashboard/sales",
        label: "Histórico de Ventas",
        icon: <Briefcase size={18} strokeWidth={1.5} />,
      },
    ],
  },
  {
    id: "compras",
    path: "/dashboard/purchases",
    label: "Compras",
    icon: <ShoppingCart size={20} strokeWidth={1.5} />,
  },
  {
    id: "proveedores",
    path: "/dashboard/suppliers",
    label: "Proveedores",
    icon: <Building size={20} strokeWidth={1.5} />,
  },
  {
    id: "facturas",
    path: "/dashboard/invoices",
    label: "Facturación SAT",
    icon: <Building size={20} strokeWidth={1.5} />,
  },
];

const secondaryItems: MenuItem[] = [
  {
    id: "perfil",
    path: "/dashboard/profile",
    label: "Perfil Fiscal",
    icon: <UserCircle size={20} strokeWidth={1.5} />,
  },
  {
    id: "ajustes",
    path: "/dashboard/settings",
    label: "Configuración",
    icon: <Settings size={20} strokeWidth={1.5} />,
  },
];

export default function Sidebar({ setSelectedPage, isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});

  const toggleSubmenu = (menuId: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleNav = (path: string, id: string) => {
    setSelectedPage(id);
    router.push(path);
    // On mobile, close sidebar after navigation
    if (window.innerWidth < 768) onClose();
  };

  const renderItem = (item: MenuItem, isSub = false) => {
    const hasSub = !!item.submenu;
    const isSubOpen = openSubmenus[item.id] || false;
    const isActive = pathname === item.path || (hasSub && item.submenu?.some(s => pathname === s.path));

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => hasSub ? toggleSubmenu(item.id) : handleNav(item.path, item.id)}
            sx={{
              borderRadius: 2,
              mx: 1,
              py: 1.2,
              bgcolor: isActive && !hasSub ? alpha("#334155", 0.08) : "transparent",
              color: isActive ? "#1e293b" : "#64748b",
              "&:hover": { bgcolor: alpha("#334155", 0.04) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: isActive ? "#334155" : "#94a3b8" }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography sx={{ 
                  fontSize: isSub ? "0.85rem" : "0.9rem", 
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: "-0.01em"
                }}>
                  {item.label}
                </Typography>
              } 
            />
            {hasSub && (
              <ChevronDown 
                size={16} 
                style={{ 
                  transform: isSubOpen ? "rotate(180deg)" : "none", 
                  transition: "0.2s",
                  color: "#94a3b8" 
                }} 
              />
            )}
          </ListItemButton>
        </ListItem>
        
        {hasSub && (
          <Collapse in={isSubOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 3, mb: 1 }}>
              {item.submenu?.map(sub => renderItem(sub, true))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <Box
          onClick={onClose}
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.3)',
            zIndex: 19,
          }}
        />
      )}

      <Box
        sx={{
          width: isOpen ? 280 : 0,
          minWidth: isOpen ? 280 : 0,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          bgcolor: 'white',
          borderRight: isOpen ? '1px solid #e2e8f0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          // On mobile, position as overlay within the body container (below navbar)
          position: { xs: 'absolute', md: 'relative' },
          top: { xs: 0, md: 'auto' },
          left: { xs: 0, md: 'auto' },
          height: { xs: '100%', md: 'auto' },
          zIndex: { xs: 20, md: 'auto' },
          boxShadow: { xs: isOpen ? '4px 0 24px rgba(0,0,0,0.1)' : 'none', md: 'none' },
        }}
      >
        {/* Brand Header */}
        <Box sx={{ p: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, bgcolor: "#334155", borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck color="white" size={22} strokeWidth={1.5} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>MVP ERP</Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>ADMINISTRACIÓN</Typography>
          </Box>
        </Box>

        <Divider sx={{ mx: 2, mb: 2, opacity: 0.6 }} />

        {/* Main Navigation */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 1 }}>
          <Typography variant="caption" sx={{ px: 3, mb: 1, display: "block", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Navegación Principal
          </Typography>
          <List>{menuItems.map(item => renderItem(item))}</List>

          <Box sx={{ mt: 4 }}>
            <Typography variant="caption" sx={{ px: 3, mb: 1, display: "block", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sistema
            </Typography>
            <List>{secondaryItems.map(item => renderItem(item))}</List>
          </Box>
        </Box>

        {/* Sidebar Footer */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 3, border: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <HelpCircle size={16} color="#64748b" />
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569" }}>Soporte Técnico</Typography>
            </Box>
            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 2 }}>¿Necesitas ayuda con el sistema?</Typography>
            <Button fullWidth variant="outlined" size="small" sx={{ textTransform: "none", borderRadius: 1.5, borderColor: "#e2e8f0", color: "#475569" }}>
              Contactar
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
