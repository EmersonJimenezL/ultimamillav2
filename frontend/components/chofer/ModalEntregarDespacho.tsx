import { Modal, Button } from "@/components/ui";
import { useEntregaDespacho } from "@/hooks/useEntregaDespacho";
import type { DespachoConEntrega } from "@/services/rutaService";

interface ModalEntregarDespachoProps {
  isOpen: boolean;
  despacho: DespachoConEntrega | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MOTIVOS_NO_ENTREGA = [
  "Cliente ausente",
  "Dirección incorrecta",
  "Sin acceso / cerrado",
  "Rechazado por cliente",
  "Horario no coincide",
  "Otro",
] as const;

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
    setTipo,
    formatRut,
    handleRutChange,
    handleNombreChange,
    handleApellidoChange,
    handleMotivoNoEntregaChange,
    handleObservacionNoEntregaChange,
    handleFotoChange,
    entregarDespacho,
    marcarNoEntregado,
  } = useEntregaDespacho();

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!despacho) return;

    try {
      const ok =
        formData.tipo === "entregado"
          ? await entregarDespacho(despacho._id)
          : await marcarNoEntregado(despacho._id);

      if (ok) {
        alert(
          formData.tipo === "entregado"
            ? "Despacho entregado exitosamente"
            : "Despacho marcado como no entregado"
        );
        handleClose();
        onSuccess();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCapturarFoto = () => {
    fileInputRef.current?.click();
  };

  if (!despacho) return null;

  const fotoPreview =
    formData.tipo === "entregado" ? formData.fotoEntregaPreview : formData.fotoEvidenciaPreview;

  const fotoError =
    formData.tipo === "entregado" ? errors.fotoEntregaError : errors.fotoEvidenciaError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Gestionar Despacho"
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg text-gray-900">
          <h3 className="font-semibold text-gray-900 mb-2">Información del Despacho</h3>
          <div className="space-y-1 text-sm text-gray-900">
            <p className="text-gray-900">
              <span className="font-medium text-gray-900">Folio:</span>{" "}
              <span className="text-gray-900">{despacho.FolioNum}</span>
            </p>
            <p className="text-gray-900">
              <span className="font-medium text-gray-900">Cliente:</span>{" "}
              <span className="text-gray-900">{despacho.CardName}</span>
            </p>
            <p className="text-gray-900">
              <span className="font-medium text-gray-900">Dirección:</span>{" "}
              <span className="text-gray-900">{despacho.Address2}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipo("entregado")}
            disabled={entregando}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
              formData.tipo === "entregado"
                ? "bg-green-50 border-green-300 text-green-900"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            ✓ Entregado
          </button>
          <button
            type="button"
            onClick={() => setTipo("no_entregado")}
            disabled={entregando}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
              formData.tipo === "no_entregado"
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            ⚠ No entregado
          </button>
        </div>

        {formData.tipo === "entregado" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT del Receptor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formatRut(formData.receptorRut)}
                onChange={(e) => handleRutChange(e.target.value.replace(/[.-]/g, ""))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.rutError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="12.345.678-9"
                disabled={entregando}
              />
              {errors.rutError && <p className="text-red-500 text-sm mt-1">{errors.rutError}</p>}
            </div>

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
                <p className="text-red-500 text-sm mt-1">{errors.apellidoError}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.motivoNoEntrega}
                onChange={(e) => handleMotivoNoEntregaChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.motivoError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={entregando}
              >
                <option value="">Selecciona un motivo</option>
                {MOTIVOS_NO_ENTREGA.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {errors.motivoError && (
                <p className="text-red-500 text-sm mt-1">{errors.motivoError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
              <textarea
                value={formData.observacionNoEntrega}
                onChange={(e) => handleObservacionNoEntregaChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Opcional: detalles del intento de entrega"
                rows={3}
                disabled={entregando}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.tipo === "entregado" ? "Foto de Entrega" : "Foto de Evidencia"}{" "}
            <span className="text-red-500">*</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFotoChange(e.target.files?.[0] || null)}
            className="hidden"
          />

          {!fotoPreview ? (
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
                <span className="text-gray-500 text-sm">Click para capturar</span>
              </div>
            </button>
          ) : (
            <div className="relative">
              <img src={fotoPreview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
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

          {fotoError && <p className="text-red-500 text-sm mt-2">{fotoError}</p>}
        </div>

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
            {entregando
              ? "Guardando..."
              : formData.tipo === "entregado"
                ? "Confirmar Entrega"
                : "Marcar No Entregado"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
