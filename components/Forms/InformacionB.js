import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../utils/config";

export default function FormularioAfiliado({ color, idUsuario: propIdUsuario, estado: propEstado, readonly = false, idInformacionB: propIdInformacionB, onEstadoChange }) {
  // Necesario para accesibilidad con react-modal
  if (typeof window !== "undefined") {
    Modal.setAppElement("#__next");
  }
  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    ciudad: "",
    telefono: "",
    representante: "",
    telefonoRe: "",
    contactoRe: "",
    cargo: "",
    correoRe: "",
    ano: new Date().getFullYear().toString(), // Inicializar con el año actual
    anoReporte: (new Date().getFullYear() - 1).toString(), // Inicializar con el año anterior
    titulares: "",
    origen: "",
    correoFacturacion: "",
  });
  const [estado, setEstado] = useState(propEstado || ""); // Estado del formulario
  const [isDisabled, setIsDisabled] = useState(readonly); // Controlar si los campos están bloqueados
  const [isSaveDisabled, setIsSaveDisabled] = useState(false); // Controlar si el botón "Guardar" está deshabilitado
  const [isOpen, setIsOpen] = useState(false); // Estado para el modal
  const [errorDuplicado, setErrorDuplicado] = useState(""); // Estado para error de años duplicados
  const [validandoDuplicado, setValidandoDuplicado] = useState(false); // Estado para indicar validación en curso
  
  // Estados para modal de tratamiento de datos
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentLoading, setConsentLoading] = useState(true);

  // Actualizar estado cuando cambie la prop
  React.useEffect(() => {
    if (propEstado) {
      setEstado(prev => {
        if (prev !== propEstado) {
          onEstadoChange && onEstadoChange(propEstado);
        }
        return propEstado;
      });
      if (propEstado === "Iniciado" || propEstado === "Guardado" || propEstado === "Rechazado") {
        setIsDisabled(false);
      } else {
        setIsDisabled(true);
      }
    }
  }, [propEstado, onEstadoChange]);

  // Modal de tratamiento de datos - Solo aparece cuando el estado es "Iniciado"
  useEffect(() => {
    console.log("Estado actual en InformacionB.js:", estado);
    // Solo mostrar el modal cuando el estado es "Iniciado"
    if (estado === "Iniciado") {
      console.log("Mostrando modal de tratamiento (InformacionB.js)");
      setConsentOpen(true);
    } else {
      console.log("Ocultando modal de tratamiento (InformacionB.js)");
      setConsentOpen(false);
    }
    setConsentLoading(false);
  }, [estado]); // Solo depende del estado del formulario

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
  const validarAnosDuplicados = async (ano, anoReporte) => {
    if (!ano || !anoReporte) return true; // Si no hay valores, no validar
    
    // Usar el NIT del formulario en lugar del ID
    const nit = formData.nit;
    if (!nit) return true;

    try {
      setValidandoDuplicado(true);
      setErrorDuplicado("");
      
      const response = await fetch(`${API_BASE_URL}/informacion-b/validarAnosDuplicados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUsuario: nit,
          ano: ano,
          anoReporte: anoReporte
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

  // Años permitidos para anoReporte: año actual -2 y -1
  const currentYear = new Date().getFullYear();
  const allowedYearsReporte = [currentYear - 1, currentYear - 2];
  
  // Años permitidos para ano: año actual y año anterior
  const allowedYears = [currentYear, currentYear - 1];

  // Asegurar valor inicial válido si no viene del backend
  useEffect(() => {
    if (!formData.anoReporte) {
      setFormData(prev => ({ ...prev, anoReporte: allowedYearsReporte[0].toString() }));
    } else if (!allowedYearsReporte.map(String).includes(formData.anoReporte)) {
      setFormData(prev => ({ ...prev, anoReporte: allowedYearsReporte[0].toString() }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.anoReporte]);

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
        let url;
        
        // Si está en modo readonly y tiene propIdInformacionB, usar datos del cliente específico
        if (readonly && propIdInformacionB) {
          console.log("Modo validación: cargando datos del cliente con idInformacionB:", propIdInformacionB);
          url = `${API_BASE_URL}/informacion-b/getInformacion/${propIdInformacionB}`;
        } else {
          // Modo normal: usar datos del usuario logueado
          const idUsuario = propIdUsuario || localStorage.getItem("id");
          console.log("Modo normal: cargando datos del usuario con idUsuario:", idUsuario);
          url = `${API_BASE_URL}/informacion-b/getByIdUsuario/${idUsuario}`;
        }
        
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron datos para este usuario/ID.");
            return; // Si no hay datos, no hacemos nada
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Datos obtenidos:", data);
        
    if (!readonly) {
      localStorage.setItem("idInformacionB", data.idInformacionB);
      localStorage.setItem("estadoInformacionB", data.estado);
    }
        
        // Llenar los campos del formulario con los datos obtenidos
        setFormData({
          nombre: data.nombre || "",
          nit: data.nit || "",
          direccion: data.direccion || "",
          ciudad: data.ciudad || "",
          telefono: data.telefono || "",
          representante: data.representante || "",
          telefonoRe: data.telefonoRe || "",
          contactoRe: data.contactoRe || "",
          cargoRe: data.cargoRe || "",
          correoRe: data.correoRe || "",
          ano: data.ano || "",
          anoReporte: data.anoReporte || "",
          titulares: data.titulares || "",
          origen: data.origen || "",
          correoFacturacion: data.correoFacturacion || "",
        });

        // Manejar el estado del formulario según el valor de "estado"
        setEstado(prev => {
          if (prev !== data.estado) {
            onEstadoChange && onEstadoChange(data.estado);
          }
          return data.estado;
        });
        
        // Solo controlar edición en modo normal
        if (!readonly) {
          // Usar estadoInformacionB para controlar edición
          if (data.estado === "Iniciado" || data.estado === "Guardado" || data.estado === "Rechazado") {
            setIsDisabled(false);
          } else {
            setIsDisabled(true);
          }
          if (data.estado === "Aprobado") {
            alert("Felicidades, tu formulario ha sido aprobado.");
          } else if (data.estado === "Rechazado") {
            alert("Por favor verifica tu información, tu formulario ha sido rechazado.");
          }
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, [propIdUsuario, propIdInformacionB, readonly]); // Agregar dependencias

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar años duplicados antes de enviar
    const anosDuplicadosValidos = await validarAnosDuplicados(formData.ano, formData.anoReporte);
    if (!anosDuplicadosValidos) {
      alert("No se puede guardar el formulario: " + errorDuplicado);
      return;
    }
    
    // Validar teléfono y telefonoRe de 10 dígitos
    const telefono = formData.telefono ? formData.telefono.trim() : "";
    const telefonoRe = formData.telefonoRe ? formData.telefonoRe.trim() : "";
    const regexTelefono = /^\d{10}$/;
    if (telefono && !regexTelefono.test(telefono)) {
      alert("El campo Teléfono debe tener exactamente 10 dígitos.");
      return;
    }
    if (telefonoRe && !regexTelefono.test(telefonoRe)) {
      alert("El campo Teléfono Representante debe tener exactamente 10 dígitos.");
      return;
    }
    const idUsuario = localStorage.getItem("id"); // Obtener el idUsuario desde localStorage
    const updatedFormData = {
      ...formData,
      idUsuario,
    };
    // Mostrar un alert de confirmación
    const isConfirmed = window.confirm("¿Estás seguro de que los datos ingresados son correctos?");
    if (!isConfirmed) {
      return; // Si el usuario cancela, no se ejecuta la lógica de guardar
    }
    console.log("Datos del formulario a enviar:", updatedFormData);

    try {
      // Verificar si el usuario ya tiene datos guardados
      const checkResponse = await fetch(`${API_BASE_URL}/informacion-b/getByIdUsuario/${idUsuario}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (checkResponse.ok) {
        // Si ya existen datos, actualizarlos
        const response = await fetch(`${API_BASE_URL}/informacion-b/updateInfo`, {
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
        // Actualizar estado a "Guardado"
        localStorage.setItem("estadoInformacionB", "Guardado");
        setEstado(prev => {
          if (prev !== "Guardado") {
            onEstadoChange && onEstadoChange("Guardado");
          }
          return "Guardado";
        });
        setIsDisabled(false); // Permitir edición en estado Guardado
  // Mantener estado en "Guardado"; el cambio a "Pendiente" solo ocurre desde "Enviar formulario"
      } else if (checkResponse.status === 404) {
        // Si no existen datos, crearlos
        const response = await fetch(`${API_BASE_URL}/informacion-b/createInfo`, {
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
        const newId = result?.data?.idInformacionB || result?.idInformacionB;
        if (newId) {
          localStorage.setItem("idInformacionB", newId); // Guardar id en localStorage
          // Forzar estado "Guardado" en el backend para NO quedar en "Pendiente" por defecto
          try {
            const respEstado = await fetch(`${API_BASE_URL}/informacion-b/updateEstado/${newId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ estado: "Guardado", tendencia: "", motivo: "Guardado inicial" })
            });
            if (!respEstado.ok) {
              console.warn("No se pudo establecer estado Guardado en backend tras crear. Continuando...", await respEstado.text());
            }
          } catch (e) {
            console.warn("Fallo al actualizar estado a Guardado tras crear:", e);
          }
        }
        // Actualizar estado local y localStorage a "Guardado"
        localStorage.setItem("estadoInformacionB", "Guardado");
        setEstado(prev => {
          if (prev !== "Guardado") {
            onEstadoChange && onEstadoChange("Guardado");
          }
          return "Guardado";
        });
        setIsDisabled(false); // Permitir edición en estado Guardado
  // Mantener estado en "Guardado"; el cambio a "Pendiente" solo ocurre desde "Enviar formulario"
      } else {
        throw new Error(`Error ${checkResponse.status}: ${checkResponse.statusText}`);
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert("Hubo un error al enviar el formulario.");
    }
  };

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded p-6 " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            Información sobre el Afiliado&nbsp;
            <i
              className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
              onClick={() => setIsOpen(true)}
            ></i>
          </h3>

          {/* Primera fila */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="nombre">Nombre o razón social</label>
              <input
                name="nombre"
                id="nombre"
                className="border p-2 w-full bg-gray-100"
                type="text"
                placeholder="Nombre o razón social"
                value={formData.nombre}
                readOnly
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="nit">NIT</label>
              <input
                name="nit"
                id="nit"
                className="border p-2 w-full bg-gray-100"
                type="text"
                placeholder="NIT"
                value={formData.nit}
                readOnly
                required
              />
            </div>
          </div>

          {/* Segunda fila */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="direccion">Dirección</label>
              <input
                name="direccion"
                id="direccion"
                className="border p-2 w-full"
                type="text"
                placeholder="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="ciudad">Ciudad</label>
              <input
                name="ciudad"
                id="ciudad"
                className="border p-2 w-full"
                type="text"
                placeholder="Ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="telefono">Teléfono</label>
              <input
                name="telefono"
                id="telefono"
                className="border p-2 w-full"
                type="text"
                placeholder="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* Tercera fila */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="representante">Representante Legal</label>
              <input
                name="representante"
                id="representante"
                className="border p-2 w-full"
                type="text"
                placeholder="Representante Legal"
                value={formData.representante}
                onChange={(e) => setFormData({ ...formData, representante: e.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="telefonoRe">Teléfono Representante</label>
              <input
                name="telefonoRe"
                id="telefonoRe"
                className="border p-2 w-full"
                type="text"
                placeholder="Teléfono Representante"
                value={formData.telefonoRe}
                onChange={(e) => setFormData({ ...formData, telefonoRe: e.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="contactoRe">Persona de contacto</label>
              <input
                name="contactoRe"
                id="contactoRe"
                className="border p-2 w-full"
                type="text"
                placeholder="Persona de contacto"
                value={formData.contactoRe}
                onChange={(e) => setFormData({ ...formData, contactoRe: e.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="cargoRe">Cargo</label>
              <input
                name="cargoRe"
                id="cargoRe"
                className="border p-2 w-full"
                type="text"
                placeholder="Cargo"
                value={formData.cargoRe}
                onChange={(e) => setFormData({ ...formData, cargoRe: e.target.value })}
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="correoRe">Correo</label>
              <input
                name="correoRe"
                id="correoRe"
                className="border p-2 w-full"
                type="email"
                placeholder="Correo"
                value={formData.correoRe}
                onChange={(e) => setFormData({ ...formData, correoRe: e.target.value })}
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* Cuarta fila */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="ano">Año de diligenciamiento</label>
              <select
                name="ano"
                id="ano"
                className="border p-2 w-full"
                value={formData.ano}
                onChange={(e) => {
                  const nuevoAno = e.target.value;
                  setFormData({ ...formData, ano: nuevoAno });
                  // Validar duplicados cuando cambia el año
                  if (nuevoAno && formData.anoReporte) {
                    validarAnosDuplicados(nuevoAno, formData.anoReporte);
                  }
                }}
                disabled={isDisabled}
                required
              >
                {allowedYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="anoReporte">Año reporte</label>
              <select
                name="anoReporte"
                id="anoReporte"
                className="border p-2 w-full"
                value={formData.anoReporte}
                onChange={(e) => {
                  const nuevoAnoReporte = e.target.value;
                  setFormData({ ...formData, anoReporte: nuevoAnoReporte });
                  // Validar duplicados cuando cambia el año reporte
                  if (formData.ano && nuevoAnoReporte) {
                    validarAnosDuplicados(formData.ano, nuevoAnoReporte);
                  }
                }}
                disabled={isDisabled}
                required
              >
                {allowedYearsReporte.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="titulares">Titulares Representados</label>
              <input
                name="titulares"
                id="titulares"
                className="border p-2 w-full"
                type="number"
                placeholder="Titulares Representados"
                value={formData.titulares}
                onChange={(e) => setFormData({ ...formData, titulares: e.target.value })}
                disabled={isDisabled}
              />
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

          {/* Quinta fila */}
          <div className="grid grid-cols-3 gap-4 mb-4">
          </div>

          {/* Quinta fila */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="origen">Origen</label>
              <select
                name="origen"
                id="origen"
                className="border p-2 w-full"
                value={formData.origen}
                onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                disabled={isDisabled}
              >
                <option value="">Seleccione ...</option>
                <option value="Nacional">Nacional</option>
                <option value="Multinacional">Multinacional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" htmlFor="correoFacturacion">Correo de facturación</label>
              <input
                name="correoFacturacion"
                id="correoFacturacion"
                className="border p-2 w-full"
                type="email"
                placeholder="Correo de facturación"
                value={formData.correoFacturacion}
                onChange={(e) => setFormData({ ...formData, correoFacturacion: e.target.value })}
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* Sexta fila */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            
          </div>

          {/* Botón Guardar - Solo visible si no es readonly */}
          {!readonly && (
            <button
              type="submit"
              className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
              disabled={isDisabled || isSaveDisabled}
            >
              Guardar
            </button>
          )}
        </div>
      </form>

      {/* Modal using react-modal */}
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        contentLabel="Instructivo de la sección"
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '20px',
            border: 'none',
            borderRadius: '8px',
          },
        }}
      >
        <div>
          <h2 className="text-xl font-bold mb-4">Instructivo de la sección</h2>
            {/* Tabla con información */}
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
                    ["1", "Nombre o Razón Social", "Texto", "Razón social/Nombre de la persona natural o jurídica participante del plan colectivo de posconsumo de medicamentos de uso humano que presenta la información. Asociado a la Corporación Punto Azul."],
                    ["2", "NIT", "Número", "Número de Identificación Tributaria de la persona natural o jurídica."],
                    ["3", "Dirección", "Texto", "Dirección de recepción de notificaciones realizadas en los trámites ante la Autoridad Nacional de Licencias Ambientales - ANLA y la Corporación Punto Azul - CPA."],
                    ["4", "Ciudad", "Texto", "Ciudad correspondiente a la dirección de notificación."],
                    ["5", "Telefono", "Número", "Teléfono de contacto de la persona encargada del trámite por parte de la empresa."],
                    ["6", "Representante Legal", "Texto", "Nombre del representante legal de la empresa."],
                    ["7", "Telefono", "Número", "Teléfono de contacto con el Representante Legal para notificaciones correspondientes."],
                    ["8", "Persona de Contacto", "Texto", "Nombre de contacto de la persona por parte de la empresa, quien está a cargo de los trámites, temas o actividades competentes ante la CPA."],
                    ["9", "Cargo", "Texto", "Cargo de la persona de contacto por parte de la empresa a quien la CPA comunica la gestión, reuniones y otras actividades en el marco del objeto social de la CPA."],
                    ["10", "Correo electrónico", "Texto", "Correo electrónico de la persona de contacto de la empresa."],
                    ["11", "Año", "Número", "Fecha de presentación del Formato del Literal B. (año actual)"],
                    ["12", "Año reporte de productos", "Número", "Año para el cual se reporta la información respecto a registros sanitarios y productos comercializados. Año inmediatamente anterior al vigente."],
                    ["13", "Titulares representados", "Número", "Cantidad de titulares de registros sanitarios representados en el plan por la empresa asociada a la Corporación, adicional a esta última."],
                    ["14", "Capital de origen (Nacional o Multinacional)", "Texto", "Diligencie si el capital de origen de su compañía es Nacional o Multinacional."],
                    ["15", "Correo de Facturación", "Texto", "Diligencie el correo de facturación de su compañía."],
                  ].map((row, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-4 py-2">{cell}</td>
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
          </div>
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
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
  idUsuario: PropTypes.string,
  estado: PropTypes.string,
  readonly: PropTypes.bool,
  idInformacionB: PropTypes.string,
  onEstadoChange: PropTypes.func,
};
