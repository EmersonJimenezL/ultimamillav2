import { useState, useEffect } from "react";
import { rutaService, type Ruta } from "@/services/rutaService";

export function useRutaChofer(rutaId: string | null) {
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    if (!rutaId) return;
    loadRuta();
  }, [rutaId]);

  const loadRuta = async () => {
    if (!rutaId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await rutaService.getById(rutaId);
      setRuta(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar ruta");
    } finally {
      setLoading(false);
    }
  };

  const finalizarRuta = async () => {
    if (!rutaId || !ruta) return;

    try {
      setFinalizando(true);
      setError(null);
      await rutaService.finalizar(rutaId);
      await loadRuta();
    } catch (err: any) {
      setError(err.message || "Error al finalizar ruta");
      throw err;
    } finally {
      setFinalizando(false);
    }
  };

  return {
    ruta,
    loading,
    error,
    finalizando,
    loadRuta,
    finalizarRuta,
  };
}
