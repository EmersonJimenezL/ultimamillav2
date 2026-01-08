import { useState, useEffect, useRef } from "react";
import { empresaService, type EmpresaReparto } from "@/services/empresaService";
import { userService, type User } from "@/services/userService";
import { rutaService } from "@/services/rutaService";
import { isEmpresaPropia } from "@/utils";

export function useCrearRuta() {
  const [showModal, setShowModal] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaReparto[]>([]);
  const [choferes, setChoferes] = useState<User[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [selectedChofer, setSelectedChofer] = useState("");
  const [esChoferExterno, setEsChoferExterno] = useState(false);
  const [creatingRuta, setCreatingRuta] = useState(false);
  const creatingRef = useRef(false);

  const empresaSeleccionada = empresas.find((e) => e._id === selectedEmpresa);
  const empresaEsPropia = isEmpresaPropia(empresaSeleccionada);

  useEffect(() => {
    if (!selectedEmpresa) return;

    if (!empresaEsPropia) {
      setEsChoferExterno(true);
      setSelectedChofer("");
    } else {
      setEsChoferExterno(false);
    }
  }, [selectedEmpresa, empresaEsPropia]);

  const openModal = async () => {
    setShowModal(true);
    await loadData();
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmpresa("");
    setSelectedChofer("");
    setEsChoferExterno(false);
  };

  const loadData = async () => {
    try {
      setLoadingModal(true);
      const [empresasData, choferesData] = await Promise.all([
        empresaService.getAll(),
        userService.getChoferes(),
      ]);
      setEmpresas(empresasData);
      setChoferes(choferesData);
    } catch (error) {
      console.error("Error al cargar datos del modal:", error);
    } finally {
      setLoadingModal(false);
    }
  };

  const crearRuta = async (
    despachoIds: string[],
    override?: {
      empresaId?: string;
      choferId?: string;
      esChoferExterno?: boolean;
    }
  ) => {
    if (creatingRef.current) {
      return false;
    }

    if (despachoIds.length === 0) {
      throw new Error("Debes seleccionar al menos un despacho");
    }

    const empresaId = override?.empresaId ?? selectedEmpresa;
    const choferId = override?.choferId ?? selectedChofer;
    const empresaOverride = empresas.find((e) => e._id === empresaId);
    const empresaEsPropiaOverride = isEmpresaPropia(empresaOverride);
    const esChoferExternoFinal =
      override?.esChoferExterno ?? (empresaEsPropiaOverride ? esChoferExterno : true);

    if (!empresaId) {
      throw new Error("Debes seleccionar una empresa de reparto");
    }

    if (empresaEsPropiaOverride && !choferId) {
      throw new Error("Debes seleccionar un conductor (empresa propia)");
    }

    try {
      creatingRef.current = true;
      setCreatingRuta(true);

      await rutaService.create({
        empresaReparto: empresaId,
        ...(empresaEsPropiaOverride ? { conductor: choferId } : {}),
        despachos: despachoIds,
        estado: "pendiente",
        esChoferExterno: esChoferExternoFinal,
      });

      return true;
    } finally {
      setCreatingRuta(false);
      creatingRef.current = false;
    }
  };

  return {
    showModal,
    empresas,
    choferes,
    loadingModal,
    selectedEmpresa,
    setSelectedEmpresa,
    selectedChofer,
    setSelectedChofer,
    esChoferExterno,
    setEsChoferExterno,
    empresaEsPropia,
    creatingRuta,
    loadData,
    openModal,
    closeModal,
    crearRuta,
  };
}
