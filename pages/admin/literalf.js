import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import Admin from "layouts/Admin.js";
import Informacion from "components/Forms/Informacion";
import EmpaquePrimario from "components/Forms/EmpaquePrimario";
import EmpaqueSecundario from "components/Forms/EmpaqueSecundario";
import EmpaquePlastico from "components/Forms/EmpaquePlastico";
import EnvasesRetornables from "components/Forms/EnvasesRetornables";
import DistribucionGeografica from "components/Forms/DistribucionGeografica";
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
  // Loader y estado para controlar botones según estadoInformacionF
  const [estadoInformacionF, setEstadoInformacionF] = useState(undefined);
  const [idInformacionFExists, setIdInformacionFExists] = useState(false);
  // Tratamiento de datos (consentimiento)
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentLoading, setConsentLoading] = useState(true);
  
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const estadoGuardado = localStorage.getItem("estadoInformacionF");
      setEstadoInformacionF(estadoGuardado && estadoGuardado.trim() !== "" ? estadoGuardado.trim() : "Guardado");
      // También verificar si existe idInformacionF
      setIdInformacionFExists(!!localStorage.getItem("idInformacionF"));
    }
  }, []);

  // Consultar tratamientoDatos del usuario y decidir si mostrar el modal (bloqueante)
  useEffect(() => {
    const initConsent = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
        if (resp.ok) {
          const me = await resp.json();
          const td = (me?.tratamientoDatos ?? me?.tratamiento_datos ?? 0);
          localStorage.setItem('tratamientoDatos', String(td ?? 0));
        }
      } catch (_) {
        // ignorar, usar fallback
      } finally {
        const tdLS = parseInt(localStorage.getItem('tratamientoDatos') || '0', 10);
        setConsentOpen(!(tdLS === 1));
        setConsentLoading(false);
      }
    };
    initConsent();
  }, []);

  const aceptarTratamiento = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/users/tratamiento-datos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tratamientoDatos: 1 })
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`No se pudo registrar su aceptación. ${t}`);
      }
      localStorage.setItem('tratamientoDatos', '1');
      setConsentOpen(false);
    } catch (e) {
      alert(String(e.message || e));
    }
  };
  const rechazarTratamiento = () => {
    window.location.href = '/admin/dashboard';
  };

  // Escuchar cambios en localStorage para actualizar el estado de las pestañas
  React.useEffect(() => {
    const handleStorageChange = () => {
      setIdInformacionFExists(!!localStorage.getItem("idInformacionF"));
      // También actualizar el estado del formulario
      const estadoGuardado = localStorage.getItem("estadoInformacionF");
      setEstadoInformacionF(estadoGuardado && estadoGuardado.trim() !== "" ? estadoGuardado.trim() : "Guardado");
    };
    
    // Listener para cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // También verificar periódicamente (para cambios en la misma ventana)
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  if (estadoInformacionF === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-blue-600 text-lg font-semibold animate-pulse">Cargando estado del formulario...</div>
      </div>
    );
  }
  console.log("Estado del formulario:", estadoInformacionF);

  // Función para verificar si una pestaña está disponible
  const isTabAvailable = (tab) => {
    if (tab === "Informacion") return true;
    return idInformacionFExists;
  };

  // Función para validar que existe idInformacionF antes de cambiar de pestaña
  const validarIdInformacionF = (targetTab) => {
    // Si la pestaña objetivo es "Informacion", siempre permitir el acceso
    if (targetTab === "Informacion") {
      return true;
    }
    
    // Para cualquier otra pestaña, verificar que existe idInformacionF
    const idInformacionF = localStorage.getItem("idInformacionF");
    if (!idInformacionF) {
      alert("⚠️ Debe completar y guardar la información básica antes de acceder a otras secciones del formulario.");
      return false;
    }
    
    return true;
  };

  // Función para manejar el cambio de pestañas con validación
  const handleTabChange = (tab) => {
    if (validarIdInformacionF(tab)) {
      setActiveTab(tab);
    } else {
      // Si la validación falla, redirigir a "Informacion"
      setActiveTab("Informacion");
    }
  };

  // Actualiza el estado en el backend usando idInformacionF del localStorage
  const actualizaEstado = async () => {
    const idInformacionF = localStorage.getItem("idInformacionF");
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/updateEstado/${idInformacionF}`, {
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

      // Enviar notificaciones por correo: al vinculado (correo_facturacion) y al correo interno indicado
      await enviarCorreosPendienteF(idInformacionF);
      
      // Actualizar localStorage y estado local
      localStorage.setItem("estadoInformacionF", "Pendiente");
      setEstadoInformacionF("Pendiente");
      
      alert("Formulario enviado para revisión por Punto Azul.");
      window.location.reload(); // Recargar la página para actualizar el estado
    } catch (error) {
      alert(`Error al actualizar estado: ${error.message}`);
    }
  };

  // Helper: convierte saltos de línea en <br/> para correos HTML
  const toHtml = (text) => (text || "").replace(/\n/g, "<br/>");

  // Envía dos correos tras cambiar a "Pendiente" en Línea Base (F):
  // 1) Al vinculado (correo_facturacion) y 2) A a.efectobumeran@puntoazul.com.co
  const enviarCorreosPendienteF = async (idInformacionF) => {
    try {
      // Obtener información completa para extraer correo y detalles
      const infoResp = await fetch(`${API_BASE_URL}/informacion-f/getInformacion/${idInformacionF}`);
      if (!infoResp.ok) {
        console.warn("No se pudo obtener información del vinculado para correo (F)");
        return; // No bloquear el flujo si falla
      }
      const info = await infoResp.json();

      const correoVinculado = info.correo_facturacion || info.correoFacturacion || info.email || "";
      const nombre = info.nombre || info.empresa || info.razonSocial || info.razon_social || "Vinculado";
      const nit = info.nit || info.NIT || "";

      const asuntoVinculado = "Cambio estado formulario a pendiente de revision";
      const cuerpoVinculado = "Felicidades has terminado de diligenciar tu formulario por este medio te notificaremos si hay alguna novedad.";

      const asuntoInterno = `Nuevo formulario Línea Base pendiente por revisar ${nombre}`;
      const cuerpoInterno = `Hay un nuevo formulario Línea Base pendiente por revisar para ${nombre}${nit ? ` (NIT ${nit})` : ""}.`;

      const mensajes = [];
      if (correoVinculado) {
        mensajes.push({
          destinatario: correoVinculado,
          asunto: asuntoVinculado,
          cuerpo: cuerpoVinculado,
          cuerpoHtml: toHtml(cuerpoVinculado),
          tipoFormulario: "linea_base",
        });
      }
      mensajes.push({
        destinatario: "a.efectobumeran@puntoazul.com.co",
        asunto: asuntoInterno,
        cuerpo: cuerpoInterno,
        cuerpoHtml: toHtml(cuerpoInterno),
        tipoFormulario: "linea_base",
      });

      if (mensajes.length === 0) return;

      const urlEnvio = `${API_BASE_URL}/informacion-f/enviarCorreo`;
      const resp = await fetch(urlEnvio, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes, enviarComoHtml: true, incluirPasswordPlano: false })
      });
      if (!resp.ok) {
        console.warn("Fallo al enviar correos de notificación de Pendiente (F)");
      }
    } catch (e) {
      console.warn("Error enviando correos de notificación (F):", e);
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

  // Finaliza el formulario cambiando el estado a "Finalizado"
  const FinalizaFormulario = async () => {
    const idInformacionF = localStorage.getItem("idInformacionF");
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/updateEstado/${idInformacionF}`, {
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
      localStorage.setItem("estadoInformacionF", "Finalizado");
      setEstadoInformacionF("Finalizado");
      
      alert("Proceso finalizado correctamente. El reporte está completo.");
      window.location.reload(); // Recargar la página para actualizar el estado
    } catch (error) {
      alert(`Error al finalizar formulario: ${error.message}`);
      throw error; // Re-lanzar error para manejo en la función que llama
    }
  };

  // Subir documento al backend (alineado con literalb.js: solo archivo -> finaliza)
  const handleUploadCarta = async () => {
    if (!selectedFile) return;
    const idInformacionF = localStorage.getItem("idInformacionF");
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      // Ajuste: el backend expone /cargaCartaUrl/ con FileInterceptor('file')
      const response = await fetch(`${API_BASE_URL}/informacion-f/cargaCartaUrl/${idInformacionF}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      alert("Formulario subido correctamente.");
      await FinalizaFormulario();
      setShowModal(false);
      setSelectedFile(null);
    } catch (error) {
      // Mensaje específico si Multer devuelve Unexpected field
      if (String(error.message).includes("Unexpected field")) {
        alert("El backend rechazó el campo 'file'. Verifique que el FileInterceptor use FileInterceptor('file').");
      } else {
        alert(`Error al subir el formulario: ${error.message}`);
      }
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "Informacion":
        return (
          <Informacion
            color="light"
            estado={estadoInformacionF}
            onEstadoChange={(nuevo) => {
              setEstadoInformacionF(prev => (prev === nuevo ? prev : nuevo));
            }}
          />
        );
      case "Empaque Primario":
        return <EmpaquePrimario color="light" estado={estadoInformacionF}/>;
      case "Empaque Secundario":
        return <EmpaqueSecundario color="light" estado={estadoInformacionF}/>;
      case "Empaque Plastico":
        return <EmpaquePlastico color="light" estado={estadoInformacionF}/>;
      case "Envases Retornables":
        return <EnvasesRetornables color="light" estado={estadoInformacionF}/>;
      case "Distribucion Geografica":
        return <DistribucionGeografica color="light" estado={estadoInformacionF}/>;
      default:
        return null;
    }
  };

  return (
    <div className="mt-10 p-4 bg-gray-100 min-h-screen">
      {/* Modal bloqueante de Tratamiento de Datos */}
      {!consentLoading && (
        <Modal
          isOpen={consentOpen}
          onRequestClose={() => { /* bloqueado: sin cierre */ }}
          shouldCloseOnOverlayClick={false}
          ariaHideApp={false}
          className="mx-auto my-32 bg-white p-6 rounded-lg shadow-lg max-w-xl z-50 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
          contentLabel="Tratamiento de datos"
        >
          <h2 className="text-xl font-bold mb-3">Tratamiento de datos personales</h2>
          <p className="text-gray-700 mb-4">
            Para continuar, debe aceptar la política de tratamiento de datos. Al hacer clic en "Aceptar" autoriza el tratamiento de sus datos personales conforme a nuestra política.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={rechazarTratamiento} className="bg-gray-300 text-black px-4 py-2 rounded">Rechazar</button>
            <button onClick={aceptarTratamiento} className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded">Aceptar</button>
          </div>
        </Modal>
      )}
      {/* Estado actual del formulario */}
      {/* <div className="mb-2 text-blue-700 font-semibold">Estado actual del formulario: {estadoInformacionF}</div> */}
      {/* Botones encima de los tabs */}
      <div className="flex justify-between mb-4 items-center">
        {/* Botón Cargar carta: solo visible si estado es Aprobado */}
        <div style={{ visibility: estadoInformacionF === "Aprobado" ? "visible" : "hidden" }}>
          <button
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            onClick={() => setShowModal(true)}
            disabled={estadoInformacionF !== "Aprobado"}
          >
            Cargar carta
          </button>
        </div>
        {/* Estado del formulario con icono de información */}
        <p className="flex items-center gap-2">Estado del formulario: <span className="font-semibold text-lightBlue-600">{estadoInformacionF || ""}</span>
          <i
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
            onClick={() => setIsOpen(true)}
            title="Información sobre los estados"
          ></i>
        </p>
        {/* Botón Enviar formulario: solo visible si estado es vacío, Guardado o Rechazado, pero mantiene el espacio */}
        <div style={{ visibility: (!estadoInformacionF || estadoInformacionF === "Guardado" || estadoInformacionF === "Rechazado") ? "visible" : "hidden" }}>
          <button
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            onClick={handleSendForm}
            disabled={!(estadoInformacionF === "Guardado" || !estadoInformacionF || estadoInformacionF === "Rechazado")}
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
          <li><span className="font-semibold">Guardado:</span> Su formulario se va guardando pero aún no lo puede ver el personal de Punto Azul.</li>
          <li><span className="font-semibold">Pendiente:</span> Está pendiente de revisión por el personal de Punto Azul.</li>
          <li><span className="font-semibold">Rechazado:</span> Su formulario ha sido devuelto por algún motivo que se especifica en el correo.</li>
          <li><span className="font-semibold">Aprobado:</span> Su formulario ya está pendiente por cargar la carta firmada de aprobación.</li>
          <li><span className="font-semibold">Finalizado:</span> Ha terminado el proceso de reporte.</li>
        </ul>
        <button
          className="bg-blueGray-600 text-white px-4 py-2 rounded mt-3"
          onClick={() => setIsOpen(false)}
        >
          Cerrar
        </button>
      </Modal>
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
        <p className="mb-4">
          Sube aquí el documento de la carta firmada en formato PDF, Word o imagen.
          <br />
          <strong>Nota:</strong> Al subir la carta, el proceso se finalizará automáticamente.
        </p>
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
        {["Informacion", "Empaque Primario", "Empaque Secundario", "Empaque Plastico", "Envases Retornables", "Distribucion Geografica"].map((tab) => {
          const isAvailable = isTabAvailable(tab);
          const isActive = activeTab === tab;
          
          return (
            <button
              key={tab}
              className={`p-3 px-6 text-lg font-semibold transition-all duration-300 rounded-t-lg relative ${
                isActive
                  ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md"
                  : isAvailable
                  ? "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={() => handleTabChange(tab)}
              disabled={!isAvailable}
              title={!isAvailable ? "Complete la información básica primero" : ""}
            >
              {tab}
              {!isAvailable && (
                <i className="fas fa-lock ml-2 text-gray-400 text-sm"></i>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Mensaje informativo cuando las pestañas están bloqueadas */}
      {!idInformacionFExists && activeTab === "Informacion" && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-info-circle text-yellow-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Información importante:</strong> Debe completar y guardar la información básica en esta sección 
                antes de poder acceder a las demás pestañas del formulario.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="p-4 bg-white shadow-md rounded-lg">{renderForm()}</div>
    </div>
  );
}

FormularioF.layout = Admin;
