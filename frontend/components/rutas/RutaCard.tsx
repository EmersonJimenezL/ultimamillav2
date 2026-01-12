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

  const puedeImprimirEtiquetas = !esRutaExterna;

  const formatDocDate = (value: unknown) => {
    if (!value) return "N/A";
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear() % 100).padStart(2, "0");
    return `${day}-${month}-${year}`;
  };

  const handlePrintEtiqueta = async (despacho: DespachoConEntrega) => {
    try {
      const labelWidthMm = 50;
      const labelHeightMm = 30;

      const folio = despacho.FolioNum ?? "N/A";
      const cliente = despacho.CardName ?? "";
      const fecha = formatDocDate((despacho as { DocDate?: string }).DocDate);
      const printWindow = window.open("", "_blank", "width=420,height=600");
      if (!printWindow) {
        await showAlert("No se pudo abrir la ventana de impresión.", {
          title: "Impresión",
          variant: "danger",
        });
        return;
      }

      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Etiqueta despacho ${folio}</title>
            <style>
              * { box-sizing: border-box; }
              @page { size: ${labelWidthMm}mm ${labelHeightMm}mm; margin: 0; }
              html, body { width: ${labelWidthMm}mm; height: ${labelHeightMm}mm; margin: 0; padding: 0; }
              body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; }
              .label {
                width: ${labelWidthMm}mm;
                height: ${labelHeightMm}mm;
                padding: 2mm 2.5mm;
                border: 1px solid #e2e8f0;
                border-radius: 2mm;
                background: #ffffff;
              }
              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 2mm;
                padding-bottom: 1.5mm;
                border-bottom: 1px solid #e2e8f0;
                margin-bottom: 1.5mm;
              }
              .chip {
                font-size: 6.5pt;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #1f2937;
                background: #f1f5f9;
                padding: 1mm 1.5mm;
                border-radius: 999px;
              }
              .folio { font-size: 12pt; font-weight: 800; }
              .meta { font-size: 7.5pt; color: #334155; line-height: 1.3; }
              .meta strong { color: #0f172a; }
              .section { display: grid; gap: 1.2mm; }
              @media print {
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="header">
                <div class="chip">${fecha}</div>
                <div class="folio">Folio ${folio}</div>
              </div>
              <div class="section">
                <div class="meta"><strong>Cliente:</strong> ${cliente}</div>
              </div>
            </div>
            <script>
              window.print();
              window.close();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      await showAlert(getErrorMessage(err), {
        title: "Error al imprimir",
        variant: "danger",
      });
    }
  };

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
      await showAlert(getErrorMessage(err), {
        title: "Error",
        variant: "danger",
      });
    } finally {
      setProcesandoDespacho(null);
    }
  };

  const handleFinalizarRuta = async () => {
    if (!puedeGestionarExterna) return;

    const ok = await showConfirm("¿Finalizar esta ruta?", {
      variant: "warning",
    });
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
      await showAlert(getErrorMessage(err), {
        title: "Error",
        variant: "danger",
      });
    } finally {
      setFinalizando(false);
    }
  };

  const handlePrintResumenRuta = async () => {
    try {
      const numeroRuta = ruta.numeroRuta || `Ruta ${ruta._id.slice(-6)}`;
      const empresa =
        typeof ruta.empresaReparto === "object"
          ? ruta.empresaReparto.razonSocial
          : ruta.empresaReparto;
      const conductorNombre = conductorLabel || "N/A";

      const printWindow = window.open("", "_blank", "width=900,height=700");
      if (!printWindow) {
        await showAlert("No se pudo abrir la ventana de impresión.", {
          title: "Impresión",
          variant: "danger",
        });
        return;
      }

      const rows = despachos
        .map(
          (despacho, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${despacho.FolioNum ?? "N/A"}</td>
              <td>${despacho.CardName ?? ""}</td>
              <td>${despacho.Address2 ?? ""}</td>
            </tr>
          `
        )
        .join("");

      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Resumen ${numeroRuta}</title>
            <style>
              * { box-sizing: border-box; }
              @page { size: A4 portrait; margin: 12mm; }
              body { font-family: Arial, sans-serif; color: #111827; }
              h1 { font-size: 20px; margin: 0 0 8px; }
              .meta { font-size: 12px; color: #374151; margin-bottom: 12px; }
              .meta strong { color: #111827; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
              th { background: #f8fafc; }
              .summary { margin-top: 10px; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Resumen de Ruta</h1>
            <div class="meta">
              <div><strong>Ruta:</strong> ${numeroRuta}</div>
              <div><strong>Conductor:</strong> ${conductorNombre}</div>
              <div><strong>Empresa:</strong> ${empresa ?? "N/A"}</div>
              <div><strong>Fecha asignación:</strong> ${new Date(
                ruta.asignadoEl
              ).toLocaleString("es-CL")}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Dirección</th>
                </tr>
              </thead>
              <tbody>
                ${rows || ""}
              </tbody>
            </table>
            <div class="summary">
              <strong>Total despachos:</strong> ${totalDespachos} 
            </div>
            <script>
              window.print();
              window.close();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      await showAlert(getErrorMessage(err), {
        title: "Error al imprimir",
        variant: "danger",
      });
    }
  };

  const handlePrintEtiquetasRuta = async () => {
    try {
      if (despachos.length === 0) return;
      const printWindow = window.open("", "_blank", "width=900,height=700");
      if (!printWindow) {
        await showAlert("No se pudo abrir la ventana de impresión.", {
          title: "Impresión",
          variant: "danger",
        });
        return;
      }

      const etiquetas = despachos
        .map((despacho) => {
          const folio = despacho.FolioNum ?? "N/A";
          const cliente = despacho.CardName ?? "";
          const fecha = formatDocDate((despacho as { DocDate?: string }).DocDate);
          return `
            <div class="label">
              <div class="header">
                <div class="chip">${fecha}</div>
                <div class="folio">Folio ${folio}</div>
              </div>
              <div class="section">
                <div class="meta"><strong>Cliente:</strong> ${cliente}</div>
              </div>
            </div>
          `;
        })
        .join('<div class="page-break"></div>');

      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Etiquetas ${ruta.numeroRuta || ruta._id}</title>
            <style>
              * { box-sizing: border-box; }
              @page { size: 50mm 30mm; margin: 0; }
              html, body { margin: 0; padding: 0; }
              body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; }
              .label {
                width: 50mm;
                height: 30mm;
                padding: 2mm 2.5mm;
                border: 1px solid #e2e8f0;
                border-radius: 2mm;
                background: #ffffff;
              }
              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 2mm;
                padding-bottom: 1.5mm;
                border-bottom: 1px solid #e2e8f0;
                margin-bottom: 1.5mm;
              }
              .chip {
                font-size: 7pt;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #1f2937;
                background: #f1f5f9;
                padding: 1mm 1.5mm;
                border-radius: 999px;
              }
              .folio { font-size: 12pt; font-weight: 800; }
              .meta { font-size: 7.5pt; color: #334155; line-height: 1.3; }
              .meta strong { color: #0f172a; }
              .section { display: grid; gap: 1.2mm; }
              .page-break { page-break-after: always; }
              @media print {
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .page-break:last-child { page-break-after: auto; }
              }
            </style>
          </head>
          <body>
            ${etiquetas}
            <script>
              window.print();
              window.close();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      await showAlert(getErrorMessage(err), {
        title: "Error al imprimir",
        variant: "danger",
      });
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

            <div className="flex items-center gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  void handlePrintResumenRuta();
                }}
                variant="outline"
                size="sm"
                className="px-3 py-1.5 text-xs"
              >
                🖨️ Resumen
              </Button>
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

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  void handlePrintEtiquetasRuta();
                }}
                variant="outline"
                size="sm"
                className="px-3 py-1.5 text-xs"
                disabled={despachos.length === 0}
              >
                🖨️ Imprimir etiquetas
              </Button>
              <div className="flex flex-wrap gap-2">
              {puedeGestionarExterna && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleFinalizarRuta();
                  }}
                  variant="primary"
                  size="sm"
                  className="px-3 py-1.5 text-xs"
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
                  className="px-3 py-1.5 text-xs"
                  disabled={cancelando}
                >
                  {cancelando ? "Cancelando..." : "❌ Cancelar Ruta"}
                </Button>
              )}
              </div>
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
                          {puedeImprimirEtiquetas && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handlePrintEtiqueta(despacho);
                              }}
                              variant="outline"
                              size="sm"
                              className="px-3 py-1.5 text-xs"
                            >
                              🖨️ Etiqueta
                            </Button>
                          )}
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
