import { useState } from "react";
import { rutaService, type Ruta } from "@/services/rutaService";
import { getErrorMessage } from "@/utils/errorUtils";

type ConfirmFn = (message: string) => Promise<boolean>;
type AlertFn = (
  message: string,
  options?: { title?: string; variant?: "info" | "success" | "warning" | "danger" }
) => Promise<void>;

export function useRutas(dialogs: { confirm?: ConfirmFn; alert?: AlertFn } = {}) {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

  if (!dialogs.confirm || !dialogs.alert) {
    throw new Error("useRutas requiere handlers de diálogo (confirm/alert)");
  }

  const confirmFn: ConfirmFn = dialogs.confirm;
  const alertFn: AlertFn = dialogs.alert;

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
    const ok = await confirmFn(
      `¿Estás seguro de cancelar la ruta ${
        numeroRuta || rutaId
      }?\n\nLos despachos no entregados volverán a estar disponibles.`
    );
    if (!ok) {
      return;
    }

    try {
      setCancelando(rutaId);
      setError(null);
      const result = await rutaService.cancelar(rutaId);
      await alertFn(
        `Ruta cancelada exitosamente.\n${result.data.despachosLiberados} despachos liberados.`,
        { variant: "success" }
      );
      await loadRutas();
    } catch (err) {
      const message = getErrorMessage(err, "Error al cancelar ruta");
      setError(message);
      await alertFn(`Error: ${message}`, { title: "Error", variant: "danger" });
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
