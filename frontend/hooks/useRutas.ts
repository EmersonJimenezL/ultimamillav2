import { useState } from "react";
import { rutaService, type Ruta } from "@/services/rutaService";
import { getErrorMessage } from "@/utils/errorUtils";

export function useRutas() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

  const loadRutas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rutaService.getAll();
      setRutas(data);
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar rutas"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (rutaId: string, numeroRuta?: string) => {
    if (
      !confirm(
        `¿Estás seguro de cancelar la ruta ${
          numeroRuta || rutaId
        }?\n\nLos despachos no entregados volverán a estar disponibles.`
      )
    ) {
      return;
    }

    try {
      setCancelando(rutaId);
      setError(null);
      const result = await rutaService.cancelar(rutaId);
      alert(
        `Ruta cancelada exitosamente.\n${result.data.despachosLiberados} despachos liberados.`
      );
      await loadRutas();
    } catch (err) {
      const message = getErrorMessage(err, "Error al cancelar ruta");
      setError(message);
      alert(`Error: ${message}`);
    } finally {
      setCancelando(null);
    }
  };

  return {
    rutas,
    loading,
    error,
    cancelando,
    loadRutas,
    handleCancelar,
  };
}
