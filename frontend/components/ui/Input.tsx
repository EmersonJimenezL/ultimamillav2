// Componente Input reutilizable con label y mensajes de error
import { InputHTMLAttributes, forwardRef } from "react";

// Interfaz para las props del input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

// forwardRef permite que componentes padres accedan al elemento input
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    // Estilos base del input
    const baseStyles =
      "w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed text-black placeholder:text-gray-400";

    // Estilos condicionales según el estado
    const stateStyles = error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-primary-500 focus:ring-primary-500";

    const inputClasses = `${baseStyles} ${stateStyles} ${className}`.trim();

    return (
      <div className="w-full">
        {/* Label opcional */}
        {label && (
          <label className="block text-sm font-medium text-black mb-1">
            {label}
            {props.required && <span className="text-primary-500 ml-1">*</span>}
          </label>
        )}

        {/* Input */}
        <input ref={ref} className={inputClasses} {...props} />

        {/* Mensaje de error o helper text */}
        {error && (
          <p className="mt-1 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="mt-1 text-sm text-dark-500">{helperText}</p>
        )}
      </div>
    );
  }
);

// Nombre para debugging en React DevTools
Input.displayName = "Input";
