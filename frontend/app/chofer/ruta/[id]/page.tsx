"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Button, Card, Modal } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { rutaService, type Ruta } from "@/services/rutaService";
import { despachoService } from "@/services/despachoService";
import { MetricasTiempo } from "@/components/rutas/MetricasTiempo";

export default function RutaDetallePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const rutaId = params?.id as string;

  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para modal de entrega
  const [showEntregarModal, setShowEntregarModal] = useState(false);
  const [despachoSeleccionado, setDespachoSeleccionado] = useState<any>(null);
  const [receptorRut, setReceptorRut] = useState("");
  const [receptorNombre, setReceptorNombre] = useState("");
  const [receptorApellido, setReceptorApellido] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [entregando, setEntregando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para validaciones
  const [rutError, setRutError] = useState("");
  const [nombreError, setNombreError] = useState("");
  const [apellidoError, setApellidoError] = useState("");
  const [fotoError, setFotoError] = useState("");

  // Estado para modal de finalizar ruta
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    // Esperar a que termine de cargar el auth
    if (authLoading) return;

    if (!user || !rutaId) {
      router.push("/chofer");
      return;
    }

    loadRuta();
  }, [user, rutaId, router, authLoading]);

  const loadRuta = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rutaService.getById(rutaId);
      setRuta(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar ruta");
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir una dirección individual en Google Maps
  const abrirEnMapa = (direccion: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      direccion
    )}`;
    window.open(url, "_blank");
  };

  // Función para abrir toda la ruta en Google Maps con todos los puntos
  const abrirRutaCompleta = () => {
    if (!ruta || !Array.isArray(ruta.despachos)) return;

    const despachos = ruta.despachos;
    if (despachos.length === 0) return;

    // Filtrar solo los despachos que son objetos válidos y tienen dirección
    const direccionesValidas = despachos
      .filter((d: any) => typeof d === "object" && d !== null && d.Address2)
      .map((d: any) => d.Address2);

    if (direccionesValidas.length === 0) {
      alert("No hay direcciones válidas para mostrar en el mapa");
      return;
    }

    // Si solo hay un despacho, abrir directamente
    if (direccionesValidas.length === 1) {
      abrirEnMapa(direccionesValidas[0]);
      return;
    }

    // Para múltiples despachos, crear URL con waypoints
    const origen = encodeURIComponent(direccionesValidas[0]);
    const destino = encodeURIComponent(
      direccionesValidas[direccionesValidas.length - 1]
    );

    // Los puntos intermedios (máximo 9 waypoints permitidos por Google Maps)
    const waypoints = direccionesValidas
      .slice(1, -1)
      .slice(0, 9) // Google Maps permite máximo 9 waypoints
      .map((dir) => encodeURIComponent(dir))
      .join("|");

    const url = waypoints
      ? `https://www.google.com/maps/dir/?api=1&origin=${origen}&destination=${destino}&waypoints=${waypoints}`
      : `https://www.google.com/maps/dir/?api=1&origin=${origen}&destination=${destino}`;

    window.open(url, "_blank");
  };

  const handleOpenEntregarModal = (despacho: any) => {
    setDespachoSeleccionado(despacho);
    setReceptorRut("");
    setReceptorNombre("");
    setReceptorApellido("");
    setFotoPreview(null);
    setError(null);
    setRutError("");
    setNombreError("");
    setApellidoError("");
    setFotoError("");
    setShowEntregarModal(true);
  };

  const handleCloseEntregarModal = () => {
    setShowEntregarModal(false);
    setDespachoSeleccionado(null);
    setReceptorRut("");
    setReceptorNombre("");
    setReceptorApellido("");
    setFotoPreview(null);
    setError(null);
    setRutError("");
    setNombreError("");
    setApellidoError("");
    setFotoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFotoError("La imagen no debe superar los 5MB");
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setFotoError("Solo se permiten archivos de imagen");
      return;
    }

    setFotoError("");

    // Leer archivo y convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFotoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCapturarFoto = () => {
    fileInputRef.current?.click();
  };

  const formatRut = (value: string) => {
    // Eliminar puntos y guiones
    const cleaned = value.replace(/[.-]/g, "");

    // Separar números y dígito verificador
    const numbers = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    // Formatear con puntos
    let formatted = "";
    for (let i = numbers.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        formatted = "." + formatted;
      }
      formatted = numbers[i] + formatted;
    }

    return formatted + (dv ? `-${dv}` : "");
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9kK]/g, "");
    if (value.length <= 9) {
      setReceptorRut(value);
      setRutError("");
    }
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceptorNombre(e.target.value);
    setNombreError("");
  };

  const handleApellidoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceptorApellido(e.target.value);
    setApellidoError("");
  };

  const validarFormulario = (): boolean => {
    let isValid = true;

    if (!receptorRut.trim()) {
      setRutError("El RUT del receptor es obligatorio");
      isValid = false;
    } else if (receptorRut.length < 8) {
      setRutError("Ingresa un RUT válido");
      isValid = false;
    }

    if (!receptorNombre.trim()) {
      setNombreError("El nombre del receptor es obligatorio");
      isValid = false;
    }

    if (!receptorApellido.trim()) {
      setApellidoError("El apellido del receptor es obligatorio");
      isValid = false;
    }

    if (!fotoPreview) {
      setFotoError("Debes tomar una foto de la entrega");
      isValid = false;
    }

    return isValid;
  };

  const handleEntregar = async () => {
    if (!despachoSeleccionado) return;

    // Validar formulario
    if (!validarFormulario()) {
      return;
    }

    try {
      setEntregando(true);
      setError(null);

      await despachoService.entregarConFoto(
        despachoSeleccionado._id,
        receptorRut,
        receptorNombre,
        receptorApellido,
        fotoPreview!
      );

      handleCloseEntregarModal();
      await loadRuta();

      // Mostrar notificación de éxito
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al entregar despacho");
    } finally {
      setEntregando(false);
    }
  };

  const handleFinalizarRuta = async () => {
    if (!rutaId) return;

    try {
      setFinalizando(true);
      setError(null);

      await rutaService.finalizar(rutaId);

      setShowFinalizarModal(false);
      router.push("/chofer");
    } catch (err: any) {
      setError(err.message || "Error al finalizar ruta");
      setShowFinalizarModal(false);
    } finally {
      setFinalizando(false);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "asignado":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "entregado":
        return "bg-green-100 text-green-800 border border-green-300";
      case "cancelado":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

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

  const despachos = Array.isArray(ruta.despachos) ? ruta.despachos : [];
  const despachosEntregados = despachos.filter(
    (d: any) => d.estado === "entregado"
  ).length;
  const totalDespachos = despachos.length;
  const todosDespachosEntregados =
    despachosEntregados === totalDespachos && totalDespachos > 0;

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
                  className="bg-linear-to-r from-orange-500 to-orange-600 h-2.5 md:h-3 rounded-full transition-all duration-500 shadow-sm"
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
                  onClick={abrirRutaCompleta}
                  variant="secondary"
                  size="sm"
                  fullWidth
                  className="text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-black! border-0"
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
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Info de la ruta */}
            <Card
              className="mb-4 md:mb-6 border-2 border-gray-200 bg-white"
              padding="md"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
                <div>
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Estado
                  </p>
                  <span
                    className={`inline-block px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-semibold rounded-full ${getEstadoBadgeColor(
                      ruta.estado
                    )}`}
                  >
                    {ruta.estado.toUpperCase()}
                  </span>
                </div>
                {ruta.patente && (
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">
                      Patente
                    </p>
                    <p className="font-bold text-sm md:text-base text-gray-900 uppercase">
                      {ruta.patente}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Total Despachos
                  </p>
                  <p className="font-bold text-sm md:text-base text-orange-600">
                    {totalDespachos}
                  </p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-500 mb-1">
                    Entregados
                  </p>
                  <p className="font-bold text-sm md:text-base text-green-600">
                    {despachosEntregados}
                  </p>
                </div>
              </div>
            </Card>

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

            {/* Lista de despachos responsive con grid en desktop */}
            {despachos.length === 0 ? (
              <Card className="text-center py-12 md:py-16 bg-white">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-sm md:text-base">
                  No hay despachos en esta ruta
                </p>
              </Card>
            ) : (
              <div className="space-y-3 md:space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 xl:gap-5 lg:space-y-0">
                {despachos.map((despacho: any, index: number) => {
                  const isDespachoObject =
                    typeof despacho === "object" && despacho !== null;
                  if (!isDespachoObject) return null;

                  return (
                    <Card
                      key={despacho._id}
                      className={`border-2 transition-all duration-300 bg-white ${
                        despacho.estado === "entregado"
                          ? "border-green-400 shadow-md"
                          : "border-gray-300 hover:border-orange-400 hover:shadow-lg"
                      }`}
                      padding="md"
                    >
                      {/* Header del despacho */}
                      <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-white text-xs md:text-sm font-bold shadow-sm ${
                                despacho.estado === "entregado"
                                  ? "bg-green-500"
                                  : "bg-orange-500"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                              📋 Folio: {despacho.FolioNum}
                            </h3>
                          </div>
                          <span
                            className={`inline-block px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-semibold rounded-full ${getEstadoBadgeColor(
                              despacho.estado
                            )}`}
                          >
                            {despacho.estado.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Información del despacho con iconos */}
                      <div className="space-y-3 mb-4">
                        <div className="p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">👤</span>
                            <p className="text-xs md:text-sm text-gray-600 font-medium">
                              Cliente
                            </p>
                          </div>
                          <p className="text-sm md:text-base font-semibold text-gray-900">
                            {despacho.CardName}
                          </p>
                        </div>
                        <div className="p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base">📍</span>
                              <p className="text-xs md:text-sm text-gray-600 font-medium">
                                Dirección
                              </p>
                            </div>
                            <button
                              onClick={() => abrirEnMapa(despacho.Address2)}
                              className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-semibold hover:underline flex items-center gap-1"
                              title="Abrir en Google Maps"
                            >
                              🗺️ Ver
                            </button>
                          </div>
                          <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                            {despacho.Address2}
                          </p>
                        </div>
                      </div>

                      {/* Botón de entregar con gradiente naranja */}
                      {despacho.estado !== "entregado" &&
                        ruta.estado === "iniciada" && (
                          <Button
                            onClick={() => handleOpenEntregarModal(despacho)}
                            variant="primary"
                            size="md"
                            fullWidth
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-sm md:text-base font-semibold py-2.5 md:py-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                          >
                            📦 Entregar Despacho
                          </Button>
                        )}

                      {/* Info de entrega si está entregado */}
                      {despacho.estado === "entregado" && despacho.entrega && (
                        <div className="pt-3 md:pt-4 border-t-2 border-green-200 mt-3 md:mt-4 bg-green-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
                          <p className="text-xs md:text-sm text-green-700 font-bold mb-2 flex items-center gap-1.5">
                            <span className="text-base md:text-lg">✓</span>{" "}
                            Entregado exitosamente
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs md:text-sm text-gray-700">
                              <span className="font-medium">Receptor:</span>{" "}
                              {despacho.entrega.receptorNombre}{" "}
                              {despacho.entrega.receptorApellido}
                            </p>
                            <p className="text-xs md:text-sm text-gray-700">
                              <span className="font-medium">RUT:</span>{" "}
                              {formatRut(despacho.entrega.receptorRut)}
                            </p>
                            {despacho.entrega.fechaEntrega && (
                              <p className="text-xs md:text-sm text-gray-700">
                                <span className="font-medium">
                                  🕐 Hora de entrega:
                                </span>{" "}
                                {new Date(
                                  despacho.entrega.fechaEntrega
                                ).toLocaleString("es-CL", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Modal para entregar despacho */}
        <Modal
          isOpen={showEntregarModal}
          onClose={handleCloseEntregarModal}
          title="Entregar Despacho"
          size="md"
        >
          <div className="space-y-4">
            {despachoSeleccionado && (
              <>
                {/* Info del despacho */}
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-orange-900">
                    Folio: {despachoSeleccionado.FolioNum}
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    {despachoSeleccionado.CardName}
                  </p>
                </div>

                {/* Datos del receptor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUT del receptor *
                  </label>
                  <input
                    type="text"
                    value={formatRut(receptorRut)}
                    onChange={handleRutChange}
                    placeholder="12.345.678-9"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black ${
                      rutError
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-gray-300 focus:ring-orange-500"
                    }`}
                    maxLength={12}
                  />
                  {rutError && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {rutError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del receptor *
                  </label>
                  <input
                    type="text"
                    value={receptorNombre}
                    onChange={handleNombreChange}
                    placeholder="Ej: Juan"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black ${
                      nombreError
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-gray-300 focus:ring-orange-500"
                    }`}
                  />
                  {nombreError && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {nombreError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido del receptor *
                  </label>
                  <input
                    type="text"
                    value={receptorApellido}
                    onChange={handleApellidoChange}
                    placeholder="Ej: Pérez"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-black ${
                      apellidoError
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-gray-300 focus:ring-orange-500"
                    }`}
                  />
                  {apellidoError && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <span>⚠️</span> {apellidoError}
                    </p>
                  )}
                </div>

                {/* Foto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto de la entrega *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                  {!fotoPreview ? (
                    <div>
                      <Button
                        onClick={handleCapturarFoto}
                        variant="secondary"
                        size="md"
                        fullWidth
                        className={
                          fotoError ? "!border-red-500 !bg-red-50" : ""
                        }
                      >
                        📷 Capturar Foto
                      </Button>
                      {fotoError && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <span>⚠️</span> {fotoError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <img
                        src={fotoPreview}
                        alt="Vista previa"
                        className="w-full h-48 object-cover rounded-lg border-2 border-green-300"
                      />
                      <Button
                        onClick={handleCapturarFoto}
                        variant="secondary"
                        size="sm"
                        fullWidth
                      >
                        Cambiar Foto
                      </Button>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                  <Button
                    onClick={handleCloseEntregarModal}
                    variant="secondary"
                    size="md"
                    fullWidth
                    disabled={entregando}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEntregar}
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={entregando}
                    isLoading={entregando}
                  >
                    {entregando ? "Entregando..." : "Confirmar Entrega"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>

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
