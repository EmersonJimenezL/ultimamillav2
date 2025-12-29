import { Button } from "@/components/ui";
import { MetricasTiempo } from "./MetricasTiempo";
import { getEstadoBadgeColor, formatRut } from "@/utils";
import type { Ruta, DespachoConEntrega } from "@/services/rutaService";

interface RutaCardProps {
  ruta: Ruta;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCancelar: (rutaId: string, numeroRuta?: string) => void;
  onAgregarDatos: (despacho: any) => void;
  cancelando: boolean;
}

export function RutaCard({
  ruta,
  isExpanded,
  onToggleExpand,
  onCancelar,
  onAgregarDatos,
  cancelando,
}: RutaCardProps) {
  const despachos = Array.isArray(ruta.despachos)
    ? (ruta.despachos.filter(
        (d): d is DespachoConEntrega => typeof d === "object" && d !== null
      ) as DespachoConEntrega[])
    : [];

  const despachosEntregados = despachos.filter((d) => d.estado === "entregado").length;
  const totalDespachos = despachos.length;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                📦 {ruta.numeroRuta || `Ruta ${ruta._id.slice(-6)}`}
              </h3>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getEstadoBadgeColor(
                  ruta.estado
                )}`}
              >
                {ruta.estado.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Conductor:</span>
                <p className="font-semibold text-gray-900">{ruta.conductor}</p>
              </div>
              {ruta.patente && (
                <div>
                  <span className="text-gray-600">Patente:</span>
                  <p className="font-semibold text-gray-900 uppercase">{ruta.patente}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Despachos:</span>
                <p className="font-semibold text-orange-600">
                  {despachosEntregados}/{totalDespachos}
                </p>
              </div>
              {ruta.empresaReparto && (
                <div>
                  <span className="text-gray-600">Empresa:</span>
                  <p className="font-semibold text-gray-900">
                    {typeof ruta.empresaReparto === "object"
                      ? ruta.empresaReparto.razonSocial
                      : ruta.empresaReparto}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            className="text-gray-400 hover:text-gray-600 transition-transform"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-4 space-y-4">
            <MetricasTiempo
              asignadoEl={ruta.asignadoEl}
              fechaInicio={ruta.fechaInicio}
              fechaFinalizacion={ruta.fechaFinalizacion}
              despachos={despachos}
            />

            {ruta.estado !== "cancelada" && ruta.estado !== "finalizada" && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelar(ruta._id, ruta.numeroRuta);
                }}
                variant="danger"
                size="sm"
                disabled={cancelando}
              >
                {cancelando ? "Cancelando..." : "❌ Cancelar Ruta"}
              </Button>
            )}

            {despachos.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">
                  Despachos ({despachos.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {despachos.map((despacho: any, index: number) => (
                    <div
                      key={despacho._id}
                      className={`p-3 rounded-lg border ${
                        despacho.estado === "entregado"
                          ? "bg-green-50 border-green-200"
                          : despacho.estado === "no_entregado"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">
                              {index + 1}
                            </span>
                            <p className="font-semibold text-gray-900">
                              Folio: {despacho.FolioNum}
                            </p>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getEstadoBadgeColor(
                                despacho.estado
                              )}`}
                            >
                              {String(despacho.estado).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{despacho.CardName}</p>
                          <p className="text-xs text-gray-600">📍 {despacho.Address2}</p>

                          {despacho.estado === "entregado" && despacho.entrega && (
                            <div className="mt-2 p-2 bg-green-100 rounded text-xs space-y-1">
                              <p className="font-semibold text-green-800">✓ Entregado</p>
                              {despacho.entrega.receptorNombre && (
                                <p className="text-green-700">
                                  Receptor: {despacho.entrega.receptorNombre}{" "}
                                  {despacho.entrega.receptorApellido}
                                </p>
                              )}
                              {despacho.entrega.receptorRut && (
                                <p className="text-green-700">
                                  RUT: {formatRut(despacho.entrega.receptorRut)}
                                </p>
                              )}
                              {despacho.entrega.fechaEntrega && (
                                <p className="text-green-700">
                                  {new Date(despacho.entrega.fechaEntrega).toLocaleString("es-CL")}
                                </p>
                              )}
                            </div>
                          )}

                          {despacho.estado === "no_entregado" && despacho.noEntrega && (
                            <div className="mt-2 p-2 bg-amber-100 rounded text-xs space-y-1">
                              <p className="font-semibold text-amber-900">⚠ No entregado</p>
                              {despacho.noEntrega.motivo && (
                                <p className="text-amber-900">
                                  Motivo: {despacho.noEntrega.motivo}
                                </p>
                              )}
                              {despacho.noEntrega.fechaNoEntrega && (
                                <p className="text-amber-900">
                                  {new Date(despacho.noEntrega.fechaNoEntrega).toLocaleString(
                                    "es-CL"
                                  )}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          {despacho.estado === "entregado" && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAgregarDatos(despacho);
                              }}
                              variant="secondary"
                              size="sm"
                            >
                              📝 Datos
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Las entregas/no entregas solo se registran desde el perfil del chofer.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

