import { Card } from "@/components/ui";
import type { Despacho } from "@/services/despachoService";

interface DespachoCardProps {
  despacho: Despacho;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  selectable?: boolean;
}

function getEstadoBadgeColor(estado: string): string {
  const colores: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    entregado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  };
  return colores[estado] || "bg-gray-100 text-gray-800";
}

export function DespachoCard({
  despacho,
  isSelected,
  onToggleSelect,
  selectable = true,
}: DespachoCardProps) {
  return (
    <Card
      className={`transition-all duration-200 ${
        selectable ? "cursor-pointer" : "cursor-default opacity-90"
      } ${
        isSelected
          ? "border-2 border-blue-500 bg-blue-50"
          : "border border-gray-200 hover:shadow-md hover:border-blue-300"
      }`}
      padding="md"
      onClick={() => {
        if (selectable) onToggleSelect(despacho._id);
      }}
    >
      <div className="flex items-start gap-3">
        {selectable && (
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
            <h3 className="text-lg font-bold text-gray-900 truncate">
              📋 Folio: {despacho.FolioNum}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getEstadoBadgeColor(
                despacho.estado
              )}`}
            >
              {despacho.estado.toUpperCase()}
            </span>
          </div>

          <div className="space-y-1 text-sm">
            <div>
              <span className="text-gray-600">Cliente:</span>
              <p className="font-semibold text-gray-900">
                {despacho.CardName}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Código:</span>
              <p className="font-medium text-gray-800">{despacho.CardCode}</p>
            </div>
            <div>
              <span className="text-gray-600">Dirección:</span>
              <p className="text-gray-700">{despacho.Address2}</p>
            </div>
            {despacho.Comments && (
              <div>
                <span className="text-gray-600">Comentarios:</span>
                <p className="text-gray-700 text-xs">{despacho.Comments}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
