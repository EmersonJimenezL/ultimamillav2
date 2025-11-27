interface FiltroChoferProps {
  choferes: string[];
  choferActual: string;
  onChoferChange: (chofer: string) => void;
}

export function FiltroChofer({
  choferes,
  choferActual,
  onChoferChange,
}: FiltroChoferProps) {
  if (choferes.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
      <label
        htmlFor="filtro-chofer"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Filtrar por Conductor
      </label>
      <select
        id="filtro-chofer"
        value={choferActual}
        onChange={(e) => onChoferChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="todos">Todos los conductores ({choferes.length})</option>
        {choferes.map((chofer) => (
          <option key={chofer} value={chofer}>
            {chofer}
          </option>
        ))}
      </select>
    </div>
  );
}
