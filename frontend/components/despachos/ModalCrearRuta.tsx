import { Modal, Button } from "@/components/ui";
import { getNombreCompleto, type User } from "@/services/userService";
import type { EmpresaReparto } from "@/services/empresaService";

interface ModalCrearRutaProps {
  isOpen: boolean;
  selectedCount: number;
  empresas: EmpresaReparto[];
  choferes: User[];
  selectedEmpresa: string;
  selectedChofer: string;
  esChoferExterno: boolean;
  loading: boolean;
  creating: boolean;
  onClose: () => void;
  onEmpresaChange: (value: string) => void;
  onChoferChange: (value: string) => void;
  onExternoChange: (value: boolean) => void;
  onSubmit: () => void;
}

export function ModalCrearRuta({
  isOpen,
  selectedCount,
  empresas,
  choferes,
  selectedEmpresa,
  selectedChofer,
  esChoferExterno,
  loading,
  creating,
  onClose,
  onEmpresaChange,
  onChoferChange,
  onExternoChange,
  onSubmit,
}: ModalCrearRutaProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nueva Ruta"
      size="md"
    >
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            {selectedCount} despacho{selectedCount !== 1 ? "s" : ""}{" "}
            seleccionado{selectedCount !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Cargando datos...</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa de Reparto <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedEmpresa}
                onChange={(e) => onEmpresaChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                disabled={creating}
              >
                <option value="">Selecciona una empresa</option>
                {empresas.map((empresa) => (
                  <option key={empresa._id} value={empresa._id}>
                    {empresa.razonSocial}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conductor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedChofer}
                onChange={(e) => onChoferChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                disabled={creating}
              >
                <option value="">Selecciona un conductor</option>
                {choferes.map((chofer) => (
                  <option key={chofer._id} value={chofer.usuario}>
                    {getNombreCompleto(chofer)} ({chofer.usuario})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={esChoferExterno}
                onChange={(e) => onExternoChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                disabled={creating}
              />
              <label className="text-sm text-gray-700">
                Es chofer externo (de otra empresa)
              </label>
            </div>
          </>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            fullWidth
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            variant="primary"
            size="md"
            fullWidth
            disabled={creating || loading}
            isLoading={creating}
          >
            {creating ? "Creando..." : "Crear Ruta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}