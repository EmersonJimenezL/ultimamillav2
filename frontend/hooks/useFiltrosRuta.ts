import { useState, useMemo } from "react";
import { type Ruta } from "@/services/rutaService";

interface EstadoContador {
  todas: number;
  pendiente: number;
  iniciada: number;
  finalizada: number;
  cancelada: number;
}

export function useFiltrosRuta(rutas: Ruta[]) {
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [filtroChofer, setFiltroChofer] = useState<string>("todos");

  // Obtener lista única de choferes
  const choferesUnicos = useMemo(() => {
    const choferes = new Set<string>();
    rutas.forEach((ruta) => {
      if (ruta.conductor) {
        choferes.add(ruta.conductor);
      }
    });
    return Array.from(choferes).sort();
  }, [rutas]);

  // Filtrar rutas según los filtros activos
  const rutasFiltradas = useMemo(() => {
    return rutas.filter((ruta) => {
      // Filtro por estado
      const cumpleEstado =
        filtroEstado === "todas" || ruta.estado === filtroEstado;

      // Filtro por chofer
      const cumpleChofer =
        filtroChofer === "todos" || ruta.conductor === filtroChofer;

      return cumpleEstado && cumpleChofer;
    });
  }, [rutas, filtroEstado, filtroChofer]);

  // Calcular contadores por estado
  const contadores = useMemo<EstadoContador>(() => {
    return {
      todas: rutas.length,
      pendiente: rutas.filter((r) => r.estado === "pendiente").length,
      iniciada: rutas.filter((r) => r.estado === "iniciada").length,
      finalizada: rutas.filter((r) => r.estado === "finalizada").length,
      cancelada: rutas.filter((r) => r.estado === "cancelada").length,
    };
  }, [rutas]);

  return {
    filtroEstado,
    filtroChofer,
    rutasFiltradas,
    choferesUnicos,
    contadores,
    setFiltroEstado,
    setFiltroChofer,
  };
}
