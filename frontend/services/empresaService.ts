// Servicio para gestionar empresas de reparto

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface EmpresaReparto {
  _id: string;
  rut: string;
  razonSocial: string;
  usuarioCuenta?: string;
  contacto: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmpresaResponse {
  status: string;
  data: EmpresaReparto[];
  count: number;
}

class EmpresaService {
  private getAuthHeader(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Obtener todas las empresas
  async getAll(): Promise<EmpresaReparto[]> {
    const response = await fetch(`${API_URL}/api/empresas`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener empresas (${response.status})`);
    }

    const data: EmpresaResponse = await response.json();
    return data.data;
  }

  // Obtener una empresa por ID
  async getById(id: string): Promise<EmpresaReparto> {
    const response = await fetch(`${API_URL}/api/empresas/${id}`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Error al obtener empresa");
    }

    const data = await response.json();
    return data.data;
  }

  // Crear una nueva empresa
  async create(empresa: Partial<EmpresaReparto>): Promise<EmpresaReparto> {
    const response = await fetch(`${API_URL}/api/empresas`, {
      method: "POST",
      headers: this.getAuthHeader(),
      body: JSON.stringify(empresa),
    });

    if (!response.ok) {
      throw new Error("Error al crear empresa");
    }

    const data = await response.json();
    return data.data;
  }

  // Actualizar una empresa
  async update(id: string, empresa: Partial<EmpresaReparto>): Promise<EmpresaReparto> {
    const response = await fetch(`${API_URL}/api/empresas/${id}`, {
      method: "PUT",
      headers: this.getAuthHeader(),
      body: JSON.stringify(empresa),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar empresa");
    }

    const data = await response.json();
    return data.data;
  }

  // Eliminar una empresa
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/empresas/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Error al eliminar empresa");
    }
  }
}

export const empresaService = new EmpresaService();
