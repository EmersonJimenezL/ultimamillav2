"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DespachoCard, ModalCrearRuta } from "@/components/despachos";
import { useDespachos, useCrearRuta } from "@/hooks";
import { NavBar } from "@/components/layout";

export default function DespachosPage() {
  const router = useRouter();
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

  const handleSelectAll = () => {
    if (selectedDespachos.length === despachosPaginados.length) {
      setSelectedDespachos([]);
    } else {
      setSelectedDespachos(despachosPaginados.map((d) => d._id));
    }
  };

  const handleCrearRuta = async () => {
    try {
      await crearRuta(selectedDespachos);
      alert(
        `Ruta creada exitosamente con ${selectedDespachos.length} despachos`
      );
      closeModal();
      setSelectedDespachos([]);
      await loadDespachos();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
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
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="todos">
                Todos (
                {estadoCounts.pendiente +
                  estadoCounts.entregado +
                  estadoCounts.cancelado}
                )
              </option>
              <option value="pendiente">
                Pendientes ({estadoCounts.pendiente})
              </option>
              <option value="entregado">
                Entregados ({estadoCounts.entregado})
              </option>
              <option value="cancelado">
                Cancelados ({estadoCounts.cancelado})
              </option>
            </select>
          </div>

          {despachosPaginados.length > 0 && (
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
                    isSelected={selectedDespachos.includes(despacho._id)}
                    onToggleSelect={handleToggleSelect}
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
