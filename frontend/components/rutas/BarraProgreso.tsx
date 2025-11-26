import { Button } from "@/components/ui";

interface BarraProgresoProps {
  despachosEntregados: number;
  totalDespachos: number;
  onAbrirRutaCompleta: () => void;
}

export function BarraProgreso({
  despachosEntregados,
  totalDespachos,
  onAbrirRutaCompleta,
}: BarraProgresoProps) {
  const porcentaje =
    totalDespachos > 0
      ? Math.round((despachosEntregados / totalDespachos) * 100)
      : 0;

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1.5">
        <span className="font-medium">
          {despachosEntregados} de {totalDespachos} entregados
        </span>
        <span className="font-bold text-orange-600">{porcentaje}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 md:h-3 mb-3">
        <div
          className="bg-linear-to-r from-orange-500 to-orange-600 h-2.5 md:h-3 rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${porcentaje}%` }}
        ></div>
      </div>
      {totalDespachos > 0 && (
        <Button
          onClick={onAbrirRutaCompleta}
          variant="secondary"
          size="sm"
          fullWidth
          className="text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 !text-black border-0"
        >
          🗺️ Abrir Ruta en Google Maps
        </Button>
      )}
    </div>
  );
}
