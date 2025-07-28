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
  // Modal de información
  const [isOpen, setIsOpen] = useState(false);
  // Loader y estado para controlar botones según estadoInformacionB
  const [estadoInformacionB, setEstadoInformacionB] = useState(undefined);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const estadoGuardado = localStorage.getItem("estadoInformacionB");
      if (!estadoGuardado || estadoGuardado.trim() === "") {
        // Si no hay estado guardado, establecer como "Iniciado"
        localStorage.setItem("estadoInformacionB", "Iniciado");
        setEstadoInformacionB("Iniciado");
      } else {
        setEstadoInformacionB(estadoGuardado.trim());
      }
    }
  }, []);
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
        {/* Espacio izquierdo para mantener el centro */}
        <div></div>
        {/* Estado del formulario con icono de información */}
        <p className="flex items-center gap-2">Estado del formulario: <span className="font-semibold text-lightBlue-600">{estadoInformacionB || ""}</span>
          <i
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
            onClick={() => setIsOpen(true)}
            title="Información sobre los estados"
          ></i>
        </p>
        {/* Botón Enviar formulario: solo visible si estado es Iniciado, Guardado o Rechazado */}
        <div style={{ visibility: (estadoInformacionB === "Iniciado" || estadoInformacionB === "Guardado" || estadoInformacionB === "Rechazado") ? "visible" : "hidden" }}>
          <button
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            onClick={handleSendForm}
            disabled={!(estadoInformacionB === "Guardado" || estadoInformacionB === "Iniciado" || estadoInformacionB === "Rechazado")}
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
      {/* Tabs */}
      <div className="relative z-10 flex border-b-2 border-gray-300">
        {["Informacion", "Productos"].map((tab) => (
          <button
            key={tab}
            className={`p-3 px-6 text-lg font-semibold transition-all duration-300 rounded-t-lg ${
              activeTab === tab
                ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md"
                : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-4 bg-white shadow-md rounded-lg">{renderForm()}</div>
    </div>
  );
}

FormularioF.layout = Admin;
