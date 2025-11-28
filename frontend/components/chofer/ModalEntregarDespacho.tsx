import { Modal, Button } from "@/components/ui";
import { useEntregaDespacho } from "@/hooks/useEntregaDespacho";

interface ModalEntregarDespachoProps {
  isOpen: boolean;
  despacho: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalEntregarDespacho({
  isOpen,
  despacho,
  onClose,
  onSuccess,
}: ModalEntregarDespachoProps) {
  const {
    formData,
    errors,
    entregando,
    fileInputRef,
    resetForm,
    formatRut,
    handleRutChange,
    handleNombreChange,
    handleApellidoChange,
    handleFotoChange,
    entregarDespacho,
  } = useEntregaDespacho();

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!despacho) return;

    try {
      const success = await entregarDespacho(despacho._id);
      if (success) {
        alert("Despacho entregado exitosamente");
        handleClose();
        onSuccess();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCapturarFoto = () => {
    fileInputRef.current?.click();
  };

  if (!despacho) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Entregar Despacho"
      size="lg"
    >
      <div className="space-y-4">
        {/* Información del despacho */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">
            Información del Despacho
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Folio:</span> {despacho.FolioNum}
            </p>
            <p>
              <span className="font-medium">Cliente:</span> {despacho.CardName}
            </p>
            <p>
              <span className="font-medium">Dirección:</span>{" "}
              {despacho.Address2}
            </p>
          </div>
        </div>

        {/* Formulario de entrega */}
        <div className="space-y-4">
          {/* RUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT del Receptor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formatRut(formData.receptorRut)}
              onChange={(e) =>
                handleRutChange(e.target.value.replace(/[.-]/g, ""))
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.rutError
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="12.345.678-9"
              disabled={entregando}
            />
            {errors.rutError && (
              <p className="text-red-500 text-sm mt-1">{errors.rutError}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Receptor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receptorNombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.nombreError
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Ingresa el nombre"
              disabled={entregando}
            />
            {errors.nombreError && (
              <p className="text-red-500 text-sm mt-1">{errors.nombreError}</p>
            )}
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido del Receptor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receptorApellido}
              onChange={(e) => handleApellidoChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.apellidoError
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Ingresa el apellido"
              disabled={entregando}
            />
            {errors.apellidoError && (
              <p className="text-red-500 text-sm mt-1">
                {errors.apellidoError}
              </p>
            )}
          </div>

          {/* Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de Entrega <span className="text-red-500">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFotoChange(e.target.files?.[0] || null)}
              className="hidden"
            />

            {!formData.fotoPreview ? (
              <button
                type="button"
                onClick={handleCapturarFoto}
                disabled={entregando}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-gray-600 font-medium">Tomar Foto</span>
                  <span className="text-gray-500 text-sm">
                    Click para capturar
                  </span>
                </div>
              </button>
            ) : (
              <div className="relative">
                <img
                  src={formData.fotoPreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleCapturarFoto}
                  disabled={entregando}
                  className="absolute top-2 right-2 bg-white px-3 py-1 rounded-lg shadow-md hover:bg-gray-100 disabled:opacity-50"
                >
                  Cambiar Foto
                </button>
              </div>
            )}

            {errors.fotoError && (
              <p className="text-red-500 text-sm mt-2">{errors.fotoError}</p>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={entregando}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={entregando}
            className="flex-1"
          >
            {entregando ? "Entregando..." : "Confirmar Entrega"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
