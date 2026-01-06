import { useState, useRef } from "react";
import { despachoService, type Despacho } from "@/services/despachoService";

export function useDatosEntrega() {
  const [showModal, setShowModal] = useState(false);
  const [despachoSeleccionado, setDespachoSeleccionado] =
    useState<Despacho | null>(null);
  const [receptorRut, setReceptorRut] = useState("");
  const [receptorNombre, setReceptorNombre] = useState("");
  const [receptorApellido, setReceptorApellido] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = (despacho: Despacho) => {
    setDespachoSeleccionado(despacho);
    setReceptorRut(despacho.entrega?.receptorRut || "");
    setReceptorNombre(despacho.entrega?.receptorNombre || "");
    setReceptorApellido(despacho.entrega?.receptorApellido || "");
    setFotoPreview(despacho.entrega?.fotoEntrega || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setDespachoSeleccionado(null);
    setReceptorRut("");
    setReceptorNombre("");
    setReceptorApellido("");
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFotoChange = (file: File | null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("La imagen no debe superar los 5MB");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Solo se permiten archivos de imagen");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const actualizarDatos = async () => {
    if (!despachoSeleccionado) return false;

    if (!receptorRut && !receptorNombre && !receptorApellido && !fotoPreview) {
      throw new Error("Debes ingresar al menos un dato");
    }

    try {
      setActualizando(true);

      await despachoService.actualizarDatosEntrega(
        despachoSeleccionado._id,
        receptorRut || undefined,
        receptorNombre || undefined,
        receptorApellido || undefined,
        fotoPreview || undefined
      );

      return true;
    } finally {
      setActualizando(false);
    }
  };

  return {
    showModal,
    despachoSeleccionado,
    receptorRut,
    setReceptorRut,
    receptorNombre,
    setReceptorNombre,
    receptorApellido,
    setReceptorApellido,
    fotoPreview,
    actualizando,
    fileInputRef,
    openModal,
    closeModal,
    handleFotoChange,
    actualizarDatos,
  };
}
