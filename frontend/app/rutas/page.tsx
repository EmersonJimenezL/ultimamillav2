"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import {
  FiltroEstado,
  FiltroChofer,
  RutaCard,
  ModalDatosEntrega,
} from "@/components/rutas";
import { useRutas, useFiltrosRuta, useDatosEntrega } from "@/hooks";
import { exportRutasToExcel } from "@/utils";

export default function RutasPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [rutaExpandida, setRutaExpandida] = useState<string | null>(null);

  const {
    rutas,
    loading,
    error,
    cancelando,
    entregando,
    loadRutas,
    handleCancelar,
    handleMarcarEntregado,
  } = useRutas();

  const {
    filtroEstado,
    filtroChofer,
    rutasFiltradas,
    choferesUnicos,
    contadores,
    setFiltroEstado,
    setFiltroChofer,
  } = useFiltrosRuta(rutas);

  const {
    showModal,
    despachoSeleccionado,
    receptorRut,
    setReceptorRut,
    receptorNombre,
    setReceptorNombre,
    receptorApellido,
    setReceptorApellido,
    fotoPreview,
    actualizando,
    fileInputRef,
    openModal,
    closeModal,
    handleFotoChange,
    actualizarDatos,
  } = useDatosEntrega();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/");
      return;
    }
    const rolesPermitidos = ["admin", "adminBodega", "subBodega"];
    const tienePermiso = user.rol.some((r) => rolesPermitidos.includes(r));
    if (!tienePermiso) {
      router.push("/dashboard");
      return;
    }
    loadRutas();
  }, [user, router, authLoading]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleExportarExcel = () => {
    const rutasParaExportar =
      filtroEstado === "todas" && filtroChofer === "todos"
        ? rutas
        : rutasFiltradas;
    exportRutasToExcel(rutasParaExportar);
  };

  const handleToggleExpand = (rutaId: string) => {
    setRutaExpandida(rutaExpandida === rutaId ? null : rutaId);
  };

  const handleActualizarDatos = async () => {
    try {
      await actualizarDatos();
      alert("Datos actualizados exitosamente");
      closeModal();
      await loadRutas();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleFotoChangeWrapper = (file: File | null) => {
    try {
      handleFotoChange(file);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando rutas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">
                Gestión de Rutas
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Administra y monitorea las rutas de reparto
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 transition-all hover:shadow-md">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm animate-pulse">
                  {user?.pnombre?.[0]}
                  {user?.papellido?.[0]}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">
                    {user?.pnombre} {user?.papellido}
                  </p>
                  <p className="text-xs text-gray-600">
                    {user?.rol.join(", ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/despachos")}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 hover:from-orange-600 hover:to-orange-700 active:scale-95"
              >
                📦 Despachos
              </button>
              <button
                onClick={() => router.push("/empresas")}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 hover:from-green-600 hover:to-green-700 active:scale-95"
              >
                🏢 Empresas
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 hover:from-gray-600 hover:to-gray-700 active:scale-95"
              >
                ← Volver
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-200 hover:from-red-600 hover:to-red-700 active:scale-95"
              >
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="font-medium text-sm">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={handleExportarExcel}
            variant="primary"
            size="sm"
            disabled={rutasFiltradas.length === 0}
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">📊 Exportar a Excel</span>
            <span className="sm:hidden">📊 Excel</span>
          </Button>
        </div>

        <FiltroEstado
          estadoActual={filtroEstado}
          contadores={contadores}
          onEstadoChange={setFiltroEstado}
        />

        {choferesUnicos.length > 0 && (
          <div className="mb-6">
            <FiltroChofer
              choferActual={filtroChofer}
              choferes={choferesUnicos}
              onChoferChange={setFiltroChofer}
            />
          </div>
        )}

        {rutasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">
              No hay rutas{" "}
              {filtroEstado !== "todas" && `en estado "${filtroEstado}"`}
              {filtroChofer !== "todos" && ` para el chofer seleccionado`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rutasFiltradas.map((ruta) => (
              <RutaCard
                key={ruta._id}
                ruta={ruta}
                isExpanded={rutaExpandida === ruta._id}
                onToggleExpand={() => handleToggleExpand(ruta._id)}
                onCancelar={handleCancelar}
                onMarcarEntregado={handleMarcarEntregado}
                onAgregarDatos={openModal}
                cancelando={cancelando === ruta._id}
                entregando={entregando}
              />
            ))}
          </div>
        )}
      </main>

      <ModalDatosEntrega
        isOpen={showModal}
        despacho={despachoSeleccionado}
        receptorRut={receptorRut}
        receptorNombre={receptorNombre}
        receptorApellido={receptorApellido}
        fotoPreview={fotoPreview}
        actualizando={actualizando}
        fileInputRef={fileInputRef}
        onClose={closeModal}
        onRutChange={setReceptorRut}
        onNombreChange={setReceptorNombre}
        onApellidoChange={setReceptorApellido}
        onFotoChange={handleFotoChangeWrapper}
        onSubmit={handleActualizarDatos}
      />
    </div>
  );
}
