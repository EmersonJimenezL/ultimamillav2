"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button, Card, Modal, PageNavigation } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { despachoService, Despacho } from "@/services/despachoService";
import { empresaService, EmpresaReparto } from "@/services/empresaService";
import { userService, User, getNombreCompleto } from "@/services/userService";
import { rutaService } from "@/services/rutaService";

export default function DespachosPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedDespachos, setSelectedDespachos] = useState<string[]>([]);

  // Estados para el modal de crear ruta
  const [showModal, setShowModal] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaReparto[]>([]);
  const [choferes, setChoferes] = useState<User[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [selectedChofer, setSelectedChofer] = useState("");
  const [esChoferExterno, setEsChoferExterno] = useState(false);
  const [creatingRuta, setCreatingRuta] = useState(false);

  useEffect(() => {
    loadDespachos();
  }, []);

  const loadDespachos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await despachoService.getAll();
      setDespachos(data);
    } catch (error) {
      console.error("Error al cargar despachos:", error);
      setError("Error al cargar despachos");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      await despachoService.sincronizar();
      await loadDespachos();
    } catch (error) {
      console.error("Error al sincronizar:", error);
      setError("Error al sincronizar despachos");
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Filtrar despachos (excluir asignados ya que están en rutas)
  const despachosFiltrados = despachos.filter((despacho) => {
    // Excluir despachos asignados de la vista de despachos disponibles
    if (despacho.estado === "asignado") {
      return false;
    }

    const matchSearch =
      despacho.FolioNum.toString().includes(searchTerm) ||
      despacho.CardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despacho.CardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despacho.Address2.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado =
      filterEstado === "todos" || despacho.estado === filterEstado;

    return matchSearch && matchEstado;
  });

  // Contar por estado
  const estadoCounts = {
    pendiente: despachos.filter((d) => d.estado === "pendiente").length,
    entregado: despachos.filter((d) => d.estado === "entregado").length,
    cancelado: despachos.filter((d) => d.estado === "cancelado").length,
  };

  // Calcular paginación
  const totalPages = Math.ceil(despachosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const despachosPaginados = despachosFiltrados.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectDespacho = (despachoId: string) => {
    setSelectedDespachos((prev) =>
      prev.includes(despachoId)
        ? prev.filter((id) => id !== despachoId)
        : [...prev, despachoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDespachos.length === despachosPaginados.length) {
      setSelectedDespachos([]);
    } else {
      setSelectedDespachos(despachosPaginados.map((d) => d._id));
    }
  };

  const isAllSelected =
    despachosPaginados.length > 0 &&
    selectedDespachos.length === despachosPaginados.length;

  const handleOpenModal = async () => {
    setShowModal(true);
    setLoadingModal(true);
    try {
      const [empresasData, choferesData] = await Promise.all([
        empresaService.getAll(),
        userService.getChoferes(),
      ]);
      setEmpresas(empresasData);
      setChoferes(choferesData);
    } catch (error) {
      console.error("Error al cargar datos del modal:", error);
      setError("Error al cargar empresas y choferes");
    } finally {
      setLoadingModal(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmpresa("");
    setSelectedChofer("");
    setEsChoferExterno(false);
  };

  const handleCrearRuta = async () => {
    // Validar empresa
    if (!selectedEmpresa) {
      setError("Debes seleccionar una empresa");
      return;
    }

    // Si no es chofer externo, validar que se haya seleccionado un chofer
    if (!esChoferExterno && !selectedChofer) {
      setError("Debes seleccionar un chofer o marcar como chofer externo");
      return;
    }

    try {
      setCreatingRuta(true);
      setError(null);

      let nombreConductor = "Pendiente";

      // Si no es chofer externo, obtener el nombre del chofer seleccionado
      if (!esChoferExterno) {
        const choferSeleccionado = choferes.find((c) => c._id === selectedChofer);
        if (!choferSeleccionado) {
          throw new Error("Chofer no encontrado");
        }
        nombreConductor = getNombreCompleto(choferSeleccionado);
      }

      await rutaService.create({
        empresaReparto: selectedEmpresa,
        conductor: nombreConductor,
        esChoferExterno: esChoferExterno,
        // La patente se registrará cuando el chofer inicie la ruta
        despachos: selectedDespachos,
        asignadoPor: user?.usuario || "sistema",
        estado: "pendiente",
        asignadoEl: new Date(),
      });

      // Limpiar selección y cerrar modal
      setSelectedDespachos([]);
      handleCloseModal();
      await loadDespachos();

      // Mensaje de éxito
      alert("Ruta creada exitosamente");
    } catch (error) {
      console.error("Error al crear ruta:", error);
      setError("Error al crear la ruta");
    } finally {
      setCreatingRuta(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "adminBodega", "subBodega"]}>
      <div className="min-h-screen bg-gray-50">
        {/* Contenido */}
        <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <PageNavigation
            title="Despachos Disponibles"
            description={`${despachosFiltrados.length} despacho${
              despachosFiltrados.length !== 1 ? "s" : ""
            } disponible${despachosFiltrados.length !== 1 ? "s" : ""}`}
            currentPage="despachos"
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
                  onClick={() => router.push("/dashboard")}
                  variant="secondary"
                  size="sm"
                >
                  ← Volver
                </Button>
                <Button
                  onClick={handleSync}
                  disabled={syncing}
                  variant="primary"
                  size="sm"
                >
                  {syncing ? "Sincronizando..." : "Sincronizar"}
                </Button>
                <Button onClick={handleLogout} variant="danger" size="sm">
                  Cerrar Sesión
                </Button>
              </>
            }
          />
          {/* Estadísticas compactas */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
            <Card className="border border-gray-200" padding="sm">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-0.5">Pendientes</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-500">
                  {estadoCounts.pendiente}
                </p>
              </div>
            </Card>
            <Card className="border border-gray-200" padding="sm">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-0.5">Entregados</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {estadoCounts.entregado}
                </p>
              </div>
            </Card>
            <Card className="border border-gray-200" padding="sm">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-0.5">Cancelados</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600">
                  {estadoCounts.cancelado}
                </p>
              </div>
            </Card>
          </div>

          {/* Controles compactos */}
          <Card className="mb-4 border border-gray-200" padding="sm">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por folio, cliente, código o dirección..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black placeholder:text-gray-400 text-sm"
                  />
                </div>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="entregado">Entregados</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>

              {/* Botón Crear Ruta */}
              {selectedDespachos.length > 0 && (
                <div className="flex items-center gap-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <span className="text-sm text-orange-800 font-medium">
                    {selectedDespachos.length} despacho
                    {selectedDespachos.length !== 1 ? "s" : ""} seleccionado
                    {selectedDespachos.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex-1"></div>
                  <Button onClick={handleOpenModal} variant="primary" size="sm">
                    Crear Ruta
                  </Button>
                  <Button
                    onClick={() => setSelectedDespachos([])}
                    variant="ghost"
                    size="sm"
                  >
                    Limpiar
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Mensajes de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Lista de despachos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-gray-600">Cargando despachos...</p>
            </div>
          ) : despachosFiltrados.length === 0 ? (
            <Card className="text-center py-12 border border-gray-200">
              <p className="text-gray-600">No se encontraron despachos</p>
            </Card>
          ) : (
            <>
              {/* Vista móvil - Cards */}
              <div className="block lg:hidden space-y-4">
                {despachosPaginados.map((despacho) => (
                  <Card
                    key={despacho._id}
                    className={`border-2 transition-colors ${
                      selectedDespachos.includes(despacho._id)
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                    padding="md"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDespachos.includes(despacho._id)}
                          onChange={() => handleSelectDespacho(despacho._id)}
                          className="mt-1 h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase">
                            Folio
                          </p>
                          <p className="text-lg font-bold text-black">
                            {despacho.FolioNum}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            despacho.estado === "pendiente"
                              ? "bg-orange-100 text-orange-800"
                              : despacho.estado === "entregado"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {despacho.estado.charAt(0).toUpperCase() +
                            despacho.estado.slice(1)}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Cliente</p>
                        <p className="text-sm font-medium text-black">
                          {despacho.CardName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Código: {despacho.CardCode}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Dirección</p>
                        <p className="text-sm text-gray-700">
                          {despacho.Address2}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {new Date(despacho.DocDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Vista desktop - Tabla */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Folio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Dirección
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {despachosPaginados.map((despacho) => (
                      <tr
                        key={despacho._id}
                        className={`transition-colors ${
                          selectedDespachos.includes(despacho._id)
                            ? "bg-orange-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedDespachos.includes(despacho._id)}
                            onChange={() => handleSelectDespacho(despacho._id)}
                            className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-black">
                          {despacho.FolioNum}
                        </td>
                        <td className="px-4 py-4 text-sm text-black">
                          {despacho.CardName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {despacho.CardCode}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {despacho.Address2}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(despacho.DocDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              despacho.estado === "pendiente"
                                ? "bg-orange-100 text-orange-800"
                                : despacho.estado === "entregado"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {despacho.estado.charAt(0).toUpperCase() +
                              despacho.estado.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Controles de paginación */}
          {!loading && despachosFiltrados.length > 0 && (
            <Card className="mt-4 border border-gray-200" padding="sm">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-600 order-2 lg:order-1">
                  Mostrando {startIndex + 1}-
                  {Math.min(endIndex, despachosFiltrados.length)} de{" "}
                  {despachosFiltrados.length}
                </div>

                <div className="flex items-center gap-2 order-1 lg:order-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="secondary"
                    size="sm"
                  >
                    ←
                  </Button>

                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2.5 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <div className="sm:hidden text-xs text-gray-600 px-2">
                    Página {currentPage} / {totalPages}
                  </div>

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    size="sm"
                  >
                    →
                  </Button>
                </div>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-black text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 order-3"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </Card>
          )}

          {/* Footer con información */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>
              {despachos.length} despachos • Sincronización automática cada 5
              min
            </p>
          </div>
        </main>

        {/* Modal para crear ruta */}
        <Modal
          isOpen={showModal}
          onClose={handleCloseModal}
          title="Crear Nueva Ruta"
          size="lg"
          footer={
            <>
              <Button onClick={handleCloseModal} variant="outline" size="sm">
                Cancelar
              </Button>
              <Button
                onClick={handleCrearRuta}
                variant="primary"
                size="sm"
                disabled={!selectedEmpresa || (!esChoferExterno && !selectedChofer) || creatingRuta}
                isLoading={creatingRuta}
              >
                {creatingRuta ? "Creando..." : "Crear Ruta"}
              </Button>
            </>
          }
        >
          {loadingModal ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-gray-600">Cargando datos...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumen de despachos seleccionados */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-900">
                  Despachos seleccionados: {selectedDespachos.length}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Estos despachos serán asignados a la ruta
                </p>
              </div>

              {/* Selección de empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa de Reparto *
                </label>
                <select
                  value={selectedEmpresa}
                  onChange={(e) => setSelectedEmpresa(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
                >
                  <option value="">Selecciona una empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa._id} value={empresa._id}>
                      {empresa.razonSocial}{" "}
                    </option>
                  ))}
                </select>
                {empresas.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    No hay empresas activas disponibles
                  </p>
                )}
              </div>

              {/* Checkbox Chofer Externo */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="esChoferExterno"
                  checked={esChoferExterno}
                  onChange={(e) => {
                    setEsChoferExterno(e.target.checked);
                    if (e.target.checked) {
                      setSelectedChofer("");
                    }
                  }}
                  className="mt-0.5 h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="esChoferExterno" className="flex-1 cursor-pointer">
                  <p className="text-sm font-medium text-blue-900">Chofer Externo</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Marcar si el chofer no está registrado en el sistema. Los datos del chofer se solicitarán cuando inicie la ruta.
                  </p>
                </label>
              </div>

              {/* Selección de chofer */}
              {!esChoferExterno && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chofer *
                  </label>
                  <select
                    value={selectedChofer}
                    onChange={(e) => setSelectedChofer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-black"
                  >
                    <option value="">Selecciona un chofer</option>
                    {choferes.map((chofer) => (
                      <option key={chofer._id} value={chofer._id}>
                        {getNombreCompleto(chofer)} (@{chofer.usuario})
                      </option>
                    ))}
                  </select>
                  {choferes.length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      No hay choferes disponibles
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
