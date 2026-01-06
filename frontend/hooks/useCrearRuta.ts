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
    await loadModalData();
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmpresa("");
    setSelectedChofer("");
    setEsChoferExterno(false);
  };

  const loadModalData = async () => {
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

  const crearRuta = async (despachoIds: string[]) => {
    if (creatingRef.current) {
      return false;
    }

    if (despachoIds.length === 0) {
      throw new Error("Debes seleccionar al menos un despacho");
    }

    if (!selectedEmpresa) {
      throw new Error("Debes seleccionar una empresa de reparto");
    }

    if (empresaEsPropia && !selectedChofer) {
      throw new Error("Debes seleccionar un conductor (empresa propia)");
    }

    try {
      creatingRef.current = true;
      setCreatingRuta(true);

      await rutaService.create({
        empresaReparto: selectedEmpresa,
        ...(empresaEsPropia ? { conductor: selectedChofer } : {}),
        despachos: despachoIds,
        estado: "pendiente",
        esChoferExterno: empresaEsPropia ? esChoferExterno : true,
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
    openModal,
    closeModal,
    crearRuta,
  };
}
