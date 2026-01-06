import type { EmpresaReparto } from "@/services/empresaService";

function normalizeRut(rut: string) {
  return rut.replace(/[.\-\s]/g, "").toUpperCase();
}

export function isEmpresaPropia(empresa?: Partial<EmpresaReparto> | null): boolean {
  if (!empresa) return false;

  const rutPropio = process.env.NEXT_PUBLIC_EMPRESA_PROPIA_RUT;
  if (rutPropio && empresa.rut && normalizeRut(empresa.rut) === normalizeRut(rutPropio)) {
    return true;
  }

  const nombrePropio = process.env.NEXT_PUBLIC_EMPRESA_PROPIA_NOMBRE?.toLowerCase();
  if (nombrePropio && String(empresa.razonSocial || "").toLowerCase().includes(nombrePropio)) {
    return true;
  }

  return String(empresa.razonSocial || "").toLowerCase().includes("vivipra");
}
