import React, { useState } from "react";
import Modal from "react-modal";
import Admin from "layouts/Admin.js";
import InformacionB from "components/Forms/InformacionB";
import ProductosB from "components/Forms/ProductosB";
import { API_BASE_URL } from "../../utils/config";

export default function FormularioF() {
  // Necesario para accesibilidad con react-modal
  if (typeof window !== "undefined") {
    Modal.setAppElement("#__next");
  }
  const [activeTab, setActiveTab] = useState("Informacion");
  // Estados y handlers para los botones y modal
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  // Modal de información
  const [isOpen, setIsOpen] = useState(false);
  // Loader y estado para controlar botones según estadoInformacionB
  const [estadoInformacionB, setEstadoInformacionB] = useState(undefined);
  // Estado para controlar la validación de pestañas
  const [idInformacionB, setIdInformacionB] = useState(null);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setEstadoInformacionB((localStorage.getItem("estadoInformacionB") || "").trim());
      setIdInformacionB(localStorage.getItem("idInformacionB"));
    }
  }, []);

  // useEffect para monitorear cambios en localStorage
  React.useEffect(() => {
    const handleStorageChange = () => {
      setIdInformacionB(localStorage.getItem("idInformacionB"));
    };

    window.addEventListener("storage", handleStorageChange);
    
    // También verificar cambios periódicamente
    const interval = setInterval(() => {
      const currentIdInformacionB = localStorage.getItem("idInformacionB");
      if (currentIdInformacionB !== idInformacionB) {
        setIdInformacionB(currentIdInformacionB);
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [idInformacionB]);

  // Función para validar si existe idInformacionB
  const validarIdInformacionB = () => {
    const id = localStorage.getItem("idInformacionB");
    return id && id.trim() !== "";
  };

  // Función para verificar si una pestaña está disponible
  const isTabAvailable = (tab) => {
    if (tab === "Informacion") return true; // Información siempre está disponible
    if (tab === "Productos") return validarIdInformacionB(); // Productos requiere idInformacionB
    return false;
  };

  // Función para manejar el cambio de pestañas
  const handleTabChange = (tab) => {
    if (!isTabAvailable(tab)) {
      alert("Debe completar y guardar la información básica antes de continuar con la siguiente pestaña.");
      return;
    }
    setActiveTab(tab);
  };
  if (estadoInformacionB === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-blue-600 text-lg font-semibold animate-pulse">Cargando estado del formulario...</div>
      </div>
    );
  }
  console.log("Estado del formulario:", estadoInformacionB);

  // Actualiza el estado en el backend usando idInformacionB del localStorage
  const actualizaEstado = async () => {
    const idInformacionB = localStorage.getItem("idInformacionB");
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-b/updateEstado/${idInformacionB}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "Pendiente",
          tendencia: "",
          motivo: "OK"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      // Actualizar localStorage y estado local
      localStorage.setItem("estadoInformacionB", "Pendiente");
      setEstadoInformacionB("Pendiente");
      
      alert("Formulario enviado para revisión por Punto Azul.");
      window.location.reload(); // Recargar la página para actualizar el estado
    } catch (error) {
      alert(`Error al actualizar estado: ${error.message}`);
    }
  };

  const handleSendForm = () => {
    if (window.confirm("¿Está seguro de que completó todo el formulario para revisión de Punto Azul? Una vez enviada la informacion no se podra volver a editar.")) {
      actualizaEstado();
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Subir documento al backend
  const handleUploadCarta = async () => {
    if (!selectedFile) return;
    const idInformacionB = localStorage.getItem("idInformacionB");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("ruta", "/public/img/literalB");
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-b/cargaCarta/${idInformacionB}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      alert("Formulario subido correctamente.");
      setShowModal(false);
      setSelectedFile(null);
    } catch (error) {
      alert(`Error al subir el formulario: ${error.message}`);
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "Informacion":
        return <InformacionB color="light" estado={estadoInformacionB} />;
      case "Productos":
        return <ProductosB color="light" estado={estadoInformacionB} />;
      default:
        return null;
    }
  };

  return (
    <div className="mt-10 p-4 bg-gray-100 min-h-screen">
      {/* Botones encima de los tabs */}
      <div className="flex justify-between mb-4 items-center">
        {/* Botón Cargar Formulario: solo visible si estado es Aprobado, pero mantiene el espacio */}
        <div style={{ visibility: estadoInformacionB === "Aprobado" ? "visible" : "hidden" }}>
          <button
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            onClick={() => setShowModal(true)}
          >
            Cargar Formulario
          </button>
        </div>
        {/* Estado del formulario con icono de información */}
        <p className="flex items-center gap-2">Estado del formulario: <span className="font-semibold text-lightBlue-600">{estadoInformacionB || ""}</span>
          <i
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
            onClick={() => setIsOpen(true)}
            title="Información sobre los estados"
          ></i>
        </p>
        {/* Botón Enviar formulario: solo visible si estado es vacío, Iniciado, Guardado o Rechazado */}
        <div style={{ visibility: (!estadoInformacionB || estadoInformacionB === "Iniciado" || estadoInformacionB === "Guardado" || estadoInformacionB === "Rechazado") ? "visible" : "hidden" }}>
          <button
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            onClick={handleSendForm}
            disabled={!(estadoInformacionB === "Guardado" || estadoInformacionB === "Iniciado" || estadoInformacionB === "Rechazado" || !estadoInformacionB)}
          >
            Enviar formulario
          </button>
        </div>        
      </div>
      {/* Modal de información de estados */}
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        className="mx-auto my-32 bg-white p-5 rounded-lg shadow-lg max-w-xl z-40 max-h-460-px overflow-y-auto outline-none"
        overlayClassName=""
        contentLabel="Información de estados"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="text-xl font-bold mb-4">¿Qué significa el estado del formulario?</h2>
        <ul className="list-disc pl-6 text-gray-700 mb-4">
          <li><span className="font-semibold">Iniciado:</span> Formulario nuevo, listo para ser diligenciado por primera vez.</li>
          <li><span className="font-semibold">Guardado:</span> Su formulario se va guardando pero aún no lo puede ver el personal de Punto Azul.</li>
          <li><span className="font-semibold">Pendiente:</span> Está pendiente de revisión por el personal de Punto Azul.</li>
          <li><span className="font-semibold">Rechazado:</span> Su formulario ha sido devuelto por algún motivo que se especifica en el correo.</li>
          <li><span className="font-semibold">Aprobado:</span> Su formulario ha sido aprobado. Se le enviará un correo de confirmación.</li>
          <li><span className="font-semibold">Finalizado:</span> Ha terminado el proceso de reporte.</li>
        </ul>
        <button
          className="bg-blueGray-600 text-white px-4 py-2 rounded mt-3"
          onClick={() => setIsOpen(false)}
        >
          Cerrar
        </button>
      </Modal>
      {/* Modal para cargar formulario usando react-modal */}
      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        className="mx-auto my-32 bg-white p-5 rounded-lg shadow-lg max-w-xl z-40 max-h-460-px overflow-y-auto outline-none"
        overlayClassName=""
        contentLabel="Cargar formulario"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="text-xl font-bold mb-4">Cargar Formulario</h2>
        <p className="mb-4">Sube aquí el documento del formulario firmado en formato PDF, Word o imagen.</p>
        <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileChange} className="mb-4" />
        {selectedFile && (
          <div className="mb-2 text-sm text-gray-700">Archivo seleccionado: {selectedFile.name}</div>
        )}
        <button
          className="bg-blueGray-600 text-white px-4 py-2 rounded mt-3"
          onClick={handleUploadCarta}
          disabled={!selectedFile}
        >
          Subir
        </button>
        <button
          className="bg-gray-300 text-black px-4 py-2 rounded mt-3 ml-2"
          onClick={() => setShowModal(false)}
        >
          Cancelar
        </button>
      </Modal>
      {/* Tabs */}
      <div className="relative  flex border-b-2 border-gray-300">
        {["Informacion", "Productos"].map((tab) => {
          const isAvailable = isTabAvailable(tab);
          return (
            <button
              key={tab}
              className={`p-3 px-6 text-lg font-semibold transition-all duration-300 rounded-t-lg relative ${
                activeTab === tab
                  ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md"
                  : isAvailable
                  ? "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={() => handleTabChange(tab)}
              disabled={!isAvailable}
            >
              {tab}
              {!isAvailable && (
                <i className="fas fa-lock absolute top-2 right-2 text-red-500 text-sm"></i>
              )}
            </button>
          );
        })}
      </div>
      <div className="p-4 bg-white shadow-md rounded-lg">{renderForm()}</div>
    </div>
  );
}

FormularioF.layout = Admin;
