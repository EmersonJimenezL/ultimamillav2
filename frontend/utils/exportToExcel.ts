import * as XLSX from "xlsx";
import type { Ruta, DespachoConEntrega } from "@/services/rutaService";

export function exportRutasToExcel(rutas: Ruta[]) {
  type ExcelRow = Record<string, string | number>;

  // Crear un array para los datos principales de las rutas
  const rutasData = rutas.map((ruta) => {
    // Filtrar solo despachos que sean objetos (no strings)
    const despachos = Array.isArray(ruta.despachos)
      ? (ruta.despachos.filter((d): d is DespachoConEntrega => typeof d === 'object' && d !== null))
      : [];
    const totalDespachos = despachos.length;
    const despachosEntregados = despachos.filter((d) => d.estado === "entregado").length;

    // Calcular tiempo transcurrido si está iniciada
    let tiempoTranscurrido = "";
    if (ruta.estado === "iniciada" && (ruta.fechaInicio || ruta.asignadoEl)) {
      const ahora = new Date();
      const fechaRef = ruta.fechaInicio || ruta.asignadoEl;
      const minutos = Math.floor(
        (ahora.getTime() - new Date(fechaRef).getTime()) / (1000 * 60)
      );
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      tiempoTranscurrido = horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;
    }

    // Calcular duración total si está finalizada
    let duracionTotal = "";
    if (ruta.fechaInicio && ruta.fechaFinalizacion) {
      const minutos = Math.floor(
        (new Date(ruta.fechaFinalizacion).getTime() -
          new Date(ruta.fechaInicio).getTime()) /
          (1000 * 60)
      );
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      duracionTotal = horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;
    }

    // Obtener nombre de empresa de reparto
    let empresaRepartoNombre = "N/A";
    if (ruta.empresaReparto) {
      if (typeof ruta.empresaReparto === "object" && ruta.empresaReparto.nombre) {
        empresaRepartoNombre = ruta.empresaReparto.nombre;
      } else if (typeof ruta.empresaReparto === "string") {
        empresaRepartoNombre = ruta.empresaReparto;
      }
    }

    return {
      "Número de Ruta": ruta.numeroRuta || `Ruta ${ruta._id.slice(-6)}`,
      "Estado": ruta.estado.toUpperCase(),
      "Conductor": ruta.conductor || "N/A",
      "Patente": ruta.patente || "N/A",
      "Empresa de Reparto": empresaRepartoNombre,
      "Total Despachos": totalDespachos,
      "Despachos Entregados": despachosEntregados,
      "Progreso": totalDespachos > 0 ? `${Math.round((despachosEntregados / totalDespachos) * 100)}%` : "0%",
      "Asignado Por": ruta.asignadoPor || "N/A",
      "Fecha Asignación": new Date(ruta.asignadoEl).toLocaleString("es-CL"),
      "Fecha Inicio": ruta.fechaInicio
        ? new Date(ruta.fechaInicio).toLocaleString("es-CL")
        : "N/A",
      "Fecha Finalización": ruta.fechaFinalizacion
        ? new Date(ruta.fechaFinalizacion).toLocaleString("es-CL")
        : "N/A",
      "Tiempo Transcurrido": tiempoTranscurrido || "N/A",
      "Duración Total": duracionTotal || "N/A",
    };
  });

  // Crear un array para los despachos detallados
  const despachosData: ExcelRow[] = [];
  rutas.forEach((ruta) => {
    if (Array.isArray(ruta.despachos)) {
      ruta.despachos.forEach((despacho) => {
        if (typeof despacho === "object" && despacho !== null) {
          despachosData.push({
            "Número de Ruta": ruta.numeroRuta || `Ruta ${ruta._id.slice(-6)}`,
            "Conductor": ruta.conductor || "N/A",
            "Folio": despacho.FolioNum || "N/A",
            "Cliente": despacho.CardName || "N/A",
            "Dirección": despacho.Address2 || "N/A",
            "Estado Despacho": despacho.estado ? despacho.estado.toUpperCase() : "N/A",
            "Receptor Nombre": despacho.entrega?.receptorNombre || "N/A",
            "Receptor Apellido": despacho.entrega?.receptorApellido || "N/A",
            "Receptor RUT": despacho.entrega?.receptorRut || "N/A",
            "Fecha Entrega": despacho.entrega?.fechaEntrega
              ? new Date(despacho.entrega.fechaEntrega).toLocaleString("es-CL")
              : "N/A",
          });
        }
      });
    }
  });

  // Crear el libro de Excel
  const workbook = XLSX.utils.book_new();

  // Agregar hoja de rutas
  const rutasSheet = XLSX.utils.json_to_sheet(rutasData);

  // Ajustar ancho de columnas para la hoja de rutas
  const rutasColWidths = [
    { wch: 15 }, // Número de Ruta
    { wch: 12 }, // Estado
    { wch: 25 }, // Conductor
    { wch: 10 }, // Patente
    { wch: 20 }, // Empresa de Reparto
    { wch: 15 }, // Total Despachos
    { wch: 20 }, // Despachos Entregados
    { wch: 10 }, // Progreso
    { wch: 20 }, // Asignado Por
    { wch: 20 }, // Fecha Asignación
    { wch: 20 }, // Fecha Inicio
    { wch: 20 }, // Fecha Finalización
    { wch: 18 }, // Tiempo Transcurrido
    { wch: 15 }, // Duración Total
  ];
  rutasSheet["!cols"] = rutasColWidths;

  XLSX.utils.book_append_sheet(workbook, rutasSheet, "Rutas");

  // Agregar hoja de despachos si hay datos
  if (despachosData.length > 0) {
    const despachosSheet = XLSX.utils.json_to_sheet(despachosData);

    // Ajustar ancho de columnas para la hoja de despachos
    const despachosColWidths = [
      { wch: 15 }, // Número de Ruta
      { wch: 25 }, // Conductor
      { wch: 12 }, // Folio
      { wch: 30 }, // Cliente
      { wch: 40 }, // Dirección
      { wch: 15 }, // Estado Despacho
      { wch: 20 }, // Receptor Nombre
      { wch: 20 }, // Receptor Apellido
      { wch: 15 }, // Receptor RUT
      { wch: 20 }, // Fecha Entrega
    ];
    despachosSheet["!cols"] = despachosColWidths;

    XLSX.utils.book_append_sheet(workbook, despachosSheet, "Despachos");
  }

  // Generar el archivo Excel
  const fileName = `Rutas_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
