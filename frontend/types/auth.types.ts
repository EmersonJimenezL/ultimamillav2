// Importa los tipos desde constants usando path alias '@/'
// '@/' es configurado en tsconfig.json y apunta a la raíz de src/
import { Sucursal, Area, Rol } from "@/lib/constants";

// ===== INTERFACES DE AUTENTICACIÓN =====

// Interface: Define la estructura de un objeto (contrato de datos)
// Se usa para validación de tipos en tiempo de compilación
export interface LoginCredentials {
  usuario: string;
  password: string;
}

// Interface que define la estructura del usuario
// Los arrays se definen con Type[] o Array<Type>
export interface User {
  _id: string;
  usuario: string;
  pnombre: string;
  snombre: string;
  papellido: string;
  sapellido: string;
  email: string;
  sucursal: Sucursal[];
  area: Area[];
  rol: Rol[];
  activo: boolean;
  permisos: Array<string>;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

// Interface para tipar la respuesta del servidor
// Ayuda al autocompletado y evita errores de tipado
// El servidor devuelve el usuario en la propiedad "data", no "user"
export interface LoginResponse {
  status: string;
  message: string;
  token: string;
  data: User;
}

// Interface para el Context API de React
// Define qué propiedades y métodos estarán disponibles globalmente
export interface AuthContextType {
  user: User | null; // Union type: puede ser User o null
  token: string | null;

  // Función asíncrona que recibe LoginCredentials y retorna el usuario
  // Promise<User> indica que es async y devuelve los datos del usuario
  login: (credentials: LoginCredentials) => Promise<User>;

  // Función que no recibe parámetros ni retorna valor
  // () => void es la sintaxis de arrow function en TypeScript
  logout: () => void;

  isAuthenticated: boolean;
  isLoading: boolean;
}
