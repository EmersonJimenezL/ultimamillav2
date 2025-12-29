import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { abrirRutaCompleta } from "@/utils/mapsUtils";
import type { Ruta } from "@/services/rutaService";

type DespachoLite = {
  _id?: string;
  FolioNum?: number;
  CardName?: string;
  Address2?: string;
  estado?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toDespachoLite(value: unknown): DespachoLite | null {
  if (!isRecord(value)) return null;

  const _id = typeof value._id === "string" ? value._id : undefined;
  const FolioNum = typeof value.FolioNum === "number" ? value.FolioNum : undefined;
  const CardName = typeof value.CardName === "string" ? value.CardName : undefined;
  const Address2 = typeof value.Address2 === "string" ? value.Address2 : undefined;
  const estado = typeof value.estado === "string" ? value.estado : undefined;

  return { _id, FolioNum, CardName, Address2, estado };
}

interface RutaEntregasPreviewProps {
  despachos: Ruta["despachos"];
  previewCount?: number;
}

export function RutaEntregasPreview({
  despachos,
  previewCount = 3,
}: RutaEntregasPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const despachosLite = useMemo(() => {
    if (!Array.isArray(despachos)) return [];
    return despachos.map(toDespachoLite).filter((d): d is DespachoLite => Boolean(d));
  }, [despachos]);

  const direcciones = useMemo(() => {
    return despachosLite
      .map((d) => d.Address2)
      .filter((d): d is string => typeof d === "string")
      .map((d) => d.trim())
      .filter(Boolean);
  }, [despachosLite]);

  const totalDespachos = despachosLite.length;
  const direccionesValidas = direcciones.length;
  const despachosSinDireccion = Math.max(0, totalDespachos - direccionesValidas);

  if (totalDespachos === 0) return null;

  const items = despachosLite.slice(0, Math.max(1, previewCount));
  const hasMore = totalDespachos > items.length;

  return (
    <div className="mb-4 p-3 rounded-lg bg-white border border-gray-200">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
        aria-expanded={isOpen}
      >
        <div className="min-w-0 text-left">
          <p className="text-xs md:text-sm font-semibold text-gray-900">
            📦 Entregas: {totalDespachos} despacho{totalDespachos !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {isOpen
              ? "Ocultar detalle"
              : `Ver ${Math.min(items.length, totalDespachos)} despacho${
                  Math.min(items.length, totalDespachos) !== 1 ? "s" : ""
                }`}
          </p>
          {despachosSinDireccion > 0 && (
            <p className="text-xs text-amber-700 mt-0.5">
              {despachosSinDireccion} sin dirección
            </p>
          )}
        </div>
        <span className="text-gray-600 text-sm md:text-base shrink-0">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="mt-3 space-y-2">
            {items.map((d, idx) => {
              const key = d._id ?? `${idx}`;
              const titulo =
                d.CardName || (d.FolioNum ? `Folio ${d.FolioNum}` : "Entrega");
              const direccion = d.Address2?.trim();

              return (
                <div
                  key={key}
                  className="p-2 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                        {idx + 1}. {titulo}
                      </p>
                      <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                        {direccion ? (
                          direccion
                        ) : (
                          <span className="text-gray-500">Sin dirección</span>
                        )}
                      </p>
                    </div>
                    {d.estado && (
                      <span className="text-[10px] md:text-xs font-bold text-gray-600 whitespace-nowrap">
                        {d.estado.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <p className="text-xs text-gray-500">
                + {totalDespachos - items.length} más (ver detalle para todo)
              </p>
            )}
          </div>

          <div className="pt-3 flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => abrirRutaCompleta(direcciones)}
              variant="secondary"
              size="sm"
              fullWidth
              disabled={direccionesValidas === 0}
              title={
                direccionesValidas === 0
                  ? "No hay direcciones válidas para abrir en Maps"
                  : "Abrir ruta completa en Google Maps"
              }
            >
              🗺️ Abrir ruta en Maps
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
