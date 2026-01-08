"use client";

import { useState, useEffect, useMemo, useRef, type DragEvent } from "react";
import { Button, Modal, useDialog } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DespachoCard } from "@/components/despachos";
import { useDespachos, useCrearRuta } from "@/hooks";
import { NavBar } from "@/components/layout";
import { isEmpresaPropia } from "@/utils";
import { getNombreCompleto } from "@/services/userService";

const itemsPerPage = 20;

export default function DespachosPage() {
  const { dialog, showAlert } = useDialog();
  const creatingRef = useRef(false);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dragOverTrash, setDragOverTrash] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [modalTarget, setModalTarget] = useState<{
    id: string;
    name: string;
    type: "chofer" | "empresa";
  } | null>(null);

  const {
    despachos,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    despachosFiltrados,
    estadoCounts,
    loadDespachos,
  } = useDespachos();

  const {
    empresas,
    choferes,
    loadingModal,
    creatingRuta,
    loadData,
    crearRuta,
  } = useCrearRuta();

  useEffect(() => {
    loadDespachos();
    loadData();
  }, []);

  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(assignments).forEach((items) => {
      items.forEach((id) => ids.add(id));
    });
    return ids;
  }, [assignments]);

  const despachosDisponibles = useMemo(() => {
    const filtered = despachosFiltrados.filter(
      (despacho) => !assignedIds.has(despacho._id)
    );
    return filtered.sort((a, b) => {
      const dateA = new Date(a.DocDate || 0).getTime();
      const dateB = new Date(b.DocDate || 0).getTime();
      if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
      if (Number.isNaN(dateA)) return 1;
      if (Number.isNaN(dateB)) return -1;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [despachosFiltrados, assignedIds, sortOrder]);

  const despachoById = useMemo(() => {
    const map = new Map<string, (typeof despachos)[number]>();
    despachos.forEach((despacho) => map.set(despacho._id, despacho));
    return map;
  }, [despachos]);

  const empresaPropia = useMemo(
    () => empresas.find((empresa) => isEmpresaPropia(empresa)),
    [empresas]
  );
  const empresasExternas = useMemo(
    () => empresas.filter((empresa) => !isEmpresaPropia(empresa)),
    [empresas]
  );
  const empresaUsuarios = useMemo(() => {
    const usuarios = new Set<string>();
    empresas.forEach((empresa) => {
      if (empresa.usuarioCuenta) {
        usuarios.add(empresa.usuarioCuenta.toLowerCase());
      }
    });
    return usuarios;
  }, [empresas]);
  const choferesVivipra = useMemo(
    () =>
      choferes.filter(
        (chofer) => !empresaUsuarios.has(String(chofer.usuario || "").toLowerCase())
      ),
    [choferes, empresaUsuarios]
  );

  const totalPages = Math.ceil(despachosDisponibles.length / itemsPerPage);
  const despachosPaginados = despachosDisponibles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const tabEstado = filterEstado === "todos" ? "pendiente" : filterEstado;
  const pendientesCount = estadoCounts.pendiente;
  const entregadosCount = estadoCounts.entregado;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  const getTargetKey = (type: "chofer" | "empresa" | "pool", id?: string) =>
    `${type}:${id ?? ""}`;

  const assignDespacho = (despachoId: string, targetKey: string | null) => {
    setAssignments((prev) => {
      const next: Record<string, string[]> = {};
      Object.entries(prev).forEach(([key, items]) => {
        const filtered = items.filter((id) => id !== despachoId);
        if (filtered.length > 0) {
          next[key] = filtered;
        }
      });

      if (targetKey) {
        const targetItems = next[targetKey] ?? [];
        if (!targetItems.includes(despachoId)) {
          next[targetKey] = [...targetItems, despachoId];
        }
      }

      return next;
    });
  };

  const clearAssignmentsForIds = (despachoIds: string[]) => {
    setAssignments((prev) => {
      const next: Record<string, string[]> = {};
      Object.entries(prev).forEach(([key, items]) => {
        const filtered = items.filter((id) => !despachoIds.includes(id));
        if (filtered.length > 0) {
          next[key] = filtered;
        }
      });
      return next;
    });
  };

  const handleDragStart = (
    despachoId: string,
    event: DragEvent<HTMLDivElement>
  ) => {
    event.dataTransfer.setData("text/plain", despachoId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDragOverTarget(null);
    setDragOverTrash(false);
  };

  const handleDrop = (targetKey: string | null) =>
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const despachoId = event.dataTransfer.getData("text/plain");
      if (!despachoId) return;
      assignDespacho(despachoId, targetKey);
      setDragOverTarget(null);
    };

  const handleDragOver = (targetKey: string) =>
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOverTarget(targetKey);
    };

  const handleDragLeave = (targetKey: string) => () => {
    setDragOverTarget((prev) => (prev === targetKey ? null : prev));
  };

  const handleTrashDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const despachoId = event.dataTransfer.getData("text/plain");
    if (!despachoId) return;
    assignDespacho(despachoId, null);
    setDragOverTrash(false);
  };

  const handleTrashDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOverTrash(true);
  };

  const handleTrashDragLeave = () => {
    setDragOverTrash(false);
  };

  const handleCrearRutaChofer = async (choferId: string) => {
    const empresaId = empresaPropia?._id;
    if (!empresaId) {
      await showAlert("No se encontro la empresa propia para asignar choferes.", {
        title: "Empresa propia",
        variant: "danger",
      });
      return;
    }

    const targetKey = getTargetKey("chofer", choferId);
    const despachoIds = assignments[targetKey] ?? [];
    if (despachoIds.length === 0 || creatingRef.current || creatingRuta) return;

    try {
      creatingRef.current = true;
      const created = await crearRuta(despachoIds, {
        empresaId,
        choferId,
        esChoferExterno: false,
      });
      if (!created) return;
      await showAlert(`Ruta creada con ${despachoIds.length} despachos.`, {
        variant: "success",
      });
      clearAssignmentsForIds(despachoIds);
      await loadDespachos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear ruta";
      await showAlert(message, { title: "Error", variant: "danger" });
    } finally {
      creatingRef.current = false;
    }
  };

  const handleCrearRutaEmpresa = async (empresaId: string) => {
    const targetKey = getTargetKey("empresa", empresaId);
    const despachoIds = assignments[targetKey] ?? [];
    if (despachoIds.length === 0 || creatingRef.current || creatingRuta) return;

    try {
      creatingRef.current = true;
      const created = await crearRuta(despachoIds, {
        empresaId,
        esChoferExterno: true,
      });
      if (!created) return;
      await showAlert(`Ruta creada con ${despachoIds.length} despachos.`, {
        variant: "success",
      });
      clearAssignmentsForIds(despachoIds);
      await loadDespachos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear ruta";
      await showAlert(message, { title: "Error", variant: "danger" });
    } finally {
      creatingRef.current = false;
    }
  };

  const renderAssignedItemsModal = (items: string[]) => {
    if (items.length === 0) {
      return (
        <p className="text-sm text-gray-500">
          No hay folios asignados a esta ruta.
        </p>
      );
    }

    return items.map((id) => {
      const despacho = despachoById.get(id);
      if (!despacho) return null;
      return (
        <div
          key={id}
          draggable
          onDragStart={(event) => handleDragStart(id, event)}
          onDragEnd={handleDragEnd}
          className="cursor-grab rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
        >
          <div className="font-semibold text-gray-900">Folio {despacho.FolioNum}</div>
          <div className="text-xs text-gray-500 truncate">{despacho.CardName}</div>
        </div>
      );
    });
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "adminBodega", "subBodega"]}>
      <div className="min-h-screen bg-gray-50">
        <NavBar
          title="Gestion de Despachos"
          description="Administra despachos y crea rutas de reparto"
          currentPage="despachos"
        />

        <main className="w-full px-2 sm:px-4 lg:px-6 py-1">
          {dialog}
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded shadow-sm">
              <p className="font-medium text-sm">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mb-1 flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Buscar folio, cliente, codigo o direccion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 md:w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterEstado("pendiente")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
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
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  tabEstado === "entregado"
                    ? "bg-green-100 border-green-300 text-green-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Entregados ({entregadosCount})
              </button>
            </div>
            <Button
              onClick={loadDespachos}
              variant="secondary"
              size="sm"
              className="px-2.5 py-1 text-xs"
              disabled={loading}
            >
              Actualizar
            </Button>
            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="px-3 py-1 rounded-full text-[11px] font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Fecha {sortOrder === "asc" ? "↑" : "↓"}
            </button>
            <span className="text-[11px] font-semibold text-gray-600 bg-white px-2.5 py-1 rounded-full border border-gray-200">
              Sin asignar: {despachosDisponibles.length}
            </span>
            <span className="text-xs text-gray-500">
              Arrastra los despachos hacia un chofer o una empresa.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,2fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,2fr)] gap-6 items-start">
            <section className="space-y-3 min-h-0">
              <div
                className={`rounded-2xl border-2 border-dashed p-5 transition-colors max-h-[calc(100vh-190px)] overflow-y-auto ${
                  dragOverTarget === getTargetKey("pool")
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
                onDragOver={handleDragOver(getTargetKey("pool"))}
                onDragLeave={handleDragLeave(getTargetKey("pool"))}
                onDrop={handleDrop(null)}
              >
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando despachos...</p>
                  </div>
                ) : despachosPaginados.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">Sin resultados</div>
                    <p className="text-gray-500 text-sm">No hay despachos disponibles.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                    {despachosPaginados.map((despacho) => (
                      <DespachoCard
                        key={despacho._id}
                        despacho={despacho}
                        isSelected={false}
                        selectable={false}
                        draggable={tabEstado === "pendiente"}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </div>
                )}
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
                    Pagina {currentPage} de {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </section>

            <aside className="space-y-3 lg:mt-0 min-h-0">
              <div className="rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Choferes Vivipra
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Asigna despachos a un chofer interno.
                    </p>
                  </div>
                </div>

                {loadingModal ? (
                  <p className="mt-4 text-sm text-gray-500">Cargando choferes...</p>
                ) : choferesVivipra.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">No hay choferes disponibles.</p>
                ) : (
                  <div className="mt-2.5 space-y-2.5 max-h-[min(40vh,360px)] overflow-y-auto pr-1">
                    {choferesVivipra.map((chofer) => {
                      const targetKey = getTargetKey("chofer", chofer._id);
                      const assigned = assignments[targetKey] ?? [];
                      const nombre = getNombreCompleto(chofer);
                      return (
                        <div
                          key={chofer._id}
                          className={`group relative overflow-hidden rounded-2xl border p-2.5 transition-all ${
                            dragOverTarget === targetKey
                              ? "border-blue-400 bg-blue-50 shadow-sm"
                              : assigned.length > 0
                                ? "border-blue-200 bg-blue-50/40"
                                : "border-gray-200 bg-white"
                          }`}
                          onDragOver={handleDragOver(targetKey)}
                          onDragLeave={handleDragLeave(targetKey)}
                          onDrop={handleDrop(targetKey)}
                        >
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-300 opacity-80" />
                          <div className="pointer-events-none absolute -left-12 -bottom-10 h-20 w-20 rounded-full bg-blue-50" />
                          <div className="relative flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{nombre}</p>
                              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                <span className="text-[11px]">Folios</span>
                                <span className="text-[11px]">{assigned.length}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() =>
                                  setModalTarget({ id: chofer._id, name: nombre, type: "chofer" })
                                }
                                variant="secondary"
                                size="sm"
                                className="px-2.5 py-1 text-xs"
                                disabled={assigned.length === 0}
                              >
                                Ver folios
                              </Button>
                              <Button
                                onClick={() => handleCrearRutaChofer(chofer._id)}
                                variant="primary"
                                size="sm"
                                className="px-2.5 py-1 text-xs"
                                disabled={assigned.length === 0 || creatingRuta}
                              >
                                Crear ruta ({assigned.length})
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Empresas de reparto</h3>
                  <p className="text-[11px] text-gray-500">
                    Arrastra despachos hacia la empresa externa correspondiente.
                  </p>
                </div>

                {loadingModal ? (
                  <p className="mt-4 text-sm text-gray-500">Cargando empresas...</p>
                ) : empresasExternas.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">
                    No hay empresas externas registradas.
                  </p>
                ) : (
                  <div className="mt-2.5 space-y-2.5 max-h-[min(40vh,360px)] overflow-y-auto pr-1">
                    {empresasExternas.map((empresa) => {
                      const targetKey = getTargetKey("empresa", empresa._id);
                      const assigned = assignments[targetKey] ?? [];
                      return (
                        <div
                          key={empresa._id}
                          className={`group relative overflow-hidden rounded-2xl border p-2.5 transition-all ${
                            dragOverTarget === targetKey
                              ? "border-emerald-400 bg-emerald-50 shadow-sm"
                              : assigned.length > 0
                                ? "border-emerald-200 bg-emerald-50/40"
                                : "border-gray-200 bg-white"
                          }`}
                          onDragOver={handleDragOver(targetKey)}
                          onDragLeave={handleDragLeave(targetKey)}
                          onDrop={handleDrop(targetKey)}
                        >
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-lime-300 opacity-80" />
                          <div className="pointer-events-none absolute -right-12 -bottom-10 h-20 w-20 rounded-full bg-emerald-50" />
                          <div className="relative flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {empresa.razonSocial}
                              </p>
                              <p className="text-[11px] text-gray-500">{empresa.contacto}</p>
                              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                <span className="text-[11px]">Folios</span>
                                <span className="text-[11px]">{assigned.length}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() =>
                                  setModalTarget({
                                    id: empresa._id,
                                    name: empresa.razonSocial,
                                    type: "empresa",
                                  })
                                }
                                variant="secondary"
                                size="sm"
                                className="px-2.5 py-1 text-xs"
                                disabled={assigned.length === 0}
                              >
                                Ver folios
                              </Button>
                              <Button
                                onClick={() => handleCrearRutaEmpresa(empresa._id)}
                                variant="primary"
                                size="sm"
                                className="px-2.5 py-1 text-xs"
                                disabled={assigned.length === 0 || creatingRuta}
                              >
                                Crear ruta ({assigned.length})
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
      <Modal
        isOpen={Boolean(modalTarget)}
        onClose={() => setModalTarget(null)}
        title={modalTarget ? `Folios asignados - ${modalTarget.name}` : "Folios asignados"}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
          <div className="space-y-2">
            {modalTarget
              ? renderAssignedItemsModal(
                  assignments[getTargetKey(modalTarget.type, modalTarget.id)] ?? []
                )
              : null}
          </div>
          <div
            className={`rounded-2xl border border-dashed p-4 transition-colors ${
              dragOverTrash
                ? "border-red-500 bg-red-100"
                : "border-red-300 bg-red-50/70"
            }`}
            onDragOver={handleTrashDragOver}
            onDragLeave={handleTrashDragLeave}
            onDrop={handleTrashDrop}
          >
            <div className="h-full flex flex-col items-center justify-center text-center gap-2">
              <div className="text-3xl">🗑️</div>
              <p className="text-sm font-semibold text-red-700">Papelera</p>
              <p className="text-xs text-red-600">
                Arrastra folios aquí para sacarlos de la ruta.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </ProtectedRoute>
  );
}
