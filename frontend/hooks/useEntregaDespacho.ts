import { useRef, useState } from "react";
import { despachoService } from "@/services/despachoService";

export type TipoGestionDespacho = "entregado" | "no_entregado";

interface FormData {
  tipo: TipoGestionDespacho;
  receptorRut: string;
  receptorNombre: string;
  receptorApellido: string;
  fotoEntregaPreview: string | null;
  firmaEntregaPreview: string | null;
  motivoNoEntrega: string;
  observacionNoEntrega: string;
  fotoEvidenciaPreview: string | null;
}

interface FormErrors {
  motivoError: string;
  rutError: string;
  nombreError: string;
  apellidoError: string;
  fotoEntregaError: string;
  firmaEntregaError: string;
  fotoEvidenciaError: string;
}

export function useEntregaDespacho() {
  const [formData, setFormData] = useState<FormData>({
    tipo: "entregado",
    receptorRut: "",
    receptorNombre: "",
    receptorApellido: "",
    fotoEntregaPreview: null,
    firmaEntregaPreview: null,
    motivoNoEntrega: "",
    observacionNoEntrega: "",
    fotoEvidenciaPreview: null,
  });

  const [errors, setErrors] = useState<FormErrors>({
    motivoError: "",
    rutError: "",
    nombreError: "",
    apellidoError: "",
    fotoEntregaError: "",
    firmaEntregaError: "",
    fotoEvidenciaError: "",
  });

  const [entregando, setEntregando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({
      tipo: "entregado",
      receptorRut: "",
      receptorNombre: "",
      receptorApellido: "",
      fotoEntregaPreview: null,
      firmaEntregaPreview: null,
      motivoNoEntrega: "",
      observacionNoEntrega: "",
      fotoEvidenciaPreview: null,
    });
    setErrors({
      motivoError: "",
      rutError: "",
      nombreError: "",
      apellidoError: "",
      fotoEntregaError: "",
      firmaEntregaError: "",
      fotoEvidenciaError: "",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setTipo = (tipo: TipoGestionDespacho) => {
    setFormData((prev) => ({ ...prev, tipo }));
    setErrors((prev) => ({
      ...prev,
      motivoError: "",
      rutError: "",
      nombreError: "",
      apellidoError: "",
      fotoEntregaError: "",
      firmaEntregaError: "",
      fotoEvidenciaError: "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleMotivoNoEntregaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, motivoNoEntrega: value }));
    setErrors((prev) => ({ ...prev, motivoError: "" }));
  };

  const handleObservacionNoEntregaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, observacionNoEntrega: value }));
  };

  const handleFotoChange = (file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        fotoEntregaError: "La imagen no debe superar los 5MB",
        fotoEvidenciaError: "La imagen no debe superar los 5MB",
      }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        fotoEntregaError: "Solo se permiten archivos de imagen",
        fotoEvidenciaError: "Solo se permiten archivos de imagen",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, fotoEntregaError: "", fotoEvidenciaError: "" }));

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData((prev) =>
        prev.tipo === "entregado"
          ? { ...prev, fotoEntregaPreview: base64 }
          : { ...prev, fotoEvidenciaPreview: base64 }
      );
    };
    reader.readAsDataURL(file);
  };

  const handleFirmaChange = (dataUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      firmaEntregaPreview: dataUrl || null,
    }));
    setErrors((prev) => ({ ...prev, firmaEntregaError: "" }));
  };

  const validarFormulario = (): boolean => {
    const newErrors: FormErrors = {
      motivoError: "",
      rutError: "",
      nombreError: "",
      apellidoError: "",
      fotoEntregaError: "",
      firmaEntregaError: "",
      fotoEvidenciaError: "",
    };

    let isValid = true;

    if (formData.tipo === "entregado") {
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

      if (!formData.fotoEntregaPreview) {
        newErrors.fotoEntregaError = "Debes tomar una foto de la entrega";
        isValid = false;
      }

      if (!formData.firmaEntregaPreview) {
        newErrors.firmaEntregaError = "La firma del receptor es obligatoria";
        isValid = false;
      }
    } else {
      if (!formData.motivoNoEntrega.trim()) {
        newErrors.motivoError = "Debes seleccionar un motivo";
        isValid = false;
      }

      if (!formData.fotoEvidenciaPreview) {
        newErrors.fotoEvidenciaError = "Debes tomar una foto como evidencia";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const entregarDespacho = async (despachoId: string) => {
    if (!validarFormulario()) return false;

    try {
      setEntregando(true);
      await despachoService.entregarConFoto(
        despachoId,
        formData.receptorRut,
        formData.receptorNombre,
        formData.receptorApellido,
        formData.fotoEntregaPreview!,
        formData.firmaEntregaPreview!
      );
      return true;
    } finally {
      setEntregando(false);
    }
  };

  const marcarNoEntregado = async (despachoId: string) => {
    if (!validarFormulario()) return false;

    try {
      setEntregando(true);
      await despachoService.marcarNoEntregadoConEvidencia(
        despachoId,
        formData.motivoNoEntrega,
        formData.fotoEvidenciaPreview!,
        formData.observacionNoEntrega
      );
      return true;
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
    setTipo,
    formatRut,
    handleRutChange,
    handleNombreChange,
    handleApellidoChange,
    handleMotivoNoEntregaChange,
    handleObservacionNoEntregaChange,
    handleFotoChange,
    handleFirmaChange,
    entregarDespacho,
    marcarNoEntregado,
  };
}
