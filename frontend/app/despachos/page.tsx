"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, useDialog } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DespachoCard, ModalCrearRuta } from "@/components/despachos";
import { useDespachos, useCrearRuta } from "@/hooks";
import { NavBar } from "@/components/layout";

export default function DespachosPage() {
  const router = useRouter();
  const { dialog, showAlert } = useDialog();
  const creatingRef = useRef(false);
  const [selectedDespachos, setSelectedDespachos] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const {
    loading,
    syncing,
    error,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    despachosFiltrados,
    estadoCounts,
    loadDespachos,
    handleSync,
  } = useDespachos();

  const {
    showModal,
    empresas,
    choferes,
    loadingModal,
    selectedEmpresa,
    setSelectedEmpresa,
    selectedChofer,
    setSelectedChofer,
    esChoferExterno,
    setEsChoferExterno,
    creatingRuta,
    openModal,
    closeModal,
    crearRuta,
  } = useCrearRuta();

  useEffect(() => {
    loadDespachos();
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedDespachos((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const totalPages = Math.ceil(despachosFiltrados.length / itemsPerPage);
  const despachosPaginados = despachosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const tabEstado = filterEstado === "todos" ? "pendiente" : filterEstado;
  const pendientesCount = estadoCounts.pendiente;
  const entregadosCount = estadoCounts.entregado;

  const handleSelectAll = () => {
    if (tabEstado !== "pendiente") return;
    if (selectedDespachos.length === despachosPaginados.length) {
      setSelectedDespachos([]);
    } else {
      setSelectedDespachos(despachosPaginados.map((d) => d._id));
    }
  };

  const handleCrearRuta = async () => {
    if (creatingRef.current || creatingRuta) return;
    creatingRef.current = true;
    try {
      const created = await crearRuta(selectedDespachos);
      if (!created) return;
      await showAlert(`Ruta creada exitosamente con ${selectedDespachos.length} despachos`, {
        variant: "success",
      });
      closeModal();
      setSelectedDespachos([]);
      await loadDespachos();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      await showAlert(`Error: ${err.message}`, { title: "Error", variant: "danger" });
    } finally {
      creatingRef.current = false;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "adminBodega", "subBodega"]}>
      <div className="min-h-screen bg-gray-50">
        <NavBar
          title="Gestión de Despachos"
          description="Administra despachos y crea rutas de reparto"
          currentPage="despachos"
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {dialog}
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded shadow-sm">
              <p className="font-medium text-sm">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-3">
            <Button
              onClick={openModal}
              variant="primary"
              size="md"
              disabled={selectedDespachos.length === 0}
            >
              ➕ Crear Ruta ({selectedDespachos.length})
            </Button>
            <Button
              onClick={loadDespachos}
              variant="secondary"
              size="md"
              disabled={loading}
            >
              🔄 Actualizar
            </Button>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Buscar por folio, cliente, código o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterEstado("pendiente")}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                tabEstado === "pendiente"
                  ? "bg-yellow-100 border-yellow-300 text-yellow-900"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Pendientes ({pendientesCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterEstado("entregado")}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                tabEstado === "entregado"
                  ? "bg-green-100 border-green-300 text-green-900"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Entregados ({entregadosCount})
            </button>
          </div>

          {despachosPaginados.length > 0 && tabEstado === "pendiente" && (
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedDespachos.length === despachosPaginados.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">
                Seleccionar todos ({despachosPaginados.length})
              </label>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando despachos...</p>
            </div>
          ) : despachosPaginados.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg">
                No hay despachos disponibles
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {despachosPaginados.map((despacho) => (
                  <DespachoCard
                    key={despacho._id}
                    despacho={despacho}
                    isSelected={
                      tabEstado === "pendiente" &&
                      selectedDespachos.includes(despacho._id)
                    }
                    onToggleSelect={handleToggleSelect}
                    selectable={tabEstado === "pendiente"}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </main>

        <ModalCrearRuta
          isOpen={showModal}
          selectedCount={selectedDespachos.length}
          empresas={empresas}
          choferes={choferes}
          selectedEmpresa={selectedEmpresa}
          selectedChofer={selectedChofer}
          esChoferExterno={esChoferExterno}
          loading={loadingModal}
          creating={creatingRuta}
          onClose={closeModal}
          onEmpresaChange={setSelectedEmpresa}
          onChoferChange={setSelectedChofer}
          onExternoChange={setEsChoferExterno}
          onSubmit={handleCrearRuta}
        />
      </div>
    </ProtectedRoute>
  );
}
