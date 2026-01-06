"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { Despacho } from "@/services/despachoService";

interface DespachoMetrics {
  total: number;
  disponibles: number;
  enRuta: number;
  entregados: number;
  cancelados: number;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DespachoMetrics>({
    total: 0,
    disponibles: 0,
    enRuta: 0,
    entregados: 0,
    cancelados: 0,
  });
  const [loading, setLoading] = useState(true);

  // Redirigir choferes a su dashboard específico
  useEffect(() => {
    if (user?.rol.includes("chofer")) {
      router.push("/chofer");
    }
  }, [user, router]);

  // Cargar métricas de despachos
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:4000/api/despachos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          const despachos: Despacho[] = result.data;

          // Calcular métricas
          const metrics = {
            total: despachos.length,
            disponibles: despachos.filter(
              (d) => d.estado === "pendiente" && !d.rutaAsignada
            ).length,
            enRuta: despachos.filter((d) => d.estado === "asignado" || !!d.rutaAsignada)
              .length,
            entregados: despachos.filter(
              (d) => d.estado === "entregado" || !!d.entrega?.fechaEntrega
            ).length,
            cancelados: despachos.filter((d) => d.estado === "cancelado").length,
          };

          setMetrics(metrics);
        }
      } catch (error) {
        console.error("Error al cargar métricas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <ProtectedRoute
      allowedRoles={["admin", "chofer", "subBodega", "adminBodega"]}
    >
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-black">Dashboard</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Sistema de gestión de despachos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Distintivo de usuario */}
                {user && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-linear-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
                    <span className="text-lg">👤</span>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-semibold text-orange-900 leading-tight">
                        {user.pnombre} {user.papellido}
                      </span>
                    </div>
                  </div>
                )}
                <Button onClick={handleLogout} variant="danger" size="md">
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Métricas de Despachos */}
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> Métricas de Despachos
            </h2>

            {loading ? (
              <div className="text-center py-8 text-gray-600">
                Cargando métricas...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                  label="Total"
                  value={metrics.total}
                  icon="📦"
                  bgColor="bg-gray-100"
                  borderColor="border-gray-300"
                  textColor="text-gray-900"
                />
                <MetricCard
                  label="Disponibles"
                  value={metrics.disponibles}
                  icon="✅"
                  bgColor="bg-green-50"
                  borderColor="border-green-300"
                  textColor="text-green-700"
                />
                <MetricCard
                  label="En Ruta"
                  value={metrics.enRuta}
                  icon="🚚"
                  bgColor="bg-blue-50"
                  borderColor="border-blue-300"
                  textColor="text-blue-700"
                />
                <MetricCard
                  label="Entregados"
                  value={metrics.entregados}
                  icon="✔️"
                  bgColor="bg-purple-50"
                  borderColor="border-purple-300"
                  textColor="text-purple-700"
                />
                <MetricCard
                  label="Cancelados"
                  value={metrics.cancelados}
                  icon="❌"
                  bgColor="bg-red-50"
                  borderColor="border-red-300"
                  textColor="text-red-700"
                />
              </div>
            )}
          </Card>

          {/* Sección de acciones rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard
              title="Despachos"
              description="Gestionar despachos pendientes"
              icon="📦"
              onClick={() => router.push("/despachos")}
            />
            <QuickActionCard
              title="Rutas"
              description="Ver y asignar rutas"
              icon="🚚"
              onClick={() => router.push("/rutas")}
            />
            <QuickActionCard
              title="Empresas"
              description="Gestionar empresas de reparto"
              icon="🏢"
              onClick={() => router.push("/empresas")}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

// Componente auxiliar para métricas
function MetricCard({
  label,
  value,
  icon,
  bgColor,
  borderColor,
  textColor,
}: {
  label: string;
  value: number;
  icon: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}) {
  return (
    <div
      className={`p-4 ${bgColor} border-2 ${borderColor} rounded-lg transition-transform hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${textColor}`}>{value}</span>
      </div>
      <p className="text-sm font-semibold text-gray-700">{label}</p>
    </div>
  );
}

// Componente auxiliar para cards de acciones rápidas
function QuickActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className="hover:shadow-xl transition-all cursor-pointer border border-gray-200 hover:border-primary-400 hover:-translate-y-1"
      padding="lg"
      onClick={onClick}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Card>
  );
}
