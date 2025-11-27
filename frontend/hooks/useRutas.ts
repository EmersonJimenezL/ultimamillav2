import { useState } from "react";
import { rutaService, type Ruta } from "@/services/rutaService";
import { despachoService } from "@/services/despachoService";

export function useRutas() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [entregando, setEntregando] = useState<string | null>(null);

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

  const handleMarcarEntregado = async (
    despachoId: string,
    folioNum: string
  ) => {
    if (
      !confirm(`¿Marcar el despacho ${folioNum} como entregado?

Nota: Podrás agregar los datos del receptor después.`)
    ) {
      return;
    }

    try {
      setEntregando(despachoId);
      await despachoService.marcarEntregado(despachoId);
      alert(`Despacho ${folioNum} marcado como entregado`);
      await loadRutas();
    } catch (err: any) {
      alert(`Error: ${err.message || "Error al marcar como entregado"}`);
    } finally {
      setEntregando(null);
    }
  };

  return {
    rutas,
    loading,
    error,
    cancelando,
    entregando,
    loadRutas,
    handleCancelar,
    handleMarcarEntregado,
  };
}
