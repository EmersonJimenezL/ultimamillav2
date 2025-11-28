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
    return despachos.filter((despacho) => {
      // Excluir despachos asignados
      if (despacho.estado === "asignado") return false;

      const matchSearch =
        despacho.FolioNum.toString().includes(searchTerm) ||
        despacho.CardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        despacho.CardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        despacho.Address2.toLowerCase().includes(searchTerm.toLowerCase());

      const matchEstado =
        filterEstado === "todos" || despacho.estado === filterEstado;

      return matchSearch && matchEstado;
    });
  }, [despachos, searchTerm, filterEstado]);

  const estadoCounts = useMemo(() => ({
    pendiente: despachos.filter((d) => d.estado === "pendiente").length,
    entregado: despachos.filter((d) => d.estado === "entregado").length,
    cancelado: despachos.filter((d) => d.estado === "cancelado").length,
  }), [despachos]);

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