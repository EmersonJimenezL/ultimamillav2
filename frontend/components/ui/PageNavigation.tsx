"use client";

import { useRouter } from "next/navigation";
import { Button } from "./Button";

interface NavigationLink {
  label: string;
  href: string;
  icon?: string;
}

interface PageNavigationProps {
  title: string;
  description?: string;
  currentPage: "dashboard" | "despachos" | "rutas" | "empresas";
  actions?: React.ReactNode;
}

export function PageNavigation({
  title,
  description,
  currentPage,
  actions,
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
      {/* Navegación principal */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
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