// Servicio para gestionar usuarios

const REMOTE_URL = process.env.NEXT_PUBLIC_URLMONGO;
const USER_ENDPOINT = process.env.NEXT_PUBLIC_PREFIJOUSER;

export interface User {
  _id: string;
  usuario: string;
  pnombre: string;
  snombre?: string;
  papellido: string;
  sapellido?: string;
  email: string;
  rol: string[];
  activo: boolean;
}

export interface UserResponse {
  status: string;
  data: User[];
  count: number;
}

class UserService {
  private getAuthHeader(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  // Obtener usuarios por rol
  async getByRole(role: string): Promise<User[]> {
    // Llamar directamente al servidor remoto
    const response = await fetch(`${REMOTE_URL}${USER_ENDPOINT}`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener usuarios (${response.status})`);
    }

    const data = await response.json();

    // El endpoint puede devolver un array directamente o un objeto con un campo data
    const users: User[] = Array.isArray(data) ? data : (data.data || []);

    // Filtrar por rol en el frontend
    return users.filter(user =>
      Array.isArray(user.rol) ? user.rol.includes(role) : user.rol === role
    );
  }

  // Obtener todos los choferes
  async getChoferes(): Promise<User[]> {
    return this.getByRole("chofer");
  }
}

export const userService = new UserService();

// Helper para obtener el nombre completo del usuario
export function getNombreCompleto(user: User): string {
  const nombres = [user.pnombre, user.snombre].filter(Boolean).join(" ");
  const apellidos = [user.papellido, user.sapellido].filter(Boolean).join(" ");
  return `${nombres} ${apellidos}`.trim();
}
