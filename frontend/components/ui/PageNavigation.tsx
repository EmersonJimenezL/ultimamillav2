"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "./Button";

interface NavigationLink {
  label: string;
  href: string;
  icon?: string;
}

interface UserInfo {
  nombre: string;
  rol?: string;
}

interface PageNavigationProps {
  title: string;
  description?: string;
  currentPage: "dashboard" | "despachos" | "rutas" | "empresas";
  actions?: React.ReactNode;
  userInfo?: UserInfo;
}

export function PageNavigation({
  title,
  description,
  currentPage,
  actions,
  userInfo,
}: PageNavigationProps) {
  const router = useRouter();

  const links: NavigationLink[] = [
    { label: "Dashboard", href: "/dashboard", icon: "🏠" },
    { label: "Despachos", href: "/despachos", icon: "📦" },
    { label: "Rutas", href: "/rutas", icon: "🚚" },
    { label: "Empresas", href: "/empresas", icon: "🏢" },
  ];

  // Filtrar el link de la página actual
  const navigationLinks = links.filter((link) => {
    const pageName = link.href.replace("/", "") || "dashboard";
    return pageName !== currentPage;
  });

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-black">
              Gestión de Despachos
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Administra despachos y crea rutas de reparto
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <button
              onClick={() => router.push("/rutas")}
              className="px-4 py-2 bg-linear-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 hover:from-purple-600 hover:to-purple-700 active:scale-95"
            >
              🚚 Rutas
            </button>
            <button
              onClick={() => router.push("/empresas")}
              className="px-4 py-2 bg-linear-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 hover:from-green-600 hover:to-green-700 active:scale-95"
            >
              🏢 Empresas
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-linear-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 hover:from-gray-600 hover:to-gray-700 active:scale-95"
            >
              ← Volver
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-linear-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 hover:from-red-600 hover:to-red-700 active:scale-95"
            >
              🚪 Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
