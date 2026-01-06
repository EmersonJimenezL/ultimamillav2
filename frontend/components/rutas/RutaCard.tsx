import { useMemo, useState } from "react";
import { Button, useDialog } from "@/components/ui";
import { MetricasTiempo } from "./MetricasTiempo";
import { getEstadoBadgeColor, formatRut } from "@/utils";
import { isEmpresaPropia } from "@/utils/empresaUtils";
import { getErrorMessage } from "@/utils/errorUtils";
import type { Ruta, DespachoConEntrega } from "@/services/rutaService";
import { rutaService } from "@/services/rutaService";

interface RutaCardProps {
  ruta: Ruta;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCancelar: (rutaId: string, numeroRuta?: string) => void;
  onAgregarDatos: (despacho: DespachoConEntrega) => void;
  cancelando: boolean;
  onReload: () => Promise<void>;
}

export function RutaCard({
  ruta,
  isExpanded,
  onToggleExpand,
  onCancelar,
  onAgregarDatos,
  cancelando,
  onReload,
}: RutaCardProps) {
  const [procesandoDespacho, setProcesandoDespacho] = useState<string | null>(
    null
  );
  const [finalizando, setFinalizando] = useState(false);
  const { dialog, showAlert, showConfirm, showPrompt } = useDialog();

  const conductorLabel =
    ruta.nombreConductor && ruta.esChoferExterno
      ? `${ruta.nombreConductor} (${ruta.conductor})`
      : ruta.conductor;
  const despachos = Array.isArray(ruta.despachos)
    ? (ruta.despachos.filter(
        (d): d is DespachoConEntrega => typeof d === "object" && d !== null
      ) as DespachoConEntrega[])
    : [];

  const despachosEntregados = despachos.filter(
    (d) => d.estado === "entregado"
  ).length;
  const totalDespachos = despachos.length;

  const esRutaExterna = useMemo(() => {
    if (!ruta.empresaReparto || typeof ruta.empresaReparto !== "object")
      return false;
    return !isEmpresaPropia({
      rut: ruta.empresaReparto.rut,
      razonSocial: ruta.empresaReparto.razonSocial,
      usuarioCuenta: ruta.empresaReparto.usuarioCuenta,
    });
  }, [ruta.empresaReparto]);

  const puedeGestionarExterna =
    esRutaExterna &&
    ruta.estado !== "cancelada" &&
    ruta.estado !== "finalizada";

  const handleLiberarDespacho = async (despacho: DespachoConEntrega) => {
    if (!puedeGestionarExterna) return;

    const ok = await showConfirm(
      `¿Marcar como no entregado y liberar el despacho ${despacho.FolioNum} para reasignarlo?`,
      { variant: "warning" }
    );
    if (!ok) return;

    try {
      setProcesandoDespacho(despacho._id);
      const result = await rutaService.reconciliarExterna(
        ruta._id,
        [despacho._id],
        false
      );
      await showAlert(result.message, { variant: "success" });
      await onReload();
    } catch (err) {
      await showAlert(getErrorMessage(err), { title: "Error", variant: "danger" });
    } finally {
      setProcesandoDespacho(null);
    }
  };

  const handleFinalizarRuta = async () => {
    if (!puedeGestionarExterna) return;

    const ok = await showConfirm("¿Finalizar esta ruta?", { variant: "warning" });
    if (!ok) return;

    try {
      setFinalizando(true);
      const numeroDocumento = await showPrompt(
        "Ingresa el número de documento asociado a la empresa externa (opcional).",
        {
          title: "Finalizar ruta externa",
          label: "Número de documento (opcional)",
          placeholder: "Ej: Orden 12345 / Factura 67890",
          confirmText: "Finalizar",
          cancelText: "Cancelar",
          variant: "info",
        }
      );
      if (numeroDocumento === null) return;

      const result = await rutaService.reconciliarExterna(
        ruta._id,
        [],
        true,
        numeroDocumento
      );
      await showAlert(result.message, { variant: "success" });
      await onReload();
    } catch (err) {
      await showAlert(getErrorMessage(err), { title: "Error", variant: "danger" });
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {dialog}
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
                <p className="font-semibold text-gray-900">{conductorLabel}</p>
              </div>
              {ruta.patente && (
                <div>
                  <span className="text-gray-600">Patente:</span>
                  <p className="font-semibold text-gray-900 uppercase">
                    {ruta.patente}
                  </p>
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
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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

            <div className="flex flex-wrap gap-2">
              {puedeGestionarExterna && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleFinalizarRuta();
                  }}
                  variant="primary"
                  size="sm"
                  disabled={finalizando}
                  className="from-green-500! via-emerald-500! to-green-700! hover:from-green-600! hover:via-emerald-600! hover:to-green-800!"
                >
                  {finalizando ? "Finalizando..." : "Finalizar Ruta"}
                </Button>
              )}

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
            </div>

            {despachos.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">
                  Despachos ({despachos.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {despachos.map((despacho, index: number) => (
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
                          <p className="text-sm text-gray-700">
                            {despacho.CardName}
                          </p>
                          <p className="text-xs text-gray-600">
                            📍 {despacho.Address2}
                          </p>

                          {despacho.estado === "entregado" &&
                            despacho.entrega && (
                              <div className="mt-2 p-2 bg-green-100 rounded text-xs space-y-1">
                                <p className="font-semibold text-green-800">
                                  ✓ Entregado
                                </p>
                                {despacho.entrega.receptorNombre && (
                                  <p className="text-green-700">
                                    Receptor: {despacho.entrega.receptorNombre}{" "}
                                    {despacho.entrega.receptorApellido}
                                  </p>
                                )}
                                {despacho.entrega.receptorRut && (
                                  <p className="text-green-700">
                                    RUT:{" "}
                                    {formatRut(despacho.entrega.receptorRut)}
                                  </p>
                                )}
                                {despacho.entrega.fechaEntrega && (
                                  <p className="text-green-700">
                                    {new Date(
                                      despacho.entrega.fechaEntrega
                                    ).toLocaleString("es-CL")}
                                  </p>
                                )}
                              </div>
                            )}

                          {despacho.estado === "no_entregado" &&
                            despacho.noEntrega && (
                              <div className="mt-2 p-2 bg-amber-100 rounded text-xs space-y-1">
                                <p className="font-semibold text-amber-900">
                                  ⚠ No entregado
                                </p>
                                {despacho.noEntrega.motivo && (
                                  <p className="text-amber-900">
                                    Motivo: {despacho.noEntrega.motivo}
                                  </p>
                                )}
                                {despacho.noEntrega.fechaNoEntrega && (
                                  <p className="text-amber-900">
                                    {new Date(
                                      despacho.noEntrega.fechaNoEntrega
                                    ).toLocaleString("es-CL")}
                                  </p>
                                )}
                              </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-1">
                          {puedeGestionarExterna &&
                            !["entregado", "cancelado"].includes(
                              despacho.estado
                            ) && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleLiberarDespacho(despacho);
                                }}
                                variant="outline"
                                size="sm"
                                disabled={procesandoDespacho === despacho._id}
                                className="border-amber-500! text-amber-900! hover:bg-amber-50!"
                              >
                                {procesandoDespacho === despacho._id
                                  ? "Liberando..."
                                  : "Liberar"}
                              </Button>
                            )}
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
                  Las entregas/no entregas solo se registran desde el perfil del
                  chofer.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
