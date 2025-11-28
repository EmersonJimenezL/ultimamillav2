import { useState, useMemo } from "react";
import { despachoService, type Despacho } from "@/services/despachoService";

export function useDespachos() {
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  const loadDespachos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await despachoService.getAll();
      setDespachos(data);
    } catch (error) {
      console.error("Error al cargar despachos:", error);
      setError("Error al cargar despachos");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      await despachoService.sincronizar();
      await loadDespachos();
    } catch (error) {
      console.error("Error al sincronizar:", error);
      setError("Error al sincronizar despachos");
    } finally {
      setSyncing(false);
    }
  };

  const despachosFiltrados = useMemo(() => {
    // 1. Limpiamos el término de búsqueda una sola vez para no repetirlo en el loop
    const term = searchTerm ? searchTerm.toString().toLowerCase().trim() : "";

    return despachos.filter((despacho) => {
      // Excluir despachos asignados
      if (despacho.estado === "asignado") return false;

      // 2. Validación de Estado
      const matchEstado =
        filterEstado === "todos" || despacho.estado === filterEstado;

      if (!matchEstado) return false; // Optimización: Si no cumple el estado, no gastamos recursos buscando

      // 3. Búsqueda Segura (Manejo de nulls y conversión a string explícita)
      const folioStr = despacho.FolioNum ? despacho.FolioNum.toString() : "";
      const cardNameStr = despacho.CardName
        ? despacho.CardName.toLowerCase()
        : "";
      const cardCodeStr = despacho.CardCode
        ? despacho.CardCode.toLowerCase()
        : "";
      const addressStr = despacho.Address2
        ? despacho.Address2.toLowerCase()
        : "";

      const matchSearch =
        folioStr.includes(term) ||
        cardNameStr.includes(term) ||
        cardCodeStr.includes(term) ||
        addressStr.includes(term);

      return matchSearch;
    });
  }, [despachos, searchTerm, filterEstado]);

  const estadoCounts = useMemo(
    () => ({
      pendiente: despachos.filter((d) => d.estado === "pendiente").length,
      entregado: despachos.filter((d) => d.estado === "entregado").length,
      cancelado: despachos.filter((d) => d.estado === "cancelado").length,
    }),
    [despachos]
  );

  return {
    despachos,
    loading,
    syncing,
    error,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    despachosFiltrados,
    estadoCounts,
    loadDespachos,
    handleSync,
  };
}
