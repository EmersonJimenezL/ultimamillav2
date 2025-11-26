import { Card } from "@/components/ui";

interface DespachoConEntrega {
  entrega?: {
    fechaEntrega: string;
  };
}

interface MetricasTiempoProps {
  asignadoEl?: Date | string;
  fechaInicio?: Date | string;
  fechaFinalizacion?: Date | string;
  despachos: DespachoConEntrega[];
}

export function MetricasTiempo({
  asignadoEl,
  fechaInicio,
  fechaFinalizacion,
  despachos,
}: MetricasTiempoProps) {
  const despachosConEntrega = despachos.filter(
    (d) => d.entrega?.fechaEntrega
  );

  // Si no hay datos de tiempo, no mostrar nada
  if (!fechaInicio && !fechaFinalizacion && despachosConEntrega.length === 0) {
    return null;
  }

  return (
    <Card
      className="mb-4 md:mb-6 border-2 border-blue-200 bg-blue-50"
      padding="md"
    >
      <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span>⏱️</span> Métricas de Tiempo
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        {asignadoEl && (
          <MetricaAsignada fecha={asignadoEl} />
        )}

        {fechaInicio && (
          <MetricaIniciada fecha={fechaInicio} />
        )}

        {asignadoEl && fechaInicio && (
          <MetricaPreparacion
            asignadoEl={asignadoEl}
            fechaInicio={fechaInicio}
          />
        )}

        {fechaInicio && despachosConEntrega.length > 0 && (
          <MetricaPrimeraEntrega
            fechaInicio={fechaInicio}
            despachos={despachosConEntrega}
          />
        )}

        {/* Tiempo transcurrido actual (si está iniciada pero no finalizada) */}
        {fechaInicio && !fechaFinalizacion && (
          <MetricaTiempoTranscurrido fechaInicio={fechaInicio} />
        )}

        {fechaFinalizacion && (
          <MetricaFinalizada fecha={fechaFinalizacion} />
        )}

        {fechaInicio && fechaFinalizacion && (
          <MetricaDuracionTotal
            fechaInicio={fechaInicio}
            fechaFinalizacion={fechaFinalizacion}
          />
        )}

        {fechaInicio && despachosConEntrega.length > 0 && (
          <MetricaPromedio
            fechaInicio={fechaInicio}
            despachos={despachosConEntrega}
          />
        )}
      </div>
    </Card>
  );
}

