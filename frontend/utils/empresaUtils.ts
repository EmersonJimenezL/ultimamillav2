import type { EmpresaReparto } from "@/services/empresaService";

function normalizeRut(rut: string) {
  return rut.replace(/[.\-\s]/g, "").toUpperCase();
}

export function isEmpresaPropia(empresa?: EmpresaReparto | null): boolean {
  if (!empresa) return false;

  const rutPropio = process.env.NEXT_PUBLIC_EMPRESA_PROPIA_RUT;
  if (rutPropio && normalizeRut(empresa.rut) === normalizeRut(rutPropio)) {
    return true;
  }

  const nombrePropio = process.env.NEXT_PUBLIC_EMPRESA_PROPIA_NOMBRE?.toLowerCase();
  if (nombrePropio && empresa.razonSocial.toLowerCase().includes(nombrePropio)) {
    return true;
  }

  return empresa.razonSocial.toLowerCase().includes("vivipra");
}

