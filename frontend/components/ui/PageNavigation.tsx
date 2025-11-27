"use client";

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

  return (
    <div className="mb-6">
      {/* Navegación principal con usuario */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {navigationLinks.map((link) => (
            <Button
              key={link.href}
              onClick={() => router.push(link.href)}
              variant="secondary"
              size="sm"
            >
              {link.icon && <span className="mr-1">{link.icon}</span>}
              {link.label}
            </Button>
          ))}
        </div>

        {/* Distintivo de usuario */}
        {userInfo && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
            <span className="text-lg">👤</span>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-orange-900 leading-tight">
                {userInfo.nombre}
              </span>
              {userInfo.rol && (
                <span className="text-xs text-orange-600 leading-tight">
                  {userInfo.rol}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Header con título y acciones */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-gray-600 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
    </div>
  );
}