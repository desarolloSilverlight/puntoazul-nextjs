import React, { useState } from "react";
import Modal from "react-modal";
import Admin from "layouts/Admin.js";
import Informacion from "components/Forms/Informacion";
import EmpaquePrimario from "components/Forms/EmpaquePrimario";
import EmpaqueSecundario from "components/Forms/EmpaqueSecundario";
import EmpaquePlastico from "components/Forms/EmpaquePlastico";
import EnvasesRetornables from "components/Forms/EnvasesRetornables";
import DistribucionGeografica from "components/Forms/DistribucionGeografica";

export default function FormularioF() {
  // Necesario para accesibilidad con react-modal
  if (typeof window !== "undefined") {
    Modal.setAppElement("#__next");
  }
  const [activeTab, setActiveTab] = useState("Informacion");
  // Estados y handlers para los botones y modal
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  // Estado para controlar botones según estadoInformacionF
  const estadoInformacionF = typeof window !== "undefined" ? (localStorage.getItem("estadoInformacionF") || "").trim() : "";
  console.log("Estado del formulario:", estadoInformacionF);

  // Actualiza el estado en el backend usando idInformacionF del localStorage
  const actualizaEstado = async () => {
    const idInformacionF = localStorage.getItem("idInformacionF");
    try {
      const response = await fetch(`https://nestbackend.fidare.com/informacion-f/updateEstado/${idInformacionF}`, {
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
      alert("Formulario enviado para revisión por Punto Azul.");
      window.location.reload(); // Recargar la página para actualizar el estado
    } catch (error) {
      alert(`Error al actualizar estado: ${error.message}`);
    }
  };

  const handleSendForm = () => {
    if (window.confirm("¿Está seguro de que completó todo el formulario para revisión de Punto Azul?")) {
      actualizaEstado();
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Subir documento al backend
  const handleUploadCarta = async () => {
    if (!selectedFile) return;
    const idInformacionF = localStorage.getItem("idInformacionF");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("ruta", "/public/img/literalF");
    try {
      const response = await fetch(`https://nestbackend.fidare.com/informacion-f/cargaCarta/${idInformacionF}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      alert("Carta subida correctamente.");
      setShowModal(false);
      setSelectedFile(null);
    } catch (error) {
      alert(`Error al subir la carta: ${error.message}`);
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "Informacion":
        return <Informacion color="light"/>;
      case "Empaque Primario":
        return <EmpaquePrimario color="light"/>;
      case "Empaque Secundario":
        return <EmpaqueSecundario color="light"/>;
      case "Empaque Plastico":
        return <EmpaquePlastico color="light"/>;
      case "Envases Retornables":
        return <EnvasesRetornables color="light"/>;
      case "Distribucion Geografica":
        return <DistribucionGeografica color="light"/>;
      default:
        return null;
    }
  };

  return (
    <div className="mt-10 p-4 bg-gray-100 min-h-screen">
      {/* Estado actual del formulario */}
      {/* <div className="mb-2 text-blue-700 font-semibold">Estado actual del formulario: {estadoInformacionF}</div> */}
      {/* Botones encima de los tabs */}
      <div className="flex justify-between mb-4 items-center">
        <button
          className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
          onClick={handleSendForm}
          disabled={!(estadoInformacionF === "Guardado" || estadoInformacionF === "Rechazado")}
        >
          Enviar formulario
        </button>
        <button
          className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
          onClick={() => {
            if (estadoInformacionF === "Aprobado") {
              setShowModal(true);
            } else {
              alert("Tu formulario necesita estar Aprobado para poder cargar la carta de aprobación.");
            }
          }}
        >
          Cargar carta
        </button>
      </div>
      {/* Modal para cargar carta usando react-modal, estilo ejemplo */}
      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        className="mx-auto my-32 bg-white p-5 rounded-lg shadow-lg max-w-xl z-40 max-h-460-px overflow-y-auto outline-none"
        overlayClassName=""
        contentLabel="Cargar carta"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="text-xl font-bold mb-4">Cargar carta</h2>
        <p className="mb-4">Sube aquí el documento de la carta en formato PDF, Word o imagen.</p>
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
      <div className="relative flex border-b-2 border-gray-300">
        {["Informacion", "Empaque Primario", "Empaque Secundario", "Empaque Plastico", "Envases Retornables", "Distribucion Geografica"].map((tab) => (
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
