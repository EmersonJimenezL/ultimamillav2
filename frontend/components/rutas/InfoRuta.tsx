import { Card } from "@/components/ui";

interface InfoRutaProps {
  estado: string;
  patente?: string;
  totalDespachos: number;
  despachosEntregados: number;
  getEstadoBadgeColor: (estado: string) => string;
}

export function InfoRuta({
  estado,
  patente,
  totalDespachos,
  despachosEntregados,
  getEstadoBadgeColor,
}: InfoRutaProps) {
  return (
    <Card className="mb-4 md:mb-6 border-2 border-gray-200 bg-white" padding="md">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
        <div>
          <p className="text-xs md:text-sm text-gray-500 mb-1">Estado</p>
          <span
            className={`inline-block px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-semibold rounded-full ${getEstadoBadgeColor(
              estado
            )}`}
          >
            {estado.toUpperCase()}
          </span>
        </div>
        {patente && (
          <div>
            <p className="text-xs md:text-sm text-gray-500 mb-1">Patente</p>
            <p className="font-bold text-sm md:text-base text-gray-900 uppercase">
              {patente}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs md:text-sm text-gray-500 mb-1">Total Despachos</p>
          <p className="font-bold text-sm md:text-base text-orange-600">
            {totalDespachos}
          </p>
        </div>
        <div>
          <p className="text-xs md:text-sm text-gray-500 mb-1">Entregados</p>
          <p className="font-bold text-sm md:text-base text-green-600">
            {despachosEntregados}
          </p>
        </div>
      </div>
    </Card>
  );
}
