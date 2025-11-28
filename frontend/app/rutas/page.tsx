"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { rutaService, type Ruta } from "@/services/rutaService";
import { despachoService } from "@/services/despachoService";
import { Button, PageNavigation, Modal } from "@/components/ui";
import { useRouter } from "next/navigation";
import { MetricasTiempo } from "@/components/rutas/MetricasTiempo";
import { FiltroEstado, FiltroChofer } from "@/components/rutas/filtros";
import { useRutas, useFiltrosRuta } from "@/hooks";
import { exportRutasToExcel, getEstadoBadgeColor, formatRut } from "@/utils";

export default function RutasPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [rutaExpandida, setRutaExpandida] = useState<string | null>(null);
  const [entregando, setEntregando] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [filtroChofer, setFiltroChofer] = useState<string>("todos");

  // Estados para modal de datos de entrega
  const [showDatosModal, setShowDatosModal] = useState(false);
  const [despachoSeleccionado, setDespachoSeleccionado] = useState<any>(null);
  const [receptorRut, setReceptorRut] = useState("");
  const [receptorNombre, setReceptorNombre] = useState("");
  const [receptorApellido, setReceptorApellido] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Esperar a que termine de cargar el auth
    if (authLoading) return;

    if (!user) {
      router.push("/");
      return;
    }

    // Verificar rol
    const rolesPermitidos = ["admin", "adminBodega", "subBodega"];
    const tienePermiso = user.rol.some((r) => rolesPermitidos.includes(r));
    if (!tienePermiso) {
      router.push("/dashboard");
      return;
    }

    loadRutas();
  }, [user, router, authLoading]);

  const loadRutas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rutaService.getAll();
      setRutas(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar rutas");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCancelar = async (rutaId: string, numeroRuta?: string) => {
    if (
      !confirm(
        `¿Estás seguro de cancelar la ruta ${
          numeroRuta || rutaId
        }?\n\nLos despachos no entregados volverán a estar disponibles.`
      )
    ) {
      return;
    }

    try {
      setCancelando(rutaId);
      setError(null);
      const result = await rutaService.cancelar(rutaId);
      alert(
        `Ruta cancelada exitosamente.\n${result.data.despachosLiberados} despachos liberados.`
      );
      await loadRutas();
    } catch (err: any) {
      setError(err.message || "Error al cancelar ruta");
      alert(`Error: ${err.message}`);
    } finally {
      setCancelando(null);
    }
  };

  const handleMarcarEntregado = async (
    despachoId: string,
    folioNum: number
  ) => {
    if (!confirm(`¿Marcar despacho ${folioNum} como entregado?`)) {
      return;
    }

    try {
      setEntregando(despachoId);
      setError(null);
      await despachoService.marcarComoEntregado(despachoId);
      alert(`Despacho ${folioNum} marcado como entregado exitosamente`);
      await loadRutas();
    } catch (err: any) {
      setError(err.message || "Error al marcar despacho como entregado");
      alert(`Error: ${err.message}`);
    } finally {
      setEntregando(null);
    }
  };

  const handleOpenDatosModal = (despacho: any) => {
    setDespachoSeleccionado(despacho);
    // Pre-cargar datos si ya existen
    setReceptorRut(despacho.entrega?.receptorRut || "");
    setReceptorNombre(despacho.entrega?.receptorNombre || "");
    setReceptorApellido(despacho.entrega?.receptorApellido || "");
    setFotoPreview(despacho.entrega?.fotoEntrega || null);
    setShowDatosModal(true);
  };

  const handleCloseDatosModal = () => {
    setShowDatosModal(false);
    setDespachoSeleccionado(null);
    setReceptorRut("");
    setReceptorNombre("");
    setReceptorApellido("");
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const formatRut = (value: string) => {
    const cleaned = value.replace(/[.-]/g, "");
    const numbers = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    let formatted = "";
    for (let i = numbers.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) formatted = "." + formatted;
      formatted = numbers[i] + formatted;
    }
    return formatted + (dv ? `-${dv}` : "");
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9kK]/g, "");
    if (value.length <= 9) setReceptorRut(value);
  };

  const handleActualizarDatos = async () => {
    if (!despachoSeleccionado) return;

    // Al menos un campo debe estar presente
    if (!receptorRut && !receptorNombre && !receptorApellido && !fotoPreview) {
      setError("Debes ingresar al menos un dato");
      return;
    }

    try {
      setActualizando(true);
      setError(null);

      await despachoService.actualizarDatosEntrega(
        despachoSeleccionado._id,
        receptorRut || undefined,
        receptorNombre || undefined,
        receptorApellido || undefined,
        fotoPreview || undefined
      );

      alert(
        `Datos de entrega actualizados para despacho ${despachoSeleccionado.FolioNum}`
      );
      handleCloseDatosModal();
      await loadRutas();
    } catch (err: any) {
      setError(err.message || "Error al actualizar datos");
      alert(`Error: ${err.message}`);
    } finally {
      setActualizando(false);
    }
  };

  const toggleRutaExpandida = (rutaId: string) => {
    setRutaExpandida(rutaExpandida === rutaId ? null : rutaId);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando rutas...</p>
        </div>
      </div>
    );
  }

  // Obtener choferes únicos
  const choferesUnicos = Array.from(
    new Set(rutas.map((r) => r.conductor))
  ).sort();

  // Filtrar rutas según el estado y chofer seleccionados
  const rutasFiltradas = rutas.filter((ruta) => {
    const matchEstado =
      filtroEstado === "todas" || ruta.estado === filtroEstado;
    const matchChofer =
      filtroChofer === "todos" || ruta.conductor === filtroChofer;
    return matchEstado && matchChofer;
  });

  const contadores = {
    todas: rutas.length,
    pendiente: rutas.filter((r) => r.estado === "pendiente").length,
    iniciada: rutas.filter((r) => r.estado === "iniciada").length,
    finalizada: rutas.filter((r) => r.estado === "finalizada").length,
    cancelada: rutas.filter((r) => r.estado === "cancelada").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto overflow-hidden">
        <PageNavigation
          title="Gestión de Rutas"
          description={`${rutas.length} ruta${
            rutas.length !== 1 ? "s" : ""
          } en total`}
          currentPage="rutas"
          userInfo={
            user
              ? {
                  nombre: `${user.pnombre} ${user.papellido}`,
                  rol: user.rol.join(", "),
                }
              : undefined
          }
          actions={
            <>
              <Button
                onClick={() => exportRutasToExcel(rutas as any)}
                variant="primary"
                size="sm"
                disabled={rutas.length === 0}
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">📊 Exportar a Excel</span>
                <span className="sm:hidden">📊 Excel</span>
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="secondary"
                size="sm"
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">← Volver</span>
                <span className="sm:hidden">←</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="danger"
                size="sm"
                className="text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </Button>
            </>
          }
        />

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filtro por chofer */}
        {choferesUnicos.length > 0 && (
          <div className="mb-4 bg-white rounded-lg shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Conductor
            </label>
            <select
              value={filtroChofer}
              onChange={(e) => setFiltroChofer(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black bg-white"
            >
              <option value="todos">
                Todos los conductores ({rutas.length})
              </option>
              {choferesUnicos.map((chofer) => {
                const cantidadRutas = rutas.filter(
                  (r) => r.conductor === chofer
                ).length;
                return (
                  <option key={chofer} value={chofer}>
                    {chofer} ({cantidadRutas} ruta
                    {cantidadRutas !== 1 ? "s" : ""})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Pestañas de filtro por estado */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2 flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroEstado("todas")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              filtroEstado === "todas"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Todas ({contadores.todas})
          </button>
          <button
            onClick={() => setFiltroEstado("pendiente")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              filtroEstado === "pendiente"
                ? "bg-yellow-500 text-white"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            }`}
          >
            ⏳ Pendientes ({contadores.pendiente})
          </button>
          <button
            onClick={() => setFiltroEstado("iniciada")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              filtroEstado === "iniciada"
                ? "bg-blue-500 text-white"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
          >
            🚚 En Curso ({contadores.iniciada})
          </button>
          <button
            onClick={() => setFiltroEstado("finalizada")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              filtroEstado === "finalizada"
                ? "bg-green-500 text-white"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
          >
            ✅ Finalizadas ({contadores.finalizada})
          </button>
          <button
            onClick={() => setFiltroEstado("cancelada")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              filtroEstado === "cancelada"
                ? "bg-red-500 text-white"
                : "bg-red-100 text-red-800 hover:bg-red-200"
            }`}
          >
            ❌ Canceladas ({contadores.cancelada})
          </button>
        </div>

        {/* Lista de rutas */}
        {rutasFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 md:p-12 text-center">
            <p className="text-gray-500 text-sm sm:text-base md:text-lg">
              {filtroEstado === "todas" && filtroChofer === "todos"
                ? "No hay rutas registradas"
                : filtroChofer !== "todos"
                ? `No hay rutas para el conductor "${filtroChofer}"${
                    filtroEstado !== "todas"
                      ? ` en estado "${filtroEstado}"`
                      : ""
                  }`
                : `No hay rutas en estado "${filtroEstado}"`}
            </p>
            {filtroEstado === "todas" &&
              filtroChofer === "todos" &&
              rutas.length === 0 && (
                <Button
                  onClick={() => router.push("/despachos")}
                  variant="primary"
                  size="md"
                  className="mt-4"
                >
                  Crear Primera Ruta
                </Button>
              )}
          </div>
        ) : (
          <div className="grid gap-4">
            {rutasFiltradas.map((ruta) => (
              <div
                key={ruta._id}
                className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                        {ruta.numeroRuta || `Ruta ${ruta._id.slice(-6)}`}
                      </h3>
                      <span
                        className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getEstadoBadgeColor(
                          ruta.estado
                        )}`}
                      >
                        {ruta.estado.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3 md:mt-4">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase">
                          Conductor
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {ruta.conductor}
                        </p>
                      </div>

                      {ruta.patente && (
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 uppercase">
                            Patente
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {ruta.patente}
                          </p>
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase">
                          Despachos
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          {Array.isArray(ruta.despachos)
                            ? ruta.despachos.length
                            : 0}{" "}
                          despachos
                        </p>
                      </div>

                      {/* Tiempo transcurrido (si está iniciada) */}
                      {ruta.estado === "iniciada" && (
                        <div className="min-w-0 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                          <p className="text-xs text-yellow-700 uppercase font-semibold flex items-center gap-1">
                            <span>🔄</span> Tiempo transcurrido
                          </p>
                          <p className="text-sm sm:text-base font-bold text-yellow-600">
                            {(() => {
                              const ahora = new Date();
                              const fechaRef =
                                ruta.fechaInicio || ruta.asignadoEl;
                              const tiempoTranscurrido = Math.floor(
                                (ahora.getTime() -
                                  new Date(fechaRef).getTime()) /
                                  (1000 * 60)
                              );
                              const horas = Math.floor(tiempoTranscurrido / 60);
                              const minutos = tiempoTranscurrido % 60;
                              return horas > 0
                                ? `${horas}h ${minutos}min`
                                : `${minutos} min`;
                            })()}
                          </p>
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase">
                          Asignado por
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {ruta.asignadoPor}
                        </p>
                      </div>

                      <div className="min-w-0 sm:col-span-2">
                        <p className="text-xs text-gray-500 uppercase">
                          Fecha de asignación
                        </p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          {new Date(ruta.asignadoEl).toLocaleDateString(
                            "es-CL",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>

                      {ruta.fechaFinalizacion && (
                        <div className="min-w-0 sm:col-span-2">
                          <p className="text-xs text-gray-500 uppercase">
                            Fecha de finalización
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {new Date(
                              ruta.fechaFinalizacion
                            ).toLocaleDateString("es-CL", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      )}

                      {ruta.tiempoTranscurrido && (
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 uppercase">
                            Tiempo transcurrido
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {Math.floor(ruta.tiempoTranscurrido / 60)}h{" "}
                            {ruta.tiempoTranscurrido % 60}m
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex md:flex-col gap-2 w-full md:w-auto">
                    <Button
                      onClick={() => toggleRutaExpandida(ruta._id)}
                      variant="secondary"
                      size="sm"
                      fullWidth
                      className="md:w-auto"
                    >
                      {rutaExpandida === ruta._id ? "Ocultar" : "Ver Despachos"}
                    </Button>
                    {ruta.estado !== "finalizada" &&
                      ruta.estado !== "cancelada" && (
                        <Button
                          onClick={() =>
                            handleCancelar(ruta._id, ruta.numeroRuta)
                          }
                          variant="danger"
                          size="sm"
                          fullWidth
                          className="md:w-auto"
                          disabled={cancelando === ruta._id}
                        >
                          {cancelando === ruta._id
                            ? "Cancelando..."
                            : "Cancelar"}
                        </Button>
                      )}
                  </div>
                </div>

                {/* Despachos de la ruta (expandible) */}
                {rutaExpandida === ruta._id &&
                  Array.isArray(ruta.despachos) &&
                  ruta.despachos.length > 0 && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      {/* Métricas de tiempo */}
                      <MetricasTiempo
                        asignadoEl={ruta.asignadoEl}
                        fechaInicio={ruta.fechaInicio}
                        fechaFinalizacion={ruta.fechaFinalizacion}
                        despachos={ruta.despachos as any[]}
                      />

                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 mt-4">
                        Despachos de esta ruta ({ruta.despachos.length})
                      </h4>
                      <div className="space-y-2">
                        {ruta.despachos.map((despacho: any) => {
                          const isDespachoObject =
                            typeof despacho === "object" && despacho !== null;
                          if (!isDespachoObject) return null;

                          return (
                            <div
                              key={despacho._id}
                              className="bg-gray-50 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                                    Folio: {despacho.FolioNum}
                                  </p>
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                                      despacho.estado === "entregado"
                                        ? "bg-green-100 text-green-800"
                                        : despacho.estado === "asignado"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {despacho.estado.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-700 truncate">
                                  <span className="font-medium">Cliente:</span>{" "}
                                  {despacho.CardName}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                  <span className="font-medium">
                                    Dirección:
                                  </span>{" "}
                                  {despacho.Address2}
                                </p>
                                {/* Mostrar datos de entrega si existen */}
                                {despacho.estado === "entregado" &&
                                  despacho.entrega && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <p className="text-xs text-gray-500">
                                        Datos de entrega:
                                      </p>
                                      {despacho.entrega.receptorNombre && (
                                        <p className="text-xs text-gray-700 truncate">
                                          Receptor:{" "}
                                          {despacho.entrega.receptorNombre}{" "}
                                          {despacho.entrega.receptorApellido}
                                        </p>
                                      )}
                                      {despacho.entrega.receptorRut && (
                                        <p className="text-xs text-gray-700">
                                          RUT:{" "}
                                          {formatRut(
                                            despacho.entrega.receptorRut
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  )}
                              </div>
                              <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                                {despacho.estado !== "entregado" && (
                                  <Button
                                    onClick={() =>
                                      handleMarcarEntregado(
                                        despacho._id,
                                        despacho.FolioNum
                                      )
                                    }
                                    variant="primary"
                                    size="sm"
                                    fullWidth
                                    className="sm:w-auto text-xs sm:text-sm"
                                    disabled={entregando === despacho._id}
                                  >
                                    {entregando === despacho._id
                                      ? "Marcando..."
                                      : "Marcar Entregado"}
                                  </Button>
                                )}
                                {despacho.estado === "entregado" && (
                                  <Button
                                    onClick={() =>
                                      handleOpenDatosModal(despacho)
                                    }
                                    variant="secondary"
                                    size="sm"
                                    fullWidth
                                    className="sm:w-auto text-xs sm:text-sm"
                                  >
                                    {despacho.entrega?.receptorNombre
                                      ? "Editar Datos"
                                      : "Agregar Datos"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {/* Modal para agregar/editar datos de entrega */}
        <Modal
          isOpen={showDatosModal}
          onClose={handleCloseDatosModal}
          title="Datos de Entrega"
          size="md"
        >
          <div className="space-y-4">
            {despachoSeleccionado && (
              <>
                {/* Info del despacho */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Folio: {despachoSeleccionado.FolioNum}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {despachoSeleccionado.CardName}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Estos datos se registran cuando la empresa externa envía la
                    información de entrega
                  </p>
                </div>

                {/* RUT del receptor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUT del receptor
                  </label>
                  <input
                    type="text"
                    value={formatRut(receptorRut)}
                    onChange={handleRutChange}
                    placeholder="12.345.678-9"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
                    maxLength={12}
                  />
                </div>

                {/* Nombre del receptor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del receptor
                  </label>
                  <input
                    type="text"
                    value={receptorNombre}
                    onChange={(e) => setReceptorNombre(e.target.value)}
                    placeholder="Ej: Juan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
                  />
                </div>

                {/* Apellido del receptor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido del receptor
                  </label>
                  <input
                    type="text"
                    value={receptorApellido}
                    onChange={(e) => setReceptorApellido(e.target.value)}
                    placeholder="Ej: Pérez"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
                  />
                </div>

                {/* Foto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto de la entrega
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                  {!fotoPreview ? (
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="secondary"
                      size="md"
                      fullWidth
                    >
                      📷 Seleccionar Foto
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <img
                        src={fotoPreview}
                        alt="Vista previa"
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                        size="sm"
                        fullWidth
                      >
                        Cambiar Foto
                      </Button>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleCloseDatosModal}
                    variant="secondary"
                    size="md"
                    fullWidth
                    disabled={actualizando}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleActualizarDatos}
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={actualizando}
                    isLoading={actualizando}
                  >
                    {actualizando ? "Guardando..." : "Guardar Datos"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
