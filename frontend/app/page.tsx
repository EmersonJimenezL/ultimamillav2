"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button, Input, Card } from "@/components/ui";

export default function Home() {
  const { login } = useAuth();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userData = await login({ usuario, password });

      // Redirigir según el rol del usuario
      if (userData?.rol?.includes("chofer")) {
        window.location.href = "/chofer";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err?.message || "Usuario o contraseña incorrectos");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <Card className="w-full max-w-md border border-gray-100" shadow="lg">
        {/* Logo o nombre de la app */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-linear-to-br from-primary-400 to-primary-600 rounded-lg mb-4 shadow-lg">
            <span className="text-3xl">🚚</span>
          </div>
          <h1 className="text-3xl font-bold text-black">Última Milla</h1>
          <p className="text-gray-600 mt-2">Sistema de gestión de despachos</p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div
            className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
            role="alert"
          >
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="usuario"
            label="Usuario"
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Ingrese su usuario"
          />

          <Input
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Ingrese su contraseña"
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Iniciar Sesión
          </Button>
        </form>
      </Card>
    </div>
  );
}