function MetricaAsignada({ fecha }: { fecha: Date | string }) {
  return (
    <div className="p-2 md:p-3 bg-white rounded-lg border border-blue-200">
      <p className="text-xs text-gray-600 mb-1">📋 Asignada</p>
      <p className="font-bold text-xs md:text-sm text-gray-900">
        {new Date(fecha).toLocaleString("es-CL", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

function MetricaIniciada({ fecha }: { fecha: Date | string }) {
  return (
    <div className="p-2 md:p-3 bg-white rounded-lg border border-green-200">
      <p className="text-xs text-gray-600 mb-1">🚀 Iniciada</p>
      <p className="font-bold text-xs md:text-sm text-gray-900">
        {new Date(fecha).toLocaleString("es-CL", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

function MetricaPreparacion({
  asignadoEl,
  fechaInicio,
}: {
  asignadoEl: Date | string;
  fechaInicio: Date | string;
}) {
  const minutosHastaIniciar = Math.floor(
    (new Date(fechaInicio).getTime() - new Date(asignadoEl).getTime()) /
      (1000 * 60)
  );

  return (
    <div className="p-2 md:p-3 bg-white rounded-lg border border-orange-200">
      <p className="text-xs text-gray-600 mb-1">⏳ Tiempo de preparación</p>
      <p className="font-bold text-xs md:text-sm text-orange-600">
        {minutosHastaIniciar} min
      </p>
    </div>
  );
}

function MetricaPrimeraEntrega({
  fechaInicio,
  despachos,
}: {
  fechaInicio: Date | string;
  despachos: DespachoConEntrega[];
}) {
  const primeraEntrega = [...despachos].sort(
    (a, b) =>
      new Date(a.entrega!.fechaEntrega).getTime() -
      new Date(b.entrega!.fechaEntrega).getTime()
  )[0];

  if (!primeraEntrega) return null;

  const minutosHastaPrimeraEntrega = Math.floor(
    (new Date(primeraEntrega.entrega!.fechaEntrega).getTime() -
      new Date(fechaInicio).getTime()) /
      (1000 * 60)
  );

  return (
    <div className="p-2 md:p-3 bg-white rounded-lg border border-purple-200">
      <p className="text-xs text-gray-600 mb-1">🎯 Tiempo a 1ª entrega</p>
      <p className="font-bold text-xs md:text-sm text-purple-600">
        {minutosHastaPrimeraEntrega} min
      </p>
    </div>
  );
}

function MetricaFinalizada({ fecha }: { fecha: Date | string }) {
  return (
    <div className="p-2 md:p-3 bg-white rounded-lg border border-red-200">
      <p className="text-xs text-gray-600 mb-1">🏁 Finalizada</p>
      <p className="font-bold text-xs md:text-sm text-gray-900">
        {new Date(fecha).toLocaleString("es-CL", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

function MetricaDuracionTotal({
  fechaInicio,
  fechaFinalizacion,
}: {
  fechaInicio: Date | string;
  fechaFinalizacion: Date | string;
}) {
  const duracionTotal = Math.floor(
    (new Date(fechaFinalizacion).getTime() -
      new Date(fechaInicio).getTime()) /
      (1000 * 60)
  );
  const horas = Math.floor(duracionTotal / 60);
  const minutos = duracionTotal % 60;

  return (
    <div className="p-2 md:p-3 bg-white rounded-lg border border-green-200">
      <p className="text-xs text-gray-600 mb-1">⌛ Duración total</p>
      <p className="font-bold text-xs md:text-sm text-green-600">
        {horas > 0 ? `${horas}h ${minutos}min` : `${minutos} min`}
      </p>
    </div>
  );
}

function MetricaTiempoTranscurrido({ fechaInicio }: { fechaInicio: Date | string }) {
  const ahora = new Date();
  const tiempoTranscurrido = Math.floor(
    (ahora.getTime() - new Date(fechaInicio).getTime()) / (1000 * 60)
  );
  const horas = Math.floor(tiempoTranscurrido / 60);
  const minutos = tiempoTranscurrido % 60;

  return (
    <div className="p-2 md:p-3 bg-white rounded-lg border border-yellow-200 animate-pulse">
      <p className="text-xs text-gray-600 mb-1">🔄 Tiempo transcurrido</p>
      <p className="font-bold text-xs md:text-sm text-yellow-600">
        {horas > 0 ? `${horas}h ${minutos}min` : `${minutos} min`}
      </p>
    </div>
  );
}

function MetricaPromedio({
  fechaInicio,
  despachos,
}: {
  fechaInicio: Date | string;
  despachos: DespachoConEntrega[];
}) {
  const ultimaEntrega = [...despachos].sort(
    (a, b) =>
      new Date(b.entrega!.fechaEntrega).getTime() -
      new Date(a.entrega!.fechaEntrega).getTime()
  )[0];

  if (!ultimaEntrega) return null;

  const tiempoTotal = Math.floor(
    (new Date(ultimaEntrega.entrega!.fechaEntrega).getTime() -
      new Date(fechaInicio).getTime()) /
      (1000 * 60)
  );
  const promedio = Math.floor(tiempoTotal / despachos.length);

  return (
    <div className="p-2 md:p-3 bg-white rounded-lg border border-indigo-200">
      <p className="text-xs text-gray-600 mb-1">📊 Promedio por entrega</p>
      <p className="font-bold text-xs md:text-sm text-indigo-600">
        {promedio} min
      </p>
    </div>
  );
}
