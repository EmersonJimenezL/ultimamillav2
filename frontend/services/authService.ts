// Importa las interfaces de tipos para validación
import { LoginCredentials, LoginResponse } from "@/types/auth.types";

// URL base del API - Lee desde variables de entorno o usa fallback
// NEXT_PUBLIC_ permite que la variable sea accesible en el cliente
const API_URL = `${process.env.NEXT_PUBLIC_URLMONGO}${process.env.NEXT_PUBLIC_PREFIJOLOGIN}`;

// Función asíncrona para hacer login
// async/await: maneja operaciones asíncronas de forma más legible
// Promise<LoginResponse>: indica que retorna una promesa que resuelve a LoginResponse
export const login = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    // fetch: API nativa del navegador para hacer peticiones HTTP
    const response = await fetch(API_URL, {
      method: "POST", // Método HTTP POST para enviar datos
      headers: {
        "Content-Type": "application/json", // Indica que enviamos JSON
      },
      body: JSON.stringify(credentials), // Convierte objeto JS a JSON string
    });

    // response.ok: true si status 200-299, false en otro caso
    if (!response.ok) {
      const error = await response.json(); // Extrae mensaje de error del servidor
      throw new Error(error.message || "Error al iniciar sesión");
    }

    // Convierte la respuesta JSON a objeto JavaScript
    // TypeScript valida que coincida con LoginResponse
    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    // Propaga el error para que sea manejado por quien llame esta función
    throw error;
  }
};

// Función para cerrar sesión en el servidor
// Promise<void>: async que no retorna valor
export const logout = async (token: string): Promise<void> => {
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: Bearer token es el estándar para JWT
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    // Solo logueamos el error, no lo propagamos
    // Porque logout debe funcionar aunque el servidor falle
    console.error("Error al cerrar sesión:", error);
  }
};
