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
      const estadoGuardado = localStorage.getItem("estadoInformacionB");
      // Si no hay estado guardado, asignar "Iniciado" como estado inicial
      setEstadoInformacionB(estadoGuardado && estadoGuardado.trim() !== "" ? estadoGuardado.trim() : "Iniciado");
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
      // Enviar notificaciones por correo: al asociado (correoFacturacion) y a Punto Azul
      await enviarCorreosPendiente(idInformacionB);
      
      // Actualizar localStorage y estado local
      localStorage.setItem("estadoInformacionB", "Pendiente");
      setEstadoInformacionB("Pendiente");
      
      alert("Formulario enviado para revisión por Punto Azul.");
      window.location.reload(); // Recargar la página para actualizar el estado
    } catch (error) {
      alert(`Error al actualizar estado: ${error.message}`);
    }
  };

  // Helper: convierte saltos de línea a <br> para correos HTML
  const toHtml = (text) => (text || "").replace(/\n/g, "<br>");

  // Envía dos correos tras cambiar a "Pendiente":
  // 1) Al asociado (correoFacturacion) y 2) A literalb@puntoazul.com.co
  const enviarCorreosPendiente = async (idInformacionB) => {
    try {
      // Obtener datos del asociado para conocer correo y datos básicos
      const infoResp = await fetch(`${API_BASE_URL}/informacion-b/getInformacion/${idInformacionB}`);
      if (!infoResp.ok) {
        console.warn("No se pudo obtener información del asociado para correo");
        return; // No bloquear el flujo si falla
      }
      const info = await infoResp.json();
      // Preferir correo de la persona de contacto (correoRe / correo_re), fallback a correo de facturación
      const correoAsociado = info.correoRe || info.correo_re || info.correoFacturacion || info.correo_facturacion || info.email || "";
      const nombre = info.nombre || info.razonSocial || "Asociado";
      const nit = info.nit || info.NIT || "";

  const asuntoAsociado = "Cambio estado formulario a pendiente de revision";
      const cuerpoAsociado = "Felicidades has terminado de diligenciar tu formulario por este medio te notificaremos si hay alguna novedad.";

      const asuntoInterno = `Nuevo formulario Literal B pendiente por revisar ${nombre}`;
      const cuerpoInterno = `Hay un nuevo formulario Literal B pendiente por revisar para ${nombre}${nit ? ` (NIT ${nit})` : ""}.`;

      const mensajes = [];
      if (correoAsociado) {
        mensajes.push({
          destinatario: correoAsociado,
          asunto: asuntoAsociado,
          cuerpo: cuerpoAsociado,
          cuerpoHtml: toHtml(cuerpoAsociado),
          tipoFormulario: "literal_b",
        });
      }
      mensajes.push({
        destinatario: "literalb@puntoazul.com.co",
        asunto: asuntoInterno,
        cuerpo: cuerpoInterno,
        cuerpoHtml: toHtml(cuerpoInterno),
        tipoFormulario: "literal_b",
      });

      if (mensajes.length === 0) return;

      const urlEnvio = `${API_BASE_URL}/informacion-b/enviarCorreo`;
      const resp = await fetch(urlEnvio, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes, enviarComoHtml: true, incluirPasswordPlano: false })
      });
      if (!resp.ok) {
        console.warn("Fallo al enviar correos de notificación de Pendiente");
      }
    } catch (e) {
      console.warn("Error enviando correos de notificación:", e);
    }
  };

  const handleSendForm = () => {
    const confirmarYValidar = async () => {
      if (!window.confirm("¿Está seguro de que completó todo el formulario para revisión de Punto Azul? Una vez enviada la informacion no se podra volver a editar.")) {
        return;
      }
      // Validar que exista al menos 1 producto registrado (Literal B)
      const id = localStorage.getItem("idInformacionB");
      if (!id) {
        alert("Debe completar y guardar la información básica antes de enviar el formulario.");
        return;
      }
      try {
        const resp = await fetch(`${API_BASE_URL}/informacion-b/getProdValidarB/${id}`);
        if (!resp.ok) {
          // Tratar respuestas no-OK como lista vacía
          alert("Debe registrar al menos un producto antes de enviar el formulario.");
          return;
        }
        const data = await resp.json();
        const count = Array.isArray(data) ? data.length : 0;
        if (count <= 0) {
          alert("Debe registrar al menos un producto antes de enviar el formulario.");
          return;
        }
        // Pasa la validación -> enviar
        actualizaEstado();
      } catch (e) {
        console.error('Validación de productos (Literal B) falló:', e);
        alert("No se pudo verificar los productos. Intente nuevamente o contacte soporte.");
      }
    };
    confirmarYValidar();
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Finaliza el formulario cambiando el estado a "Finalizado"
  const finalizaFormularioB = async () => {
    const idInformacionB = localStorage.getItem("idInformacionB");
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-b/updateEstado/${idInformacionB}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "Finalizado",
          tendencia: "",
          motivo: "Proceso completado con carta cargada"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Actualizar localStorage y estado local
      localStorage.setItem("estadoInformacionB", "Finalizado");
      setEstadoInformacionB("Finalizado");

      alert("Proceso finalizado correctamente. El reporte está completo.");
      window.location.reload();
    } catch (error) {
      alert(`Error al finalizar formulario: ${error.message}`);
      throw error;
    }
  };

  // Subir documento al backend
  const handleUploadCarta = async () => {
    if (!selectedFile) return;
    const idInformacionB = localStorage.getItem("idInformacionB");
    const formData = new FormData();
    formData.append("file", selectedFile);
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
      // Cambiar el estado a "Finalizado" automáticamente
      await finalizaFormularioB();
      setShowModal(false);
      setSelectedFile(null);
    } catch (error) {
      alert(`Error al subir el formulario: ${error.message}`);
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "Informacion":
        return (
          <InformacionB
            color="light"
            estado={estadoInformacionB}
            onEstadoChange={(nuevo) => {
              // Evitar renders innecesarios
              setEstadoInformacionB(prev => (prev === nuevo ? prev : nuevo));
            }}
          />
        );
      case "Productos":
        return (
          <ProductosB
            color="light"
            estado={estadoInformacionB}
          />
        );
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
