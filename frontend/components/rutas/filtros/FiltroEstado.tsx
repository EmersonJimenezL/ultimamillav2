interface EstadoContador {
  todas: number;
  pendiente: number;
  iniciada: number;
  finalizada: number;
  cancelada: number;
}

interface FiltroEstadoProps {
  estadoActual: string;
  contadores: EstadoContador;
  onEstadoChange: (estado: string) => void;
}

export function FiltroEstado({
  estadoActual,
  contadores,
  onEstadoChange,
}: FiltroEstadoProps) {
  const estados = [
    {
      id: "todas",
      label: "Todas",
      icon: "",
      activeColor: "bg-gray-900 text-white",
      inactiveColor: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
    {
      id: "pendiente",
      label: "Pendientes",
      icon: "⏳",
      activeColor: "bg-yellow-500 text-white",
      inactiveColor: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    },
    {
      id: "iniciada",
      label: "En Curso",
      icon: "🚚",
      activeColor: "bg-blue-500 text-white",
      inactiveColor: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    },
    {
      id: "finalizada",
      label: "Finalizadas",
      icon: "✅",
      activeColor: "bg-green-500 text-white",
      inactiveColor: "bg-green-100 text-green-800 hover:bg-green-200",
    },
    {
      id: "cancelada",
      label: "Canceladas",
      icon: "❌",
      activeColor: "bg-red-500 text-white",
      inactiveColor: "bg-red-100 text-red-800 hover:bg-red-200",
    },
  ];

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-2 flex flex-wrap gap-2">
      {estados.map((estado) => (
        <button
          key={estado.id}
          onClick={() => onEstadoChange(estado.id)}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
            estadoActual === estado.id
              ? estado.activeColor
              : estado.inactiveColor
          }`}
        >
          {estado.icon && `${estado.icon} `}
          {estado.label} ({contadores[estado.id as keyof EstadoContador]})
        </button>
      ))}
    </div>
  );
}
