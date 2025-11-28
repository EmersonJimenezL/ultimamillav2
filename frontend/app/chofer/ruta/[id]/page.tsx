"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Button, Card, Modal } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MetricasTiempo } from "@/components/rutas/MetricasTiempo";
import {
  DespachosLista,
  ModalEntregarDespacho,
  RutaInfo,
} from "@/components/chofer";
import { useRutaChofer } from "@/hooks/useRutaChofer";
import {
  abrirRutaCompleta,
  extraerDireccionesValidas,
} from "@/utils/mapsUtils";

export default function RutaDetallePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const rutaId = params?.id as string;

  const { ruta, loading, error, finalizando, loadRuta, finalizarRuta } =
    useRutaChofer(rutaId);

  const [showEntregarModal, setShowEntregarModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [despachoSeleccionado, setDespachoSeleccionado] = useState<any>(null);

  // Redirigir si no hay autenticación
  useEffect(() => {
    if (authLoading) return;
    if (!user || !rutaId) {
      router.push("/chofer");
    }
  }, [user, rutaId, router, authLoading]);

  // Calcular estadísticas de despachos
  const {
    despachos,
    despachosEntregados,
    totalDespachos,
    todosDespachosEntregados,
  } = useMemo(() => {
    const despachos = Array.isArray(ruta?.despachos) ? ruta.despachos : [];
    const despachosEntregados = despachos.filter(
      (d: any) => d.estado === "entregado"
    ).length;
    const totalDespachos = despachos.length;
    const todosDespachosEntregados =
      despachosEntregados === totalDespachos && totalDespachos > 0;

    return {
      despachos,
      despachosEntregados,
      totalDespachos,
      todosDespachosEntregados,
    };
  }, [ruta]);

  const handleOpenEntregarModal = (despacho: any) => {
    setDespachoSeleccionado(despacho);
    setShowEntregarModal(true);
  };

  const handleCloseEntregarModal = () => {
    setShowEntregarModal(false);
    setDespachoSeleccionado(null);
  };

  const handleEntregaSuccess = async () => {
    await loadRuta();
  };

  const handleAbrirRutaCompleta = () => {
    if (!ruta) return;
    const direcciones = extraerDireccionesValidas(despachos);
    abrirRutaCompleta(direcciones);
  };

  const handleFinalizarRuta = async () => {
    try {
      await finalizarRuta();
      setShowFinalizarModal(false);
      router.push("/chofer");
    } catch (err) {
      setShowFinalizarModal(false);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["chofer"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando ruta...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Ruta no encontrada
  if (!ruta) {
    return (
      <ProtectedRoute allowedRoles={["chofer"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="text-center max-w-md">
            <p className="text-gray-500 mb-4">Ruta no encontrada</p>
            <Button
              onClick={() => router.push("/chofer")}
              variant="primary"
              size="md"
            >
              Volver a Mis Rutas
            </Button>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["chofer"]}>
      <div className="min-h-screen bg-white">
        {/* Header responsive */}
        <header className="bg-white shadow-md border-b-2 border-orange-500 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
            <div className="flex items-center gap-2 sm:gap-4 mb-3">
              <Button
                onClick={() => router.push("/chofer")}
                variant="ghost"
                size="sm"
                className="!px-2 shrink-0"
              >
                ← Volver
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  🚚 {ruta.numeroRuta || `Ruta ${ruta._id.slice(-6)}`}
                </h1>
              </div>
            </div>

            {/* Barra de progreso responsive */}
            <div className="mt-2">
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1.5">
                <span className="font-medium">
                  {despachosEntregados} de {totalDespachos} entregados
                </span>
                <span className="font-bold text-orange-600">
                  {totalDespachos > 0
                    ? Math.round((despachosEntregados / totalDespachos) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 md:h-3 mb-3">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 md:h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${
                      totalDespachos > 0
                        ? (despachosEntregados / totalDespachos) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>

              {/* Botón para abrir ruta completa en Google Maps */}
              {totalDespachos > 0 && (
                <Button
                  onClick={handleAbrirRutaCompleta}
                  variant="secondary"
                  size="sm"
                  fullWidth
                  className="text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  🗺️ Abrir Ruta en Google Maps
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Contenido con fondo gris */}
        <main className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 pb-20">
            {/* Error global */}
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded shadow-sm animate-fade-in">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info de la ruta */}
            <RutaInfo
              ruta={ruta}
              totalDespachos={totalDespachos}
              despachosEntregados={despachosEntregados}
            />

            {/* Métricas de tiempo */}
            <MetricasTiempo
              asignadoEl={ruta.asignadoEl}
              fechaInicio={ruta.fechaInicio}
              fechaFinalizacion={ruta.fechaFinalizacion}
              despachos={despachos as any[]}
            />

            {/* Botón de finalizar ruta */}
            {ruta.estado === "iniciada" && todosDespachosEntregados && (
              <div className="mb-4 md:mb-6">
                <Button
                  onClick={() => setShowFinalizarModal(true)}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="!bg-gradient-to-r !from-green-500 !to-green-600 hover:!from-green-600 hover:!to-green-700 text-sm md:text-base font-semibold py-3 md:py-4 shadow-lg"
                >
                  ✓ Finalizar Ruta
                </Button>
              </div>
            )}

            {/* Lista de despachos */}
            <DespachosLista
              despachos={despachos}
              rutaEstado={ruta.estado}
              onEntregarDespacho={handleOpenEntregarModal}
            />
          </div>
        </main>

        {/* Modal para entregar despacho */}
        <ModalEntregarDespacho
          isOpen={showEntregarModal}
          despacho={despachoSeleccionado}
          onClose={handleCloseEntregarModal}
          onSuccess={handleEntregaSuccess}
        />

        {/* Modal para confirmar finalización de ruta */}
        <Modal
          isOpen={showFinalizarModal}
          onClose={() => setShowFinalizarModal(false)}
          title="Finalizar Ruta"
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl mb-3">✓</div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                ¿Finalizar ruta?
              </p>
              <p className="text-sm text-gray-600">
                Has entregado todos los despachos de esta ruta. ¿Deseas marcarla
                como finalizada?
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                onClick={() => setShowFinalizarModal(false)}
                variant="secondary"
                size="md"
                fullWidth
                disabled={finalizando}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleFinalizarRuta}
                variant="primary"
                size="md"
                fullWidth
                disabled={finalizando}
                isLoading={finalizando}
                className="!bg-green-600 hover:!bg-green-700"
              >
                {finalizando ? "Finalizando..." : "Sí, Finalizar"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
