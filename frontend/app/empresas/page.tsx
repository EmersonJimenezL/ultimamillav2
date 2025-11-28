"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { empresaService, type EmpresaReparto } from "@/services/empresaService";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout";

export default function EmpresasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [empresas, setEmpresas] = useState<EmpresaReparto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [empresaActual, setEmpresaActual] = useState<EmpresaReparto | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    rut: "",
    razonSocial: "",
    contacto: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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

    loadEmpresas();
  }, [user, router, authLoading]);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await empresaService.getAll();
      setEmpresas(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    setEmpresaActual(null);
    setFormData({ rut: "", razonSocial: "", contacto: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (empresa: EmpresaReparto) => {
    setModalMode("edit");
    setEmpresaActual(empresa);
    setFormData({
      rut: empresa.rut,
      razonSocial: empresa.razonSocial,
      contacto: empresa.contacto,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEmpresaActual(null);
    setFormData({ rut: "", razonSocial: "", contacto: "" });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rut || !formData.razonSocial || !formData.contacto) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (modalMode === "create") {
        await empresaService.create(formData);
        alert("Empresa creada exitosamente");
      } else if (empresaActual) {
        await empresaService.update(empresaActual._id, formData);
        alert("Empresa actualizada exitosamente");
      }

      await loadEmpresas();
      handleCloseModal();
    } catch (err: any) {
      setError(
        err.message ||
          `Error al ${modalMode === "create" ? "crear" : "actualizar"} empresa`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, razonSocial: string) => {
    if (!confirm(`¿Estás seguro de eliminar la empresa "${razonSocial}"?`)) {
      return;
    }

    try {
      setDeleting(id);
      setError(null);
      await empresaService.delete(id);
      alert("Empresa eliminada exitosamente");
      await loadEmpresas();
    } catch (err: any) {
      setError(err.message || "Error al eliminar empresa");
      alert(`Error: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        title="Gestión de Empresas de Reparto"
        description={`${empresas.length} empresa${
          empresas.length !== 1 ? "s" : ""
        } registrada${empresas.length !== 1 ? "s" : ""}`}
        currentPage="empresas"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Button onClick={handleOpenCreate} variant="primary" size="sm">
            ➕ Nueva Empresa
          </Button>
        </div>

        {/* Error */}
        {error && !showModal && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Lista de empresas */}
        {empresas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center ">
            <p className="text-gray-500 text-lg">No hay empresas registradas</p>
            <Button
              onClick={handleOpenCreate}
              variant="primary"
              size="md"
              className="mt-4"
            >
              Crear Primera Empresa
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {empresas.map((empresa) => (
              <div
                key={empresa._id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {empresa.razonSocial}
                </h3>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">RUT</p>
                    <p className="text-sm font-medium text-gray-900">
                      {empresa.rut}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase">Contacto</p>
                    <p className="text-sm font-medium text-gray-900">
                      {empresa.contacto}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenEdit(empresa)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() =>
                      handleDelete(empresa._id, empresa.razonSocial)
                    }
                    variant="danger"
                    size="sm"
                    disabled={deleting === empresa._id}
                  >
                    {deleting === empresa._id ? "..." : "Eliminar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {modalMode === "create" ? "Nueva Empresa" : "Editar Empresa"}
                </h2>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RUT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.rut}
                      onChange={(e) =>
                        setFormData({ ...formData, rut: e.target.value })
                      }
                      placeholder="Ej: 12.345.678-9"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formato: XX.XXX.XXX-X
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razón Social <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.razonSocial}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          razonSocial: e.target.value,
                        })
                      }
                      placeholder="Ej: Chilexpress S.A."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contacto}
                      onChange={(e) =>
                        setFormData({ ...formData, contacto: e.target.value })
                      }
                      placeholder="Ej: 600 600 6000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Teléfono o email de contacto
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={handleCloseModal}
                      variant="secondary"
                      size="md"
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Guardando..."
                        : modalMode === "create"
                        ? "Crear"
                        : "Guardar"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
