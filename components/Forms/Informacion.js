import React, { useState, useEffect } from "react";
import { Oval } from 'react-loader-spinner';
import Modal from "react-modal";
import Backdrop from '@mui/material/Backdrop';
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../utils/config";
// Necesario para accesibilidad con react-modal
if (typeof window !== "undefined") {
  Modal.setAppElement("#__next");
}

export default function FormularioAfiliado({ color, readonly, idInformacionF: propIdInformacionF, estado: propEstado, onEstadoChange }) {
  // Estado único para todos los campos del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    ciudad: "",
    pais: "",
    correoFacturacion: "",
    personaContacto: "",
    telefono: "",
    celular: "",
    cargo: "",
    correoElectronico: "",
    fechaDiligenciamiento: "",
    anioReportado: "",
    empresasRepresentadas: "",
    reporte: "unitario", // Valor por defecto
  });

  const [estado, setEstado] = useState(propEstado || "Iniciado"); // Estado del formulario con "Iniciado" por defecto
  const [isDisabled, setIsDisabled] = useState(readonly || false); // Controlar si los campos están bloqueados
  const [isSaveDisabled, setIsSaveDisabled] = useState(false); // Controlar si el botón "Guardar" está deshabilitado
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorDuplicado, setErrorDuplicado] = useState(""); // Estado para error de años duplicados
  const [validandoDuplicado, setValidandoDuplicado] = useState(false); // Estado para indicar validación en curso
  
  // Actualizar estado cuando cambie el prop
  useEffect(() => {
    if (readonly) {
      setIsDisabled(true);
      return;
    }

    if (propEstado) {
      setEstado(prev => {
        if (prev !== propEstado) {
          onEstadoChange && onEstadoChange(propEstado);
        }
        return propEstado;
      });
      if (propEstado === "Guardado" || propEstado === "Rechazado" || propEstado === "Iniciado") {
        setIsDisabled(false);
      } else {
        setIsDisabled(true);
      }
    } else {
      setEstado(prev => {
        if (prev !== "Iniciado") {
          onEstadoChange && onEstadoChange("Iniciado");
        }
        return "Iniciado";
      });
      setIsDisabled(false);
    }
  }, [propEstado, readonly]);
  
  useEffect(() => {
    console.log('Modal isOpen state:', isOpen);
  }, [isOpen]);

  // Modal de tratamiento de datos - Solo aparece cuando el estado es "Iniciado"
  useEffect(() => {
    console.log("Estado actual en Informacion.js:", estado);
    // Solo mostrar el modal cuando el estado es "Iniciado"
    if (estado === "Iniciado") {
      console.log("Mostrando modal de tratamiento (Informacion.js)");
      setConsentOpen(true);
    } else {
      console.log("Ocultando modal de tratamiento (Informacion.js)");
      setConsentOpen(false);
    }
    setConsentLoading(false);
  }, [estado]); // Solo depende del estado del formulario
  const [isUnitarioOpen, setIsUnitarioOpen] = useState(false); // Estado para el modal de Reporte Unitario
  const [isTotalizadoOpen, setIsTotalizadoOpen] = useState(false); // Estado para el modal de Reporte Totalizado
  
  // Estados para modal de tratamiento de datos
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentLoading, setConsentLoading] = useState(true);

  let timeoutId; // Variable para almacenar el temporizador

  // Función para manejar los cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Evitar cualquier cambio cuando el formulario está bloqueado
    if (isDisabled) return;
    setFormData((prevData) => {
      const newData = {
        ...prevData,
        [name]: value,
      };
      // Guardar tipoReporte en localStorage si cambia
      if (name === "reporte" && !isDisabled) {
        localStorage.setItem("tipoReporte", value);
      }
      return newData;
    });
    
    // Validar duplicados cuando cambia anioReportado
    if (name === "anioReportado" && value) {
      const fechaDiligenciamiento = formData.fechaDiligenciamiento || new Date().toISOString().split('T')[0];
      const anoDiligenciamiento = new Date(fechaDiligenciamiento).getFullYear().toString();
      validarAnosDuplicados(anoDiligenciamiento, value);
    }
  };

  // Funciones para el modal de tratamiento de datos
  const aceptarTratamiento = async () => {
    // Simplemente cerrar el modal, no guardar en backend
    setConsentOpen(false);
  };
  
  const rechazarTratamiento = () => {
    // Redirigir al dashboard si rechaza
    window.location.href = '/admin/dashboard';
  };

  // Función para validar años duplicados
  const validarAnosDuplicados = async (anoDiligenciamiento, anoReportado) => {
    if (!anoDiligenciamiento || !anoReportado) return true; // Si no hay valores, no validar
    
    // Usar el NIT del formulario en lugar del ID
    const nit = formData.nit;
    if (!nit) return true;

    try {
      setValidandoDuplicado(true);
      setErrorDuplicado("");
      
      const response = await fetch(`${API_BASE_URL}/informacion-f/validarAnosDuplicados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUsuario: nit,
          anoDiligenciamiento: anoDiligenciamiento,
          anoReportado: anoReportado
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 400 && !data.valido) {
          setErrorDuplicado(data.mensaje);
          return false;
        }
        throw new Error(data.message || "Error al validar años duplicados");
      }

      if (!data.valido) {
        setErrorDuplicado(data.mensaje);
        return false;
      }

      setErrorDuplicado("");
      return true;
    } catch (error) {
      console.error("Error al validar años duplicados:", error);
      // En caso de error del servidor, permitir continuar
      return true;
    } finally {
      setValidandoDuplicado(false);
    }
  };

  // Años permitidos para anioReportado: año actual -2 y -3
  const currentYear = new Date().getFullYear();
  const allowedYears = [currentYear - 2, currentYear - 3];

  // Asegurar valor inicial válido si no viene del backend
  useEffect(() => {
    if (!formData.anioReportado) {
      setFormData(prev => ({ ...prev, anioReportado: allowedYears[0].toString() }));
    } else if (!allowedYears.map(String).includes(formData.anioReportado)) {
      // Si el backend trae un año fuera del rango, forzar al más reciente permitido
      setFormData(prev => ({ ...prev, anioReportado: allowedYears[0].toString() }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.anioReportado]);

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
// useEffect para traer nombre y nit del usuario al cargar el componente (solo en modo normal)
  useEffect(() => {
    // Solo ejecutar en modo normal, no en readonly
    if (readonly) return;
    
    const fetchUsuario = async () => {
      const idUsuario = localStorage.getItem("id");
      if (!idUsuario) return;
      try {
        const response = await fetch(`${API_BASE_URL}/users/getUsuario?id=${idUsuario}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            nombre: data.nombre || "",
            nit: data.identificacion || "",
          }));
        }
      } catch (error) {
        console.error("Error al obtener usuario:", error);
      }
    };
    fetchUsuario();
  }, [readonly]);
  // Obtener datos del backend al cargar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        let response;
        
        // Si está en modo readonly y tiene propIdInformacionF, usar datos del cliente específico
        if (readonly && propIdInformacionF) {
          console.log("Modo validación: cargando datos del cliente con idInformacionF:", propIdInformacionF);
          response = await fetch(`${API_BASE_URL}/informacion-f/getInformacion/${propIdInformacionF}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
        } else {
          // Modo normal: usar datos del usuario logueado
          const idUsuario = localStorage.getItem("id");
          console.log("Modo normal: cargando datos del usuario con idUsuario:", idUsuario);
          response = await fetch(`${API_BASE_URL}/informacion-f/getByIdUsuario/${idUsuario}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron datos para este registro.");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Datos obtenidos:", data);
        
        // Solo actualizar localStorage en modo normal (no readonly)
        if (!readonly) {
          localStorage.setItem("idInformacionF", data.idInformacionF);
          localStorage.setItem("estadoInformacionF", data.estado || "Guardado");
          // Guardar tipoReporte en localStorage si existe
          localStorage.setItem("tipoReporte", data.tipo_reporte || "unitario");
        }

        setFormData({
          nombre: data.nombre || "",
          nit: data.nit || "",
          direccion: data.direccion || "",
          ciudad: data.ciudad || "",
          pais: data.pais || "",
          correoFacturacion: data.correo_facturacion || "",
          personaContacto: data.persona_contacto || "",
          telefono: data.telefono || "",
          celular: data.celular || "",
          cargo: data.cargo || "",
          correoElectronico: data.correo_electronico || "",
          fechaDiligenciamiento: formatDate(data.fecha_diligenciamiento) || "",
          anioReportado: data.ano_reportado || "",
          empresasRepresentadas: data.empresas || "",
          reporte: data.tipo_reporte || "unitario",
        });

        const nuevoEstado = data.estado || "Guardado";
        setEstado(prev => {
          if (prev !== nuevoEstado) {
            onEstadoChange && onEstadoChange(nuevoEstado);
          }
          return nuevoEstado;
        });
        
        // Solo controlar edición en modo normal
        if (!readonly) {
          // Usar estadoInformacionF para controlar edición
          const estadoActual = data.estado || "Guardado";
          if (estadoActual === "Guardado" || estadoActual === "Rechazado") {
            setIsDisabled(false);
          } else {
            setIsDisabled(true);
          }
          if (estadoActual === "Aprobado") {
            alert("Felicidades, tu formulario ha sido aprobado.");
          } else if (estadoActual === "Rechazado") {
            alert("Por favor verifica tu información, tu formulario ha sido rechazado.");
          }
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, [readonly, propIdInformacionF]); // Agregar dependencias

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const idUsuario = localStorage.getItem("id");

    // Si la fecha está vacía, usar la fecha actual
    let fechaFinal = formData.fechaDiligenciamiento;
    if (!fechaFinal) {
      fechaFinal = new Date().toISOString().split('T')[0];
    }
    
    // Validar años duplicados antes de enviar
    const anoDiligenciamiento = new Date(fechaFinal).getFullYear().toString();
    const anosDuplicadosValidos = await validarAnosDuplicados(anoDiligenciamiento, formData.anioReportado);
    if (!anosDuplicadosValidos) {
      alert("No se puede guardar el formulario: " + errorDuplicado);
      setIsLoading(false);
      return;
    }
    
    // Validar que ningún campo esté vacío (excepto fecha, que ya se corrige)
    const camposRequeridos = [
      'nombre', 'nit', 'direccion', 'ciudad', 'pais', 
      'correoFacturacion', 'personaContacto', 'telefono', 
      'celular', 'cargo', 'correoElectronico', 
      'anioReportado', 'empresasRepresentadas'
    ];
    // Creamos un nuevo objeto para validar y enviar
    const formDataFinal = {
      ...formData,
      fechaDiligenciamiento: fechaFinal
    };
    console.log("Estado actual de formData:", formDataFinal);
    const camposVacios = camposRequeridos.filter(campo => !formDataFinal[campo]);

    if (camposVacios.length > 0) {
      alert("Por favor completa todos los campos del formulario.");
      setIsLoading(false);
      return;
    }

    // Validar que telefono y celular sean de 10 dígitos
    const regexTelefono = /^\d{10}$/;
    if (!regexTelefono.test(formDataFinal.telefono)) {
      alert("El campo Teléfono debe tener exactamente 10 dígitos.");
      setIsLoading(false);
      return;
    }
    if (!regexTelefono.test(formDataFinal.celular)) {
      alert("El campo Celular debe tener exactamente 10 dígitos.");
      setIsLoading(false);
      return;
    }

    const updatedFormData = {
      ...formDataFinal,
      idUsuario,
    };
    console.log("Datos del formulario a enviar:", updatedFormData);

    try {
      // Verificar si el usuario ya tiene datos guardados
      const checkResponse = await fetch(`${API_BASE_URL}/informacion-f/getByIdUsuario/${idUsuario}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (checkResponse.ok) {
        const idInformacionF = localStorage.getItem("idInformacionF");
        // Si ya existen datos, actualizarlos
        const response = await fetch(`${API_BASE_URL}/informacion-f/actualizarInformacion/${idInformacionF}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFormData),
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Formulario actualizado:", result);
        alert("Formulario actualizado correctamente.");
        
        // Actualizar localStorage con el estado actual
        localStorage.setItem("estadoInformacionF", "Guardado");
        setEstado(prev => {
          if (prev !== "Guardado") {
            onEstadoChange && onEstadoChange("Guardado");
          }
          return "Guardado";
        });
      } else if (checkResponse.status === 500) { // antes 500, usar 404 para crear
        // Validar anioReportado antes de crear
        if (!allowedYears.map(String).includes(updatedFormData.anioReportado.toString())) {
          updatedFormData.anioReportado = allowedYears[0].toString();
        }
        const response = await fetch(`${API_BASE_URL}/informacion-f/crearInformacion`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFormData),
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Formulario creado:", result);
        alert("Formulario creado correctamente.");
        localStorage.setItem("idInformacionF", result.data.idInformacionF);
        // Guardar tipoReporte en localStorage al crear nuevo registro
        localStorage.setItem("tipoReporte", updatedFormData.reporte || "unitario");
        // Guardar estado como "Guardado"
        localStorage.setItem("estadoInformacionF", "Guardado");
        setEstado(prev => {
          if (prev !== "Guardado") {
            onEstadoChange && onEstadoChange("Guardado");
          }
          return "Guardado";
        });
      } else {
        throw new Error(`Error ${checkResponse.status}: ${checkResponse.statusText}`);
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert("Hubo un error al enviar el formulario.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        "flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded relative " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
      style={{ minHeight: '100vh' }}
    >
      {/* Loader Backdrop Overlay */}
      <Backdrop
        sx={{ color: '#2563eb', zIndex: (theme) => theme.zIndex.modal + 1000 }}
        open={isLoading}
      >
        <div className="flex flex-col items-center">
          <Oval
            height={60}
            width={60}
            color="#2563eb"
            secondaryColor="#60a5fa"
            strokeWidth={5}
            ariaLabel="oval-loading"
            visible={true}
          />
          <span className="text-blue-700 font-semibold mt-4 bg-white px-4 py-2 rounded-lg shadow">Guardando información...</span>
        </div>
      </Backdrop>
      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        className="mx-auto my-32 bg-white p-5 rounded-lg shadow-lg max-w-xl z-40 max-h-460-px overflow-y-auto outline-none"
        overlayClassName=""
        contentLabel="Instructivo de la sección"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="text-xl font-bold mb-4">Instructivo de la sección</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">#</th>
                <th className="border border-gray-300 px-4 py-2">Campo</th>
                <th className="border border-gray-300 px-4 py-2">Tipo</th>
                <th className="border border-gray-300 px-4 py-2">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["1", "Nombre o Razón Social", "Texto", "Razón social o nombre de la persona natural o jurídica participante."],
                ["2", "NIT", "Número", "Número de Identificación Tributaria."],
                ["3", "Dirección", "Texto", "Dirección de recepción de notificaciones."],
                ["4", "Ciudad", "Texto", "Ciudad correspondiente a la Dirección de Notificación."],
                ["5", "Casa matriz", "Texto", "Nacional de la empresa inscrita al Plan."],
                ["6", "Correo de Facturación", "Texto", "Correo electrónico de la persona que recibe facturas."],
                ["7", "Persona de Contacto", "Texto", "Nombre de la persona encargada de los trámites."],
                ["8", "Teléfono", "Número", "Teléfono de contacto con el Representante Legal."],
                ["9", "Cargo", "Texto", "Cargo de la persona de contacto."],
                ["10", "Correo Electrónico", "Texto", "Correo de la persona de contacto de la empresa."],
                ["11", "Fecha de diligenciamiento", "Número", "Fecha de presentación del formulario."],
                ["12", "Año reportado", "Número", "Año para el cual se reporta la información."],
                ["13", "Empresas Representadas", "Número", "Cantidad de empresas representadas en el plan."],
              ].map((row, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          className="bg-blueGray-600 text-white px-4 py-2 rounded mt-3"
          onClick={() => setIsOpen(false)}
        >
          Cerrar
        </button>
      </Modal>
      {/* Modal para Reporte Unitario */}
      <Modal
        isOpen={isUnitarioOpen}
        onRequestClose={() => setIsUnitarioOpen(false)}
        className="mx-auto my-32 bg-white p-5 rounded-lg shadow-lg max-w-xl z-40 max-h-460-px overflow-y-auto outline-none"
        overlayClassName=""
        contentLabel="Información sobre Reporte Unitario"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="text-xl font-bold mb-4">Información sobre Reporte Unitario</h2>
        <p>Reporte en donde las empresas vinculadas reportan los productos uno a uno con el peso de los envases y empaques unitarios y con las unidades puestas en el mercado.</p>
        <button
          className="bg-blueGray-600 text-white px-4 py-2 rounded mt-3"
          onClick={() => setIsUnitarioOpen(false)}
        >
          Cerrar
        </button>
      </Modal>

      {/* Modal para Reporte Totalizado */}
      <Modal
        isOpen={isTotalizadoOpen}
        onRequestClose={() => setIsTotalizadoOpen(false)}
        className="mx-auto my-32 bg-white p-5 rounded-lg shadow-lg max-w-xl z-40 max-h-460-px overflow-y-auto outline-none"
        overlayClassName=""
        contentLabel="Información sobre Reporte Totalizado"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="text-xl font-bold mb-4">Información sobre Reporte Totalizado</h2>
        <p>Reporte en donde las empresas vinculadas reportan el total de los productos puestos en el mercado con el total del peso por material y las unidades puestas en el mercado es de 1</p>
        <button
          className="bg-blueGray-600 text-white px-4 py-2 rounded mt-3"
          onClick={() => setIsTotalizadoOpen(false)}
        >
          Cerrar
        </button>
      </Modal>

      {/* Modal de tratamiento de datos - Siempre renderizado, visibilidad controlada por useEffect */}
      <Modal
        isOpen={consentOpen}
        onRequestClose={() => { /* bloqueado: sin cierre */ }}
        shouldCloseOnOverlayClick={false}
        ariaHideApp={false}
        className="mx-auto my-32 bg-white p-6 rounded-lg shadow-lg max-w-xl outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        contentLabel="Tratamiento de datos"
        style={{
          overlay: {
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          content: {
            zIndex: 10000,
            position: 'relative',
            margin: 'auto',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '2px solid #3b82f6'
          }
        }}
      >
        <div style={{ zIndex: 10001, position: 'relative' }}>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#1f2937' }}>Tratamiento de datos personales</h2>
          <p className="text-gray-700 mb-4">
            Para continuar, debe aceptar la política de tratamiento de datos. Al hacer clic en "Aceptar" autoriza el tratamiento de sus datos personales conforme a nuestra política.
          </p>
          <div className="flex gap-6 justify-end">
            <button 
              onClick={rechazarTratamiento} 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              style={{ zIndex: 10002 }}
            >
              Rechazar
            </button>
            <button 
              onClick={aceptarTratamiento} 
              className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded"
              style={{ zIndex: 10002 }}
            >
              Aceptar
            </button>
          </div>
        </div>
      </Modal>

      {/* SECCIÓN I */}
      <div className="p-4 border-b">
        {/* Título con Icono */}
        <h3 className="text-lg font-semibold flex items-center">
          Información sobre el vinculado&nbsp;
          <i
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
            onClick={() => {
              console.log('Icon clicked, opening modal');
              setIsOpen(true);
            }}
          ></i>
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="nombre">Nombre o razón social</label>
              <input
                className="border p-2 w-full bg-gray-100"
                type="text"
                name="nombre"
                id="nombre"
                placeholder="Nombre o razón social"
                value={formData.nombre}
                readOnly
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="nit">NIT</label>
              <input
                className="border p-2 w-full bg-gray-100"
                type="text"
                name="nit"
                id="nit"
                placeholder="NIT"
                value={formData.nit}
                readOnly
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="direccion">Dirección</label>
              <input
                className="border p-2 w-full"
                type="text"
                name="direccion"
                id="direccion"
                placeholder="Dirección"
                value={formData.direccion}
                onChange={handleChange}
                disabled={isDisabled}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="ciudad">Ciudad</label>
              <input
                className="border p-2 w-full"
                type="text"
                name="ciudad"
                id="ciudad"
                placeholder="Ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                disabled={isDisabled}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="pais">País Casa matriz</label>
              <input
                className="border p-2 w-full"
                type="text"
                name="pais"
                id="pais"
                placeholder="País casa matriz"
                value={formData.pais}
                onChange={handleChange}
                disabled={isDisabled}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="correoFacturacion">Correo de Facturación</label>
              <input
                className="border p-2 w-full"
                type="email"
                name="correoFacturacion"
                id="correoFacturacion"
                placeholder="Correo de facturación"
                value={formData.correoFacturacion}
                onChange={handleChange}
                disabled={isDisabled}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="personaContacto">Persona de contacto</label>
              <input
                className="border p-2 w-full"
                type="text"
                name="personaContacto"
                id="personaContacto"
                placeholder="Persona de contacto"
                value={formData.personaContacto}
                onChange={handleChange}
                disabled={isDisabled}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="telefono">Teléfono y extensión</label>
              <input
                className="border p-2 w-full"
                type="text"
                name="telefono"
                id="telefono"
                placeholder="Teléfono y extensión"
                value={formData.telefono}
                onChange={handleChange}
                disabled={isDisabled}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="celular">Celular</label>
              <input
                className="border p-2 w-full"
                type="text"
                name="celular"
                id="celular"
                placeholder="Celular"
                value={formData.celular}
                onChange={handleChange}
                disabled={isDisabled}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="cargo">Cargo</label>
              <input
                className="border p-2 w-full"
                type="text"
                name="cargo"
                id="cargo"
                placeholder="Cargo"
                value={formData.cargo}
                onChange={handleChange}
                disabled={isDisabled}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="correoElectronico">Correo electrónico</label>
              <input
                className="border p-2 w-full"
                type="text"
                name="correoElectronico"
                id="correoElectronico"
                placeholder="Correo electrónico"
                value={formData.correoElectronico}
                onChange={handleChange}
                disabled={isDisabled}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="fechaDiligenciamiento">Fecha de diligenciamiento</label>
              <input
                className="border p-2 w-full"
                type="date"
                name="fechaDiligenciamiento"
                id="fechaDiligenciamiento"
                placeholder="Fecha de diligenciamiento"
                onChange={handleChange}
                disabled={isDisabled}
                value={formData.fechaDiligenciamiento ? formatDate(formData.fechaDiligenciamiento) : new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="anioReportado">Año reportado</label>
              <select
                className="border p-2 w-full"
                name="anioReportado"
                id="anioReportado"
                value={formData.anioReportado}
                onChange={handleChange}
                disabled={isDisabled}
                required
              >
                {allowedYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="empresasRepresentadas">Empresas Representadas</label>
              <select
                className="border p-2 w-full"
                name="empresasRepresentadas"
                id="empresasRepresentadas"
                value={formData.empresasRepresentadas}
                onChange={handleChange}
                disabled={isDisabled}
                required
              >
                <option value="">Seleccione el número de empresas representadas</option>
                {Array.from({ length: 49 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
                <option value="50+">50 o más</option>
              </select>
            </div>
          </div>
          
          {/* Mensaje de error de duplicados */}
          {errorDuplicado && (
            <div className="mb-4">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{errorDuplicado}</span>
              </div>
            </div>
          )}
          {validandoDuplicado && (
            <div className="mb-4">
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">Validando años...</span>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <label className="mr-4">
              <input
                type="radio"
                name="reporte"
                value="unitario"
                checked={formData.reporte === "unitario"}
                onChange={handleChange}
                disabled={isDisabled}
              />{" "}
              Reporte Unitario
              <i
                className="fa-solid fa-circle-info text-blue-500 cursor-pointer ml-2"
                onClick={() => setIsUnitarioOpen(true)}
              ></i>
            </label>
            <label>
              <input
                type="radio"
                name="reporte"
                value="totalizado"
                checked={formData.reporte === "totalizado"}
                onChange={handleChange}
                disabled={isDisabled}
              />{" "}
              Reporte Totalizado
              <i
                className="fa-solid fa-circle-info text-blue-500 cursor-pointer ml-2"
                onClick={() => setIsTotalizadoOpen(true)}
              ></i>
            </label>
          </div>         
          {!readonly && (
            <button
              type="submit"
              className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
              disabled={isDisabled || isSaveDisabled}
            >
              Guardar
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
  onEstadoChange: PropTypes.func,
};