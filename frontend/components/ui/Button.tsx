// Componente Button reutilizable con variantes y tamaños
import { ButtonHTMLAttributes, ReactNode } from "react";

// Interfaz para las props del botón
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  // Base: estilos compartidos por todos los botones
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  // Variantes: estilos específicos según el tipo de botón
  const variants = {
    primary:
      "bg-linear-to-r from-orange-400 via-orange-500 to-red-500 text-white shadow-lg hover:shadow-2xl hover:from-orange-500 hover:via-orange-600 hover:to-red-600 transform hover:scale-105 transition-all",
    secondary:
      "bg-gray-200 text-gray-900 shadow hover:bg-gray-300 border border-gray-300",
    outline: "border-2 border-orange-500 text-gray-900 hover:bg-orange-50",
    ghost: "text-gray-900 hover:bg-gray-100",
    danger:
      "bg-linear-to-r from-red-500 to-red-700 text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-800",
  };

  // Tamaños: padding y font-size según el tamaño
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  // Combina todas las clases
  const buttonClasses = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? "w-full" : ""}
    ${className}
  `.trim();

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Cargando...
        </>
      ) : (
        children
      )}
    </button>
  );
}
