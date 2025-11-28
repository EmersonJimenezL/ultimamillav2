/**
 * Utilidades para trabajar con Google Maps
 */

/**
 * Abre una dirección individual en Google Maps
 */
export function abrirEnMapa(direccion: string) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    direccion
  )}`;
  window.open(url, "_blank");
}

/**
 * Abre una ruta completa con múltiples puntos en Google Maps
 * @param direcciones Array de direcciones para crear la ruta
 */
export function abrirRutaCompleta(direcciones: string[]) {
  if (direcciones.length === 0) {
    alert("No hay direcciones válidas para mostrar en el mapa");
    return;
  }

  // Si solo hay una dirección, abrir directamente
  if (direcciones.length === 1) {
    abrirEnMapa(direcciones[0]);
    return;
  }

  // Para múltiples direcciones, crear URL con waypoints
  const origen = encodeURIComponent(direcciones[0]);
  const destino = encodeURIComponent(direcciones[direcciones.length - 1]);

  // Los puntos intermedios (máximo 9 waypoints permitidos por Google Maps)
  const waypoints = direcciones
    .slice(1, -1)
    .slice(0, 9) // Google Maps permite máximo 9 waypoints
    .map((dir) => encodeURIComponent(dir))
    .join("|");

  const url = waypoints
    ? `https://www.google.com/maps/dir/?api=1&origin=${origen}&destination=${destino}&waypoints=${waypoints}`
    : `https://www.google.com/maps/dir/?api=1&origin=${origen}&destination=${destino}`;

  window.open(url, "_blank");
}

/**
 * Extrae direcciones válidas de un array de despachos
 */
export function extraerDireccionesValidas(despachos: any[]): string[] {
  if (!Array.isArray(despachos)) return [];

  return despachos
    .filter((d: any) => typeof d === "object" && d !== null && d.Address2)
    .map((d: any) => d.Address2);
}
