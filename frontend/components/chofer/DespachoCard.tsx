import { Card, Button } from "@/components/ui";
import { abrirEnMapa } from "@/utils/mapsUtils";
import { formatRut } from "@/utils/rutaUtils";
import type { DespachoConEntrega } from "@/services/rutaService";

interface DespachoCardProps {
  despacho: DespachoConEntrega;
  index: number;
  rutaEstado: string;
  onEntregar: (despacho: DespachoConEntrega) => void;
}

function getEstadoBadgeColor(estado: string): string {
  const colores: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    asignado: "bg-blue-100 text-blue-800",
    entregado: "bg-green-100 text-green-800",
    no_entregado: "bg-amber-100 text-amber-800",
    cancelado: "bg-red-100 text-red-800",
  };
  return colores[estado] || "bg-gray-100 text-gray-800";
}

export function DespachoCard({
  despacho,
  index,
  rutaEstado,
  onEntregar,
}: DespachoCardProps) {
  return (
    <Card
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
      {!["entregado", "no_entregado", "cancelado"].includes(despacho.estado) &&
        rutaEstado === "iniciada" && (
        <Button
          onClick={() => onEntregar(despacho)}
          variant="primary"
          size="md"
          fullWidth
          className="bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-sm md:text-base font-semibold py-2.5 md:py-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
        >
          📦 Entregar Despacho
        </Button>
      )}

      {/* Info de entrega si está entregado */}
      {despacho.estado === "entregado" && despacho.entrega && (
        <div className="pt-3 md:pt-4 border-t-2 border-green-200 mt-3 md:mt-4 bg-green-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
          <p className="text-xs md:text-sm text-green-700 font-bold mb-2 flex items-center gap-1.5">
            <span className="text-base md:text-lg">✓</span> Entregado
            exitosamente
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
                <span className="font-medium">🕐 Hora de entrega:</span>{" "}
                {new Date(despacho.entrega.fechaEntrega).toLocaleString(
                  "es-CL",
                  {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Info si está marcado como no entregado */}
      {despacho.estado === "no_entregado" && despacho.noEntrega && (
        <div className="pt-3 md:pt-4 border-t-2 border-amber-200 mt-3 md:mt-4 bg-amber-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
          <p className="text-xs md:text-sm text-amber-800 font-bold mb-2 flex items-center gap-1.5">
            <span className="text-base md:text-lg">!</span> No entregado
          </p>
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-gray-700">
              <span className="font-medium">Motivo:</span>{" "}
              {despacho.noEntrega.motivo}
            </p>
            {despacho.noEntrega.observacion && (
              <p className="text-xs md:text-sm text-gray-700">
                <span className="font-medium">Observación:</span>{" "}
                {despacho.noEntrega.observacion}
              </p>
            )}
            {despacho.noEntrega.fechaNoEntrega && (
              <p className="text-xs md:text-sm text-gray-700">
                <span className="font-medium">Hora:</span>{" "}
                {new Date(despacho.noEntrega.fechaNoEntrega).toLocaleString("es-CL")}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
