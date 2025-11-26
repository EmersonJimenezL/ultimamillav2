import { Button, Card } from "@/components/ui";

interface DespachoCardProps {
  despacho: any;
  index: number;
  estadoRuta: string;
  onEntregar: (despacho: any) => void;
  onAbrirMapa: (direccion: string) => void;
  getEstadoBadgeColor: (estado: string) => string;
  formatRut: (rut: string) => string;
}

export function DespachoCard({
  despacho,
  index,
  estadoRuta,
  onEntregar,
  onAbrirMapa,
  getEstadoBadgeColor,
  formatRut,
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
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-white text-xs md:text-sm font-bold shadow-sm ${
                despacho.estado === "entregado" ? "bg-green-500" : "bg-orange-500"
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

      {/* Información */}
      <div className="space-y-3 mb-4">
        <div className="p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">👤</span>
            <p className="text-xs md:text-sm text-gray-600 font-medium">Cliente</p>
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
              onClick={() => onAbrirMapa(despacho.Address2)}
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

      {/* Botón entregar */}
      {despacho.estado !== "entregado" && estadoRuta === "iniciada" && (
        <Button
          onClick={() => onEntregar(despacho)}
          variant="primary"
          size="md"
          fullWidth
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-sm md:text-base font-semibold py-2.5 md:py-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
        >
          📦 Entregar Despacho
        </Button>
      )}

      {/* Info de entrega */}
      {despacho.estado === "entregado" && despacho.entrega && (
        <div className="pt-3 md:pt-4 border-t-2 border-green-200 mt-3 md:mt-4 bg-green-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
          <p className="text-xs md:text-sm text-green-700 font-bold mb-2 flex items-center gap-1.5">
            <span className="text-base md:text-lg">✓</span> Entregado exitosamente
          </p>
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-gray-700">
              <span className="font-medium">Receptor:</span>{" "}
              {despacho.entrega.receptorNombre} {despacho.entrega.receptorApellido}
            </p>
            <p className="text-xs md:text-sm text-gray-700">
              <span className="font-medium">RUT:</span>{" "}
              {formatRut(despacho.entrega.receptorRut)}
            </p>
            {despacho.entrega.fechaEntrega && (
              <p className="text-xs md:text-sm text-gray-700">
                <span className="font-medium">🕐 Hora de entrega:</span>{" "}
                {new Date(despacho.entrega.fechaEntrega).toLocaleString("es-CL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
