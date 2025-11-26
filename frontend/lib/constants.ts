// ===== CONSTANTES DE CATÁLOGOS =====
// Estas constantes definen valores fijos que se usan en toda la aplicación
// Usarlas evita hardcodear valores y permite reutilizarlas en selects, validaciones, etc.

// Lista de sucursales disponibles en el sistema
// 'as const' hace que TypeScript trate esto como valores literales inmutables
export const SUCURSALES = [
  "Casa Matriz",
  "Sucursal Puerto Montt",
  "Sucursal Antofagasta",
  "Sucursal Talca",
  "Sucursal Centro Puerto",
  "Sucursal Cambio y Soluciones (Peru)",
  "Sucursal Valparaiso",
  "Sucursal Copiapó",
] as const;

// Lista de áreas/gerencias de la empresa
export const AREAS = [
  "GERENCIA COMERCIAL",
  "GERENCIA DE CAMIONES",
  "GERENCIA ADM. Y FINANZAS",
  "GERENCIA POST VENTA ",
  "GERENCIA REPUESTOS",
  "GERENCIA OPERACIONES",
] as const;

// Lista de roles de usuario disponibles
export const ROLES = [
  "admin",
  "gerente",
  "jefe",
  "vendedor",
  "tecnico",
  "usuarioGeneral",
  "subBodega",
  "chofer",
  "adminBodega",
] as const;

// ===== TIPOS DERIVADOS =====
// Estos tipos se generan automáticamente a partir de las constantes
// (typeof ARRAY)[number] extrae el tipo de cada elemento del array

// Tipo para sucursales: "Casa Matriz" | "Sucursal Puerto Montt" | ...
export type Sucursal = (typeof SUCURSALES)[number];

// Tipo para áreas: "GERENCIA COMERCIAL" | "GERENCIA DE CAMIONES" | ...
export type Area = (typeof AREAS)[number];

// Tipo para roles: "admin" | "gerente" | "jefe" | ...
export type Rol = (typeof ROLES)[number];
