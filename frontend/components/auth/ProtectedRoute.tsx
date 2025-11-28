"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

/**
 * Componente que protege rutas verificando autenticación y roles
 * Solo permite acceso si el usuario está autenticado y tiene uno de los roles permitidos
 */
export function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = "/",
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Esperar a que termine de cargar
    if (isLoading) return;

    // Si no hay usuario, redirigir al login
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Si se especificaron roles, verificar que el usuario tenga al menos uno
    if (allowedRoles.length > 0) {
      const userRoles = Array.isArray(user.rol) ? user.rol : [user.rol];
      const hasPermission = userRoles.some((role) =>
        allowedRoles.includes(role)
      );

      if (!hasPermission) {
        // Usuario autenticado pero sin permisos - mostrar mensaje o redirigir
        router.push(redirectTo);
        return;
      }
    }
  }, [user, isLoading, allowedRoles, redirectTo, router]);

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario o no tiene permisos, no mostrar nada (está redirigiendo)
  if (!user) {
    return null;
  }

  // Verificar permisos de roles
  if (allowedRoles.length > 0) {
    const userRoles = Array.isArray(user.rol) ? user.rol : [user.rol];
    const hasPermission = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-black mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos para acceder a esta página.
            </p>
            <p className="text-sm text-gray-500">
              Roles requeridos: {allowedRoles.join(", ")}
            </p>
          </div>
        </div>
      );
    }
  }

  // Usuario autenticado y con permisos - mostrar contenido
  return <>{children}</>;
}
