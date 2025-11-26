"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Redirigir choferes a su dashboard específico
  useEffect(() => {
    if (user?.rol.includes("chofer")) {
      router.push("/chofer");
    }
  }, [user, router]);

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
              <div>
                <h1 className="text-2xl font-bold text-black">Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Sistema de gestión de despachos
                </p>
              </div>
              <Button onClick={handleLogout} variant="danger" size="md">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Card de bienvenida */}
          <Card className="mb-6 border border-gray-100">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 bg-linear-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-black">
                  {user?.pnombre?.charAt(0)}
                  {user?.papellido?.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">
                  Bienvenido, {user?.pnombre} {user?.papellido}
                </h2>
                <p className="text-gray-600">@{user?.usuario}</p>
              </div>
            </div>

            {/* Información del usuario en grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <InfoItem label="Usuario" value={user?.usuario || ""} />
                <InfoItem label="Email" value={user?.email || ""} />
                <InfoItem
                  label="Estado"
                  value={user?.activo ? "Activo" : "Inactivo"}
                  valueColor={user?.activo ? "text-green-600" : "text-red-600"}
                />
              </div>
              <div className="space-y-3">
                <InfoItem
                  label="Sucursales"
                  value={
                    user?.sucursal
                      ? Array.isArray(user.sucursal)
                        ? user.sucursal.join(", ")
                        : user.sucursal
                      : ""
                  }
                />
                <InfoItem
                  label="Áreas"
                  value={
                    user?.area
                      ? Array.isArray(user.area)
                        ? user.area.join(", ")
                        : user.area
                      : ""
                  }
                />
              </div>
            </div>
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

// Componente auxiliar para mostrar información
function InfoItem({
  label,
  value,
  valueColor = "text-black",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`text-base font-semibold ${valueColor}`}>{value}</p>
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
