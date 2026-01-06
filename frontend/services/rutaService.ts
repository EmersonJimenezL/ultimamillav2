// Servicio para gestionar rutas

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface DespachoConEntrega {
  _id: string;
  FolioNum: number;
  CardName: string;
  CardCode: string;
  Address2: string;
  Comments?: string;
  estado: "pendiente" | "asignado" | "entregado" | "no_entregado" | "cancelado" | string;
  entrega?: {
    receptorNombre?: string;
    receptorApellido?: string;
    receptorRut?: string;
    fechaEntrega?: string;
    fotoEntrega?: string;
  };
  noEntrega?: {
    motivo?: string;
    observacion?: string;
    fechaNoEntrega?: string;
    fotoEvidencia?: string;
  };
}

export interface Ruta {
  _id: string;
  numeroRuta?: string; // Generado automáticamente por el backend
  empresaReparto: string | { _id: string; razonSocial: string; nombre: string };
  conductor: string;
  nombreConductor?: string;
  patente?: string; // Opcional: se completa cuando el chofer inicia la ruta
  esChoferExterno?: boolean; // Indica si el chofer es externo
  despachos: string[] | DespachoConEntrega[];
  asignadoPor: string;
  estado: "iniciada" | "pausada" | "pendiente" | "finalizada" | "cancelada";
  asignadoEl: Date;
  fechaInicio?: Date; // Se completa cuando el chofer inicia la ruta
  fechaFinalizacion?: Date;
  tiempoTranscurrido?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RutaResponse {
  status: string;
  data: Ruta | Ruta[];
  count?: number;
}

export interface CancelarRutaResponse {
  status: string;
  message: string;
  data: {
    ruta: Ruta;
    despachosLiberados: number;
  };
}

class RutaService {
  private getAuthHeader(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Obtener todas las rutas
  async getAll(): Promise<Ruta[]> {
    const response = await fetch(`${API_URL}/api/rutas`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener rutas (${response.status})`);
    }

    const data: RutaResponse = await response.json();
    return Array.isArray(data.data) ? data.data : [];
  }

  // Obtener rutas para el chofer/empresa logueada
  async getMine(): Promise<Ruta[]> {
    const response = await fetch(`${API_URL}/api/rutas/mis-rutas`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener rutas (${response.status})`);
    }

    const data: RutaResponse = await response.json();
    return Array.isArray(data.data) ? data.data : [];
  }

  // Obtener una ruta por ID
  async getById(id: string): Promise<Ruta> {
    const response = await fetch(`${API_URL}/api/rutas/${id}`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Error al obtener ruta");
    }

    const data: RutaResponse = await response.json();
    return data.data as Ruta;
  }

  // Crear una nueva ruta
  async create(ruta: Partial<Ruta>): Promise<Ruta> {
    const response = await fetch(`${API_URL}/api/rutas`, {
      method: "POST",
      headers: this.getAuthHeader(),
      body: JSON.stringify(ruta),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al crear ruta");
    }

    const data: RutaResponse = await response.json();
    return data.data as Ruta;
  }

  // Actualizar una ruta
  async update(id: string, ruta: Partial<Ruta>): Promise<Ruta> {
    const response = await fetch(`${API_URL}/api/rutas/${id}`, {
      method: "PUT",
      headers: this.getAuthHeader(),
      body: JSON.stringify(ruta),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar ruta");
    }

    const data: RutaResponse = await response.json();
    return data.data as Ruta;
  }

  // Iniciar una ruta (chofer)
  async iniciar(
    id: string,
    patente: string,
    nombreConductor?: string
  ): Promise<Ruta> {
    const response = await fetch(`${API_URL}/api/rutas/${id}/iniciar`, {
      method: "POST",
      headers: this.getAuthHeader(),
      body: JSON.stringify({ patente, nombreConductor }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al iniciar ruta");
    }

    const data = await response.json();
    return data.data;
  }

  // Finalizar una ruta (chofer)
  async finalizar(id: string): Promise<Ruta> {
    const response = await fetch(`${API_URL}/api/rutas/${id}/finalizar`, {
      method: "POST",
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al finalizar ruta");
    }

    const data = await response.json();
    return data.data;
  }

  // Cancelar una ruta
  async cancelar(id: string): Promise<CancelarRutaResponse> {
    const response = await fetch(`${API_URL}/api/rutas/${id}/cancelar`, {
      method: "POST",
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al cancelar ruta");
    }

    return (await response.json()) as CancelarRutaResponse;
  }

  // Eliminar una ruta
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/rutas/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Error al eliminar ruta");
    }
  }
}

export const rutaService = new RutaService();
