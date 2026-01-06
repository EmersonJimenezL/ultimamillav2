import { Card } from "@/components/ui";
import { DespachoCard } from "./DespachoCard";
import type { DespachoConEntrega } from "@/services/rutaService";

interface DespachosListaProps {
  despachos: DespachoConEntrega[];
  rutaEstado: string;
  onEntregarDespacho: (despacho: DespachoConEntrega) => void;
}

export function DespachosLista({
  despachos,
  rutaEstado,
  onEntregarDespacho,
}: DespachosListaProps) {
  if (despachos.length === 0) {
    return (
      <Card className="text-center py-12 md:py-16 bg-white">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-gray-500 text-sm md:text-base">
          No hay despachos en esta ruta
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 xl:gap-5 lg:space-y-0">
      {despachos.map((despacho, index: number) => (
        <DespachoCard
          key={despacho._id}
          despacho={despacho}
          index={index}
          rutaEstado={rutaEstado}
          onEntregar={onEntregarDespacho}
        />
      ))}
    </div>
  );
}
