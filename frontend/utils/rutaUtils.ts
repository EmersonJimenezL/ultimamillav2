/**
 * Utilidades para manejo de rutas
 */

/**
 * Obtiene el color del badge según el estado de la ruta
 */
export function getEstadoBadgeColor(estado: string): string {
  const colores: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    iniciada: "bg-blue-100 text-blue-800",
    finalizada: "bg-green-100 text-green-800",
    cancelada: "bg-red-100 text-red-800",
    pausada: "bg-orange-100 text-orange-800",
  };

  return colores[estado] || "bg-gray-100 text-gray-800";
}

/**
 * Obtiene el color del badge según el estado del despacho
 */
export function getDespachoEstadoBadgeColor(estado: string): string {
  const colores: Record<string, string> = {
    disponible: "bg-green-100 text-green-800",
    asignado: "bg-blue-100 text-blue-800",
    entregado: "bg-purple-100 text-purple-800",
    "en ruta": "bg-yellow-100 text-yellow-800",
    cancelado: "bg-red-100 text-red-800",
  };

  return colores[estado] || "bg-gray-100 text-gray-800";
}

/**
 * Formatea un RUT chileno con puntos y guión
 */
export function formatRut(rut: string): string {
  if (!rut) return "";

  // Eliminar puntos y guiones existentes
  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "");

  // Separar número y dígito verificador
  const rutBody = cleanRut.slice(0, -1);
  const rutDv = cleanRut.slice(-1);

  // Formatear con puntos
  const formattedBody = rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${rutDv}`;
}

/**
 * Valida formato de RUT chileno
 */
export function validateRut(rut: string): boolean {
  if (!rut) return false;

  // Eliminar puntos y guiones
  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "");

  // Verificar que tenga al menos 2 caracteres (número + dv)
  if (cleanRut.length < 2) return false;

  const rutBody = cleanRut.slice(0, -1);
  const rutDv = cleanRut.slice(-1).toUpperCase();

  // Verificar que el cuerpo sean solo números
  if (!/^\d+$/.test(rutBody)) return false;

  // Calcular dígito verificador
  let suma = 0;
  let multiplicador = 2;

  for (let i = rutBody.length - 1; i >= 0; i--) {
    suma += parseInt(rutBody[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const dvCalculado = 11 - (suma % 11);
  let dvEsperado: string;

  if (dvCalculado === 11) {
    dvEsperado = "0";
  } else if (dvCalculado === 10) {
    dvEsperado = "K";
  } else {
    dvEsperado = dvCalculado.toString();
  }

  return rutDv === dvEsperado;
}

/**
 * Calcula el tiempo transcurrido desde una fecha hasta ahora
 */
export function calcularTiempoTranscurrido(
  fechaInicio: Date | string
): { horas: number; minutos: number; texto: string } {
  const ahora = new Date();
  const fecha = new Date(fechaInicio);
  const tiempoTranscurridoMin = Math.floor(
    (ahora.getTime() - fecha.getTime()) / (1000 * 60)
  );

  const horas = Math.floor(tiempoTranscurridoMin / 60);
  const minutos = tiempoTranscurridoMin % 60;

  const texto = horas > 0 ? `${horas}h ${minutos}min` : `${minutos} min`;

  return { horas, minutos, texto };
}

/**
 * Calcula la duración entre dos fechas
 */
export function calcularDuracion(
  fechaInicio: Date | string,
  fechaFin: Date | string
): { horas: number; minutos: number; texto: string } {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const duracionMin = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60));

  const horas = Math.floor(duracionMin / 60);
  const minutos = duracionMin % 60;

  const texto = horas > 0 ? `${horas}h ${minutos}min` : `${minutos} min`;

  return { horas, minutos, texto };
}

/**
 * Formatea una fecha en formato chileno
 */
export function formatearFecha(
  fecha: Date | string,
  opciones?: Intl.DateTimeFormatOptions
): string {
  const opcionesPorDefecto: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return new Date(fecha).toLocaleDateString(
    "es-CL",
    opciones || opcionesPorDefecto
  );
}

/**
 * Obtiene el número de ruta formateado
 */
export function getNumeroRuta(numeroRuta?: string, id?: string): string {
  if (numeroRuta) return numeroRuta;
  if (id) return `Ruta ${id.slice(-6)}`;
  return "Sin número";
}
