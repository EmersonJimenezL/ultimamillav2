"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button, Card, Modal } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RutaEntregasPreview } from "@/components/chofer";
import { rutaService, type Ruta } from "@/services/rutaService";
import { getNombreCompleto } from "@/services/userService";

export default function ChoferPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para modal de iniciar ruta
  const [showIniciarModal, setShowIniciarModal] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null);
  const [patente, setPatente] = useState("");
  const [nombreConductor, setNombreConductor] = useState("");
  const [iniciando, setIniciando] = useState(false);

  useEffect(() => {
    // Esperar a que termine de cargar el auth
    if (authLoading) return;

    // Si no hay usuario después de cargar, redirigir al login
    if (!user) {
      router.push("/");
      return;
    }

    loadRutas();
  }, [user, router, authLoading]);

  const loadRutas = async () => {
    try {
      setLoading(true);
      setError(null);
      const rutasDelChofer = await rutaService.getMine();

      // Ordenar: rutas iniciadas primero, luego pendientes, luego finalizadas/canceladas
      const rutasOrdenadas = rutasDelChofer.sort((a, b) => {
        const ordenEstado: Record<string, number> = {
          iniciada: 1,
          pendiente: 2,
          pausada: 3,
          finalizada: 4,
          cancelada: 5,
        };
        return (ordenEstado[a.estado] || 99) - (ordenEstado[b.estado] || 99);
      });

      setRutas(rutasOrdenadas);
    } catch (err: any) {
      setError(err.message || "Error al cargar rutas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenIniciarModal = (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setPatente("");
    setNombreConductor("");
    setShowIniciarModal(true);
  };

  const handleCloseIniciarModal = () => {
    setShowIniciarModal(false);
    setRutaSeleccionada(null);
    setPatente("");
    setNombreConductor("");
  };

  const handleIniciarRuta = async () => {
    if (!rutaSeleccionada) return;

    // Validar patente
    if (!patente.trim()) {
      setError("La patente es obligatoria");
      return;
    }

    // Si es chofer externo, validar nombre
    if (rutaSeleccionada.esChoferExterno && !nombreConductor.trim()) {
      setError("El nombre del conductor es obligatorio");
      return;
    }

    try {
      setIniciando(true);
      setError(null);

      await rutaService.iniciar(
        rutaSeleccionada._id,
        patente.toUpperCase(),
        rutaSeleccionada.esChoferExterno ? nombreConductor : undefined
      );

      alert("Ruta iniciada exitosamente");
      handleCloseIniciarModal();
      await loadRutas();
    } catch (err: any) {
      setError(err.message || "Error al iniciar ruta");
      alert(`Error: ${err.message}`);
    } finally {
      setIniciando(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "iniciada":
        return "bg-blue-100 text-blue-800";
      case "pausada":
        return "bg-orange-100 text-orange-800";
      case "finalizada":
        return "bg-green-100 text-green-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["chofer"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando rutas...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["chofer"]}>
      <div className="min-h-screen bg-white">
        {/* Header responsive limpio */}
        <header className="bg-white shadow-md border-b-2 border-orange-500 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  🚚 Mis Rutas
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 truncate mt-0.5">
                  {user?.pnombre} {user?.papellido}
                </p>
              </div>
              <Button
                onClick={handleLogout}
                variant="danger"
                size="sm"
                className="shrink-0"
              >
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Contenido responsive con fondo gris */}
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 pb-20">
            {/* Error */}
            {error && (
              <div className="mb-4 md:mb-6 bg-red-50 border border-red-200 text-red-800 px-3 py-2 md:px-4 md:py-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Lista de rutas */}
            {rutas.length === 0 ? (
              <Card className="text-center py-12 md:py-16 lg:py-20 bg-white border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-500 text-sm sm:text-base md:text-lg mb-2 font-semibold">
                  No tienes rutas asignadas
                </p>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">
                  Las rutas asignadas aparecerán aquí
                </p>
              </Card>
            ) : (
              <div className="space-y-3 md:space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 xl:gap-5 lg:space-y-0">
                {rutas.map((ruta) => {
                  const isRutaActiva = ruta.estado === "iniciada";
                  const isPendiente = ruta.estado === "pendiente";
                  const isFinalizada = ruta.estado === "finalizada";

                  return (
                    <Card
                      key={ruta._id}
                      className={`border-2 transition-all duration-300 bg-white ${
                        isRutaActiva
                          ? "border-orange-400 shadow-lg hover:shadow-2xl ring-2 ring-orange-200"
                          : isPendiente
                          ? "border-blue-300 shadow-md hover:shadow-lg hover:border-blue-400"
                          : isFinalizada
                          ? "border-green-300 shadow-md hover:shadow-lg hover:border-green-400"
                          : "border-gray-300 shadow-md hover:shadow-lg hover:border-gray-400"
                      }`}
                      padding="md"
                    >
                      {/* Badge "RUTA ACTIVA" con animación */}
                      {isRutaActiva && (
                        <div className="mb-3 md:mb-4 relative overflow-hidden rounded-lg">
                          <div className="bg-linear-to-r from-orange-500 to-orange-600 text-white px-3 md:px-4 py-2 md:py-2.5 font-bold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 shadow-md">
                            <span className="animate-pulse text-sm md:text-base">
                              🔥
                            </span>
                            RUTA ACTIVA
                            <span className="animate-pulse text-sm md:text-base">
                              🔥
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Header de la ruta con iconos */}
                      <div className="flex items-start justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xl md:text-2xl">
                              {isRutaActiva
                                ? "🚚"
                                : isPendiente
                                ? "⏳"
                                : isFinalizada
                                ? "✅"
                                : "📋"}
                            </span>
                            <h3
                              className={`text-base sm:text-lg md:text-xl font-bold truncate ${
                                isRutaActiva
                                  ? "text-orange-900"
                                  : isPendiente
                                  ? "text-blue-900"
                                  : isFinalizada
                                  ? "text-green-900"
                                  : "text-gray-900"
                              }`}
                            >
                              {ruta.numeroRuta || `Ruta ${ruta._id.slice(-6)}`}
                            </h3>
                          </div>
                          <span
                            className={`inline-block px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-semibold rounded-full mt-2 ${getEstadoBadgeColor(
                              ruta.estado
                            )}`}
                          >
                            {ruta.estado.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Información de la ruta - Grid con fondo sutil */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">📦</span>
                            <p className="text-xs md:text-sm text-gray-600 font-medium">
                              Despachos
                            </p>
                          </div>
                          <p
                            className={`text-base md:text-lg lg:text-xl font-bold ${
                              isRutaActiva ? "text-orange-600" : "text-gray-900"
                            }`}
                          >
                            {Array.isArray(ruta.despachos)
                              ? ruta.despachos.length
                              : 0}
                          </p>
                        </div>

                        {ruta.patente && (
                          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">🚗</span>
                              <p className="text-xs md:text-sm text-gray-600 font-medium">
                                Patente
                              </p>
                            </div>
                            <p
                              className={`text-base md:text-lg font-bold uppercase ${
                                isRutaActiva
                                  ? "text-orange-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {ruta.patente}
                            </p>
                          </div>
                        )}

                        <div
                          className={`p-3 rounded-lg bg-gray-50 border border-gray-200 ${
                            !ruta.patente
                              ? "sm:col-span-2 lg:col-span-1 xl:col-span-2"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">📅</span>
                            <p className="text-xs md:text-sm text-gray-600 font-medium">
                              Asignada
                            </p>
                          </div>
                          <p className="text-xs md:text-sm font-semibold text-gray-900">
                            {new Date(ruta.asignadoEl).toLocaleDateString(
                              "es-CL",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <RutaEntregasPreview despachos={ruta.despachos} previewCount={3} />

                      {/* Acciones - Botones con naranja como color principal */}
                      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                        {ruta.estado === "pendiente" && (
                          <Button
                            onClick={() => handleOpenIniciarModal(ruta)}
                            variant="primary"
                            size="md"
                            fullWidth
                            className="text-sm md:text-base font-semibold py-2.5 md:py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                          >
                            🚀 Iniciar Ruta
                          </Button>
                        )}
                        {ruta.estado === "iniciada" && (
                          <Button
                            onClick={() =>
                              router.push(`/chofer/ruta/${ruta._id}`)
                            }
                            variant="primary"
                            size="md"
                            fullWidth
                            className="text-sm md:text-base font-semibold py-2.5 md:py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                          >
                            📍 Ver Despachos
                          </Button>
                        )}
                        {(ruta.estado === "finalizada" ||
                          ruta.estado === "cancelada") && (
                          <Button
                            onClick={() =>
                              router.push(`/chofer/ruta/${ruta._id}`)
                            }
                            variant="secondary"
                            size="md"
                            fullWidth
                            className="text-sm md:text-base font-semibold py-2.5 md:py-3 bg-gray-600 hover:bg-gray-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                          >
                            📄 Ver Detalle
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Modal para iniciar ruta - Responsive */}
        <Modal
          isOpen={showIniciarModal}
          onClose={handleCloseIniciarModal}
          title="Iniciar Ruta"
          size="md"
        >
          <div className="space-y-4 md:space-y-5">
            {rutaSeleccionada && (
              <>
                {/* Información de la ruta */}
                <div className="p-3 md:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm md:text-base font-medium text-orange-900">
                    {rutaSeleccionada.numeroRuta ||
                      `Ruta ${rutaSeleccionada._id.slice(-6)}`}
                  </p>
                  <p className="text-xs md:text-sm text-orange-700 mt-1">
                    {Array.isArray(rutaSeleccionada.despachos)
                      ? rutaSeleccionada.despachos.length
                      : 0}{" "}
                    despachos asignados
                  </p>
                </div>

                {/* Input de patente */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Patente del vehículo *
                  </label>
                  <input
                    type="text"
                    value={patente}
                    onChange={(e) => setPatente(e.target.value.toUpperCase())}
                    placeholder="Ej: AB1234"
                    className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black text-sm md:text-base uppercase"
                    maxLength={6}
                  />
                  <p className="text-xs md:text-sm text-gray-500 mt-1.5">
                    Ingresa la patente sin espacios ni guiones
                  </p>
                </div>

                {/* Input de nombre (solo si es chofer externo) */}
                {rutaSeleccionada.esChoferExterno && (
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                      Tu nombre completo *
                    </label>
                    <input
                      type="text"
                      value={nombreConductor}
                      onChange={(e) => setNombreConductor(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black text-sm md:text-base"
                    />
                    <p className="text-xs md:text-sm text-gray-500 mt-1.5">
                      Como chofer externo, necesitamos registrar tu nombre
                    </p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-3 md:px-4 py-2 md:py-3 rounded-lg text-xs sm:text-sm">
                    {error}
                  </div>
                )}

                {/* Botones */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 md:gap-3 pt-2 md:pt-3">
                  <Button
                    onClick={handleCloseIniciarModal}
                    variant="secondary"
                    size="md"
                    fullWidth
                    disabled={iniciando}
                    className="text-sm md:text-base py-2 md:py-3"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleIniciarRuta}
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={iniciando}
                    isLoading={iniciando}
                    className="text-sm md:text-base py-2 md:py-3"
                  >
                    {iniciando ? "Iniciando..." : "Confirmar e Iniciar"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
