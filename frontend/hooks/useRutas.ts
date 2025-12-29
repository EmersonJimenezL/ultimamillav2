import { useState } from "react";
import { rutaService, type Ruta } from "@/services/rutaService";

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
    } catch (err: any) {
      setError(err.message || "Error al cargar rutas");
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
    } catch (err: any) {
      setError(err.message || "Error al cancelar ruta");
      alert(`Error: ${err.message}`);
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

