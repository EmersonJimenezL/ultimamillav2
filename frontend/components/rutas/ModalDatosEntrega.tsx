import { Modal, Button } from "@/components/ui";
import { formatRut } from "@/utils";

interface ModalDatosEntregaProps {
  isOpen: boolean;
  despacho: any | null;
  receptorRut: string;
  receptorNombre: string;
  receptorApellido: string;
  fotoPreview: string | null;
  actualizando: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onRutChange: (value: string) => void;
  onNombreChange: (value: string) => void;
  onApellidoChange: (value: string) => void;
  onFotoChange: (file: File | null) => void;
  onSubmit: () => void;
}

export function ModalDatosEntrega({
  isOpen,
  despacho,
  receptorRut,
  receptorNombre,
  receptorApellido,
  fotoPreview,
  actualizando,
  fileInputRef,
  onClose,
  onRutChange,
  onNombreChange,
  onApellidoChange,
  onFotoChange,
  onSubmit,
}: ModalDatosEntregaProps) {
  const handleCapturarFoto = () => {
    fileInputRef.current?.click();
  };

  if (!despacho) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar/Editar Datos de Entrega"
      size="md"
    >
      <div className="space-y-4">
        {/* Info del despacho */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            Folio: {despacho.FolioNum}
          </p>
          <p className="text-xs text-blue-700 mt-1">{despacho.CardName}</p>
        </div>

        {/* RUT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RUT del Receptor
          </label>
          <input
            type="text"
            value={formatRut(receptorRut)}
            onChange={(e) =>
              onRutChange(e.target.value.replace(/[.-]/g, ""))
            }
            placeholder="12.345.678-9"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            maxLength={12}
            disabled={actualizando}
          />
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Receptor
          </label>
          <input
            type="text"
            value={receptorNombre}
            onChange={(e) => onNombreChange(e.target.value)}
            placeholder="Ej: Juan"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            disabled={actualizando}
          />
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido del Receptor
          </label>
          <input
            type="text"
            value={receptorApellido}
            onChange={(e) => onApellidoChange(e.target.value)}
            placeholder="Ej: Pérez"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            disabled={actualizando}
          />
        </div>

        {/* Foto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto de Entrega
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onFotoChange(e.target.files?.[0] || null)}
            className="hidden"
          />

          {!fotoPreview ? (
            <Button
              onClick={handleCapturarFoto}
              variant="secondary"
              size="md"
              fullWidth
              disabled={actualizando}
            >
              📷 Capturar/Seleccionar Foto
            </Button>
          ) : (
            <div className="space-y-2">
              <img
                src={fotoPreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border-2 border-blue-300"
              />
              <Button
                onClick={handleCapturarFoto}
                variant="secondary"
                size="sm"
                fullWidth
                disabled={actualizando}
              >
                Cambiar Foto
              </Button>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            size="md"
            fullWidth
            disabled={actualizando}
          >
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            variant="primary"
            size="md"
            fullWidth
            disabled={actualizando}
            isLoading={actualizando}
          >
            {actualizando ? "Guardando..." : "Guardar Datos"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}