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
import { NavBar } from "@/components/layout";

export default function RutasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [rutaExpandida, setRutaExpandida] = useState<string | null>(null);

  const {
    rutas,
    loading,
    error,
    cancelando,
    loadRutas,
    handleCancelar,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleFotoChangeWrapper = (file: File | null) => {
    try {
      handleFotoChange(file);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <NavBar
        title="Gestión de Rutas"
        description="Administra y monitorea las rutas de reparto"
        currentPage="rutas"
      />

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
                onAgregarDatos={openModal}
                cancelando={cancelando === ruta._id}
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
