// Servicio para gestionar despachos
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface Despacho {
  _id: string;
  FolioNum: number;
  CardCode: string;
  CardName: string;
  DocDate: string;
  CreateTS: number;
  Comments: string;
  ShipToCode: string;
  Address2: string;
  estado: "pendiente" | "asignado" | "entregado" | "no_entregado" | "cancelado";
  entrega?: {
    receptorRut?: string;
    receptorNombre?: string;
    receptorApellido?: string;
    fotoEntrega?: string;
    firmaEntrega?: string;
    documentoExterno?: string;
    fechaEntrega?: string;
  };
  noEntrega?: {
    motivo?: string;
    observacion?: string;
    fotoEvidencia?: string;
    fechaNoEntrega?: string;
  };
  empresaReparto?: {
    _id: string;
    razonSocial: string;
  };
  rutaAsignada?: {
    _id: string;
    conductor: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DespachoResponse {
  status: string;
  data: Despacho[];
  count: number;
}

class DespachoService {
  private getAuthHeader(): HeadersInit {
    // Verificar que estamos en el cliente antes de acceder a localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Obtener todos los despachos
  async getAll(): Promise<Despacho[]> {
    const response = await fetch(`${API_URL}/api/despachos`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener despachos (${response.status})`);
    }

    const data: DespachoResponse = await response.json();
    return data.data;
  }

  // Obtener solo despachos pendientes
  async getPendientes(): Promise<Despacho[]> {
    const despachos = await this.getAll();
    return despachos.filter((d) => d.estado === "pendiente");
  }

  // Obtener un despacho por ID
  async getById(id: string): Promise<Despacho> {
    const response = await fetch(`${API_URL}/api/despachos/${id}`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Error al obtener despacho");
    }

    const data = await response.json();
    return data.data;
  }

  // Actualizar estado de un despacho
  async updateEstado(
    id: string,
    estado: "pendiente" | "asignado" | "entregado" | "no_entregado" | "cancelado"
  ): Promise<Despacho> {
    const response = await fetch(`${API_URL}/api/despachos/${id}`, {
      method: "PUT",
      headers: this.getAuthHeader(),
      body: JSON.stringify({ estado }),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar estado del despacho");
    }

    const data = await response.json();
    return data.data;
  }

  // Entregar despacho con datos del receptor y foto (para chofer)
  async entregarConFoto(
    id: string,
    receptorRut: string,
    receptorNombre: string,
    receptorApellido: string,
    fotoEntrega: string,
    firmaEntrega: string
  ): Promise<Despacho> {
    const response = await fetch(`${API_URL}/api/despachos/${id}/entregar-chofer`, {
      method: "POST",
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        receptorRut,
        receptorNombre,
        receptorApellido,
        fotoEntrega,
        firmaEntrega,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al entregar despacho");
    }

    const data = await response.json();
    return data.data;
  }

  // Marcar despacho como no entregado con motivo y evidencia (para chofer)
  async marcarNoEntregadoConEvidencia(
    id: string,
    motivo: string,
    fotoEvidencia: string,
    observacion?: string
  ): Promise<Despacho> {
    const response = await fetch(`${API_URL}/api/despachos/${id}/no-entregado-chofer`, {
      method: "POST",
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        motivo,
        observacion,
        fotoEvidencia,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al marcar despacho como no entregado");
    }

    const data = await response.json();
    return data.data;
  }

  
  // Entregar despacho en meson (admin/bodega)
  async entregarEnMeson(
    id: string,
    receptorRut?: string,
    receptorNombre?: string,
    receptorApellido?: string,
    firmaEntrega?: string
  ): Promise<Despacho> {
    const response = await fetch(`${API_URL}/api/despachos/${id}/entregar-meson`, {
      method: "POST",
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        receptorRut,
        receptorNombre,
        receptorApellido,
        firmaEntrega,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al entregar en meson");
    }

    const data = await response.json();
    return data.data;
  }
// Actualizar datos de entrega (para admin/bodega después de recibir info de empresa externa)
  async actualizarDatosEntrega(
    id: string,
    receptorRut?: string,
    receptorNombre?: string,
    receptorApellido?: string,
    fotoEntrega?: string
  ): Promise<Despacho> {
    const response = await fetch(`${API_URL}/api/despachos/${id}/datos-entrega`, {
      method: "PUT",
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        receptorRut,
        receptorNombre,
        receptorApellido,
        fotoEntrega,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al actualizar datos de entrega");
    }

    const data = await response.json();
    return data.data;
  }

  // Forzar sincronización manual (solo admin y adminBodega)
  async sincronizar(): Promise<void> {
    const response = await fetch(`${API_URL}/api/sync/despachos`, {
      method: "POST",
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error("Error al sincronizar despachos");
    }
  }
}

export const despachoService = new DespachoService();

