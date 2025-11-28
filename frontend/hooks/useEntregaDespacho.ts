import { useState, useRef } from "react";
import { despachoService } from "@/services/despachoService";

interface FormData {
  receptorRut: string;
  receptorNombre: string;
  receptorApellido: string;
  fotoPreview: string | null;
}

interface FormErrors {
  rutError: string;
  nombreError: string;
  apellidoError: string;
  fotoError: string;
}

export function useEntregaDespacho() {
  const [formData, setFormData] = useState<FormData>({
    receptorRut: "",
    receptorNombre: "",
    receptorApellido: "",
    fotoPreview: null,
  });

  const [errors, setErrors] = useState<FormErrors>({
    rutError: "",
    nombreError: "",
    apellidoError: "",
    fotoError: "",
  });

  const [entregando, setEntregando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({
      receptorRut: "",
      receptorNombre: "",
      receptorApellido: "",
      fotoPreview: null,
    });
    setErrors({
      rutError: "",
      nombreError: "",
      apellidoError: "",
      fotoError: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatRut = (value: string) => {
    const cleaned = value.replace(/[.-]/g, "");
    const numbers = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    let formatted = "";
    for (let i = numbers.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        formatted = "." + formatted;
      }
      formatted = numbers[i] + formatted;
    }

    return formatted + (dv ? `-${dv}` : "");
  };

  const handleRutChange = (value: string) => {
    const cleaned = value.replace(/[^0-9kK]/g, "");
    if (cleaned.length <= 9) {
      setFormData((prev) => ({ ...prev, receptorRut: cleaned }));
      setErrors((prev) => ({ ...prev, rutError: "" }));
    }
  };

  const handleNombreChange = (value: string) => {
    setFormData((prev) => ({ ...prev, receptorNombre: value }));
    setErrors((prev) => ({ ...prev, nombreError: "" }));
  };

  const handleApellidoChange = (value: string) => {
    setFormData((prev) => ({ ...prev, receptorApellido: value }));
    setErrors((prev) => ({ ...prev, apellidoError: "" }));
  };

  const handleFotoChange = (file: File | null) => {
    if (!file) return;

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        fotoError: "La imagen no debe superar los 5MB",
      }));
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        fotoError: "Solo se permiten archivos de imagen",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, fotoError: "" }));

    // Leer archivo y convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, fotoPreview: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const validarFormulario = (): boolean => {
    const newErrors: FormErrors = {
      rutError: "",
      nombreError: "",
      apellidoError: "",
      fotoError: "",
    };

    let isValid = true;

    if (!formData.receptorRut.trim()) {
      newErrors.rutError = "El RUT del receptor es obligatorio";
      isValid = false;
    } else if (formData.receptorRut.length < 8) {
      newErrors.rutError = "Ingresa un RUT válido";
      isValid = false;
    }

    if (!formData.receptorNombre.trim()) {
      newErrors.nombreError = "El nombre del receptor es obligatorio";
      isValid = false;
    }

    if (!formData.receptorApellido.trim()) {
      newErrors.apellidoError = "El apellido del receptor es obligatorio";
      isValid = false;
    }

    if (!formData.fotoPreview) {
      newErrors.fotoError = "Debes tomar una foto de la entrega";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const entregarDespacho = async (despachoId: string) => {
    if (!validarFormulario()) {
      return false;
    }

    try {
      setEntregando(true);

      await despachoService.entregarConFoto(
        despachoId,
        formData.receptorRut,
        formData.receptorNombre,
        formData.receptorApellido,
        formData.fotoPreview!
      );

      return true;
    } catch (err: any) {
      throw new Error(err.message || "Error al entregar despacho");
    } finally {
      setEntregando(false);
    }
  };

  return {
    formData,
    errors,
    entregando,
    fileInputRef,
    resetForm,
    formatRut,
    handleRutChange,
    handleNombreChange,
    handleApellidoChange,
    handleFotoChange,
    entregarDespacho,
  };
}
