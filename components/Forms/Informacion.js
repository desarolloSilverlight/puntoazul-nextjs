import React, { useState, useEffect } from "react";
import Modal from "react-modal";
// Necesario para accesibilidad con react-modal
if (typeof window !== "undefined") {
  Modal.setAppElement("#__next");
}
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
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

  const [estado, setEstado] = useState(""); // Estado del formulario
  const [isDisabled, setIsDisabled] = useState(false); // Controlar si los campos están bloqueados
  const [isSaveDisabled, setIsSaveDisabled] = useState(false); // Controlar si el botón "Guardar" está deshabilitado
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    console.log('Modal isOpen state:', isOpen);
  }, [isOpen]);
  const [isUnitarioOpen, setIsUnitarioOpen] = useState(false); // Estado para el modal de Reporte Unitario
  const [isTotalizadoOpen, setIsTotalizadoOpen] = useState(false); // Estado para el modal de Reporte Totalizado

  let timeoutId; // Variable para almacenar el temporizador

  // Función para manejar los cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Función para validar el año de reporte
  const handleAnoReporteChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, anioReportado: value }));

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (value.length === 4) {
        const anoReporte = parseInt(value, 10);
        const ano = new Date().getFullYear(); // Obtiene el año actual

        if (!isNaN(anoReporte) && !isNaN(ano)) {
          if (anoReporte !== ano - 3) {
            alert("El año de reporte solo puede ser de hace 3 años.");
            setIsSaveDisabled(true);
          } else {
            setIsSaveDisabled(false);
          }
        }
      }
    }, 1000);
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
// useEffect para traer nombre y nit del usuario al cargar el componente
  useEffect(() => {
    const fetchUsuario = async () => {
      const idUsuario = localStorage.getItem("id");
      if (!idUsuario) return;
      try {
        const response = await fetch(`https://nestbackend.fidare.com/users/getUsuario?id=${idUsuario}`, {
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
  }, []);
  // Obtener datos del backend al cargar el componente
  useEffect(() => {
    const fetchData = async () => {
      const idUsuario = localStorage.getItem("id");
      try {
        const response = await fetch(`https://nestbackend.fidare.com/informacion-f/getByIdUsuario/${idUsuario}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron datos para este usuario.");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Datos obtenidos:", data);
        localStorage.setItem("idInformacionF", data.idInformacionF);
        localStorage.setItem("estadoInformacionF", data.estado);

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

        setEstado(data.estado);
        if (data.estado === "Pendiente") {
          setIsDisabled(true);
        } else if (data.estado === "Aprobado") {
          alert("Felicidades, tu formulario ha sido aprobado.");
          setIsDisabled(true);
        } else if (data.estado === "Rechazado") {
          alert("Por favor verifica tu información, tu formulario ha sido rechazado.");
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, []);

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const idUsuario = localStorage.getItem("id");

    // Validar que ningún campo esté vacío
    const camposRequeridos = [
      'nombre', 'nit', 'direccion', 'ciudad', 'pais', 
      'correoFacturacion', 'personaContacto', 'telefono', 
      'celular', 'cargo', 'correoElectronico', 
      'fechaDiligenciamiento', 'anioReportado', 'empresasRepresentadas'
    ];

    const camposVacios = camposRequeridos.filter(campo => !formData[campo]);

    if (camposVacios.length > 0) {
      alert("Por favor completa todos los campos del formulario.");
      return;
    }

    // Validar que telefono y celular sean de 10 dígitos
    const regexTelefono = /^\d{10}$/;
    if (!regexTelefono.test(formData.telefono)) {
      alert("El campo Teléfono debe tener exactamente 10 dígitos.");
      return;
    }
    if (!regexTelefono.test(formData.celular)) {
      alert("El campo Celular debe tener exactamente 10 dígitos.");
      return;
    }

    const updatedFormData = {
      ...formData,
      idUsuario,
    };
    console.log("Datos del formulario a enviar:", updatedFormData);

    try {
      // Verificar si el usuario ya tiene datos guardados
      const checkResponse = await fetch(`https://nestbackend.fidare.com/informacion-f/getByIdUsuario/${idUsuario}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (checkResponse.ok) {
        // Si ya existen datos, actualizarlos
        const response = await fetch("https://nestbackend.fidare.com/informacion-f/actualizarInformacion", {
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
      } else if (checkResponse.status === 500) {
        // Si no existen datos, crearlos
        const response = await fetch("https://nestbackend.fidare.com/informacion-f/crearInformacion", {
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
        "flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
      style={{ minHeight: '100vh' }}
    >
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
                placeholder="País Casa matriz"
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
                placeholder="Correo de Facturación"
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
              <input
                className="border p-2 w-full"
                type="text"
                name="anioReportado"
                id="anioReportado"
                placeholder="Año reportado"
                value={formData.anioReportado}
                onChange={handleAnoReporteChange}
                disabled={isDisabled}
                required
              />
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
          <div className="mt-4">
            <label className="mr-4">
              <input
                type="radio"
                name="reporte"
                value="unitario"
                checked={formData.reporte === "unitario"}
                onChange={handleChange}
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
              />{" "}
              Reporte Totalizado
              <i
                className="fa-solid fa-circle-info text-blue-500 cursor-pointer ml-2"
                onClick={() => setIsTotalizadoOpen(true)}
              ></i>
            </label>
          </div>         
          <button
            type="submit"
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            disabled={isDisabled || isSaveDisabled}
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};