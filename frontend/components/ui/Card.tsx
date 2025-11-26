// Componente Card reutilizable para contenedores de contenido
import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  padding = "md",
  shadow = "md",
  ...props
}: CardProps) {
  // Estilos base
  const baseStyles = "bg-white rounded-lg";

  // Variantes de padding
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  // Variantes de sombra
  const shadows = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  const cardClasses =
    `${baseStyles} ${paddings[padding]} ${shadows[shadow]} ${className}`.trim();

  return <div className={cardClasses} {...props}>{children}</div>;
}
