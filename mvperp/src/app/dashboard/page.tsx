// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  Package,
  CheckCircle,
  TrendingUp,
  Plus,
  User,
  FileText,
  BarChart3,
  FileEdit,
  ShoppingBag,
  PackagePlus,
  Users,
  Clock,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    activeProducts: 0,
    pendingTasks: 0,
    revenue: 0,
  });

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

    // Simular carga de estadísticas
    setTimeout(() => {
      setStats({
        totalSales: 1245,
        activeProducts: 89,
        pendingTasks: 12,
        revenue: 25489.5,
      });
    }, 500);
  }, [router]);

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header de bienvenida */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Bienvenido de nuevo,{" "}
            <span className="text-blue-600">
              {user.name || user.email.split("@")[0]}
            </span>
            !
          </h1>
          <p className="text-gray-600">
            Aquí tienes un resumen de tu negocio hoy{" "}
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            .
          </p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nueva Venta
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Ventas Totales",
            value: stats.totalSales,
            change: "+12%",
            color: "from-blue-500 to-cyan-500",
            icon: <DollarSign className="w-6 h-6 text-white" />,
          },
          {
            title: "Productos Activos",
            value: stats.activeProducts,
            change: "+5%",
            color: "from-green-500 to-emerald-500",
            icon: <Package className="w-6 h-6 text-white" />,
          },
          {
            title: "Tareas Pendientes",
            value: stats.pendingTasks,
            change: "-3%",
            color: "from-orange-500 to-amber-500",
            icon: <CheckCircle className="w-6 h-6 text-white" />,
          },
          {
            title: "Ingresos del Mes",
            value: `$${stats.revenue.toLocaleString("es-MX")}`,
            change: "+18%",
            color: "from-purple-500 to-pink-500",
            icon: <TrendingUp className="w-6 h-6 text-white" />,
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-md`}
              >
                {stat.icon}
              </div>
            </div>
            <div className="flex items-center">
              <span
                className={`text-sm font-medium ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
              >
                {stat.change} este mes
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Crear Producto",
              icon: <PackagePlus className="w-6 h-6" />,
              path: "/dashboard/products",
              color: "bg-blue-100 text-blue-600",
            },
            {
              label: "Nuevo Cliente",
              icon: <User className="w-6 h-6" />,
              path: "/dashboard/customers",
              color: "bg-green-100 text-green-600",
            },
            {
              label: "Generar Factura",
              icon: <FileText className="w-6 h-6" />,
              path: "/dashboard/invoices",
              color: "bg-purple-100 text-purple-600",
            },
            {
              label: "Ver Reportes",
              icon: <BarChart3 className="w-6 h-6" />,
              path: "/dashboard/reports",
              color: "bg-orange-100 text-orange-600",
            },
          ].map((action, index) => (
            <Link
              key={index}
              href={action.path}
              className={`${action.color} p-4 rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-center text-center gap-2`}
            >
              {action.icon}
              <span className="font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Últimas actividades */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Actividad Reciente
          </h2>
          <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center gap-1">
            Ver todas <span>→</span>
          </button>
        </div>
        <div className="space-y-4">
          {[
            {
              user: "Juan Pérez",
              action: "creó una nueva cotización",
              time: "Hace 2 horas",
              icon: <FileEdit className="w-5 h-5 text-gray-600" />,
            },
            {
              user: "María García",
              action: "realizó una venta de $1,250",
              time: "Hace 4 horas",
              icon: <ShoppingBag className="w-5 h-5 text-gray-600" />,
            },
            {
              user: "Pedro López",
              action: "actualizó el inventario",
              time: "Hace 6 horas",
              icon: <Package className="w-5 h-5 text-gray-600" />,
            },
            {
              user: "Ana Martínez",
              action: "agregó un nuevo cliente",
              time: "Hace 1 día",
              icon: <Users className="w-5 h-5 text-gray-600" />,
            },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors duration-200"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                {activity.icon}
              </div>
              <div className="flex-1">
                <p className="text-gray-800">
                  <span className="font-medium">{activity.user}</span>{" "}
                  {activity.action}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.time}
                </p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                Ver detalles
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
