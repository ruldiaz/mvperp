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
  Menu,
} from "lucide-react";

interface SidebarProps {
  selectedPage: string;
  setSelectedPage: (page: string) => void;
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

export default function Sidebar({ setSelectedPage }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSubmenu = (menuId: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenSubmenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleNav = (path: string, id: string) => {
    setSelectedPage(id);
    router.push(path);
  };

  const renderItem = (item: MenuItem, isSub = false) => {
    const hasSub = !!item.submenu;
    const isOpen = openSubmenus[item.id] || false;
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
              px: isCollapsed ? 1 : 2,
              justifyContent: isCollapsed ? "center" : "flex-start",
              bgcolor: isActive && !hasSub ? alpha("#334155", 0.08) : "transparent",
              color: isActive ? "#1e293b" : "#64748b",
              "&:hover": { bgcolor: alpha("#334155", 0.04) },
            }}
          >
            <ListItemIcon sx={{ minWidth: isCollapsed ? 0 : 40, justifyContent: "center", color: isActive ? "#334155" : "#94a3b8" }}>
              {item.icon}
            </ListItemIcon>
            {!isCollapsed && (
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
            )}
            {!isCollapsed && hasSub && (
              <ChevronDown 
                size={16} 
                style={{ 
                  transform: isOpen ? "rotate(180deg)" : "none", 
                  transition: "0.2s",
                  color: "#94a3b8" 
                }} 
              />
            )}
          </ListItemButton>
        </ListItem>
        
        {hasSub && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 3, mb: 1 }}>
              {item.submenu?.map(sub => renderItem(sub, true))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box sx={{ width: isCollapsed ? 80 : 280, transition: "width 0.3s ease", bgcolor: "white", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
      {/* Brand Header */}
      <Box sx={{ 
        p: isCollapsed ? 2 : 4, 
        pt: 4,
        display: "flex", 
        alignItems: "center", 
        gap: 1.5,
        justifyContent: isCollapsed ? "center" : "flex-start",
      }}>
        <Box 
          onClick={() => setIsCollapsed(!isCollapsed)}
          sx={{ 
            width: 36, 
            height: 36, 
            bgcolor: "#334155", 
            borderRadius: 1.5, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            cursor: "pointer",
            "&:hover": { bgcolor: "#1e293b" }
          }}
        >
          <Menu color="white" size={22} strokeWidth={1.5} />
        </Box>
        {!isCollapsed && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>MVP ERP</Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>ADMINISTRACIÓN</Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mx: 2, mb: 2, opacity: 0.6 }} />

      {/* Main Navigation */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1 }}>
        {!isCollapsed && (
          <Typography variant="caption" sx={{ px: 3, mb: 1, display: "block", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Navegación Principal
          </Typography>
        )}
        <List>{menuItems.map(item => renderItem(item))}</List>

        <Box sx={{ mt: 4 }}>
          {!isCollapsed && (
            <Typography variant="caption" sx={{ px: 3, mb: 1, display: "block", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sistema
            </Typography>
          )}
          <List>{secondaryItems.map(item => renderItem(item))}</List>
        </Box>
      </Box>

      {/* Sidebar Footer */}
      {!isCollapsed && (
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
      )}
    </Box>
  );
}
