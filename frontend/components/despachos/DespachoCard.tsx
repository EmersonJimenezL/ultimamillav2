import type { DragEvent } from "react";
import { Card } from "@/components/ui";
import type { Despacho } from "@/services/despachoService";

interface DespachoCardProps {
  despacho: Despacho;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectable?: boolean;
  draggable?: boolean;
  onDragStart?: (id: string, event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}

function getEstadoBadgeColor(estado: string): string {
  const colores: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    entregado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  };
  return colores[estado] || "bg-gray-100 text-gray-800";
}

function formatDocDate(value: string | number | undefined) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-CL");
}

export function DespachoCard({
  despacho,
  isSelected = false,
  onToggleSelect,
  selectable = true,
  draggable = false,
  onDragStart,
  onDragEnd,
}: DespachoCardProps) {
  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 ${
        selectable ? "cursor-pointer" : "cursor-default opacity-95"
      } ${
        isSelected
          ? "bg-blue-50 ring-2 ring-blue-500"
          : "bg-white ring-1 ring-gray-200 hover:ring-blue-300 hover:shadow-lg"
      }`}
      padding="md"
      onClick={() => {
        if (selectable && onToggleSelect) onToggleSelect(despacho._id);
      }}
      draggable={draggable}
      onDragStart={(event) => {
        if (onDragStart) onDragStart(despacho._id, event);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 opacity-90" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-20 w-20 rounded-full bg-blue-50" />
      <div className="relative flex items-start gap-3">
        {selectable && onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(despacho._id)}
            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Despacho
              </p>
              <h3 className="text-lg font-bold text-gray-900 truncate">
                Folio {despacho.FolioNum}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getEstadoBadgeColor(
                  despacho.estado
                )}`}
              >
                {despacho.estado.toUpperCase()}
              </span>
              {draggable && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  Arrastrar
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Cliente
              </p>
              <p className="font-semibold text-gray-900 leading-snug">
                {despacho.CardName}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                <span className="text-[10px] uppercase tracking-wide">Fecha</span>
                <span className="text-[11px]">{formatDocDate(despacho.DocDate)}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-700">
                <span className="text-[10px] uppercase tracking-wide">Código</span>
                <span className="text-[11px]">{despacho.CardCode}</span>
              </span>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Dirección
              </p>
              <p className="text-gray-700 leading-snug">{despacho.Address2}</p>
            </div>
            {despacho.Comments && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-2.5 py-2">
                <p className="text-[11px] uppercase tracking-wide text-amber-700">
                  Comentarios
                </p>
                <p className="text-amber-900/80 text-xs leading-snug">
                  {despacho.Comments}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
