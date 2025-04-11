import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
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
    ano: "",
    anoReporte: "",
    titulares: "",
    origen: "",
    correoFacturacion: "",
  });
  const [estado, setEstado] = useState(""); // Estado del formulario
  const [isDisabled, setIsDisabled] = useState(false); // Controlar si los campos están bloqueados
  const [isOpen, setIsOpen] = useState(false); // Estado para el modal

  // Obtener datos del backend al cargar el componente
  useEffect(() => {
    const fetchData = async () => {
      const idUsuario = localStorage.getItem("id"); // Obtener el idUsuario desde localStorage
      try {
        const response = await fetch(`https://nestbackend.fidare.com/informacion-b/getByIdUsuario/${idUsuario}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron datos para este usuario.");
            return; // Si no hay datos, no hacemos nada
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Datos obtenidos:", data);
        localStorage.setItem("idInformacionB", data.idInformacionB); // Guardar id en localStorage
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
          cargo: data.cargo || "",
          correoRe: data.correoRe || "",
          ano: data.ano || "",
          anoReporte: data.anoReporte || "",
          titulares: data.titulares || "",
          origen: data.origen || "",
          correoFacturacion: data.correoFacturacion || "",
        });

        // Manejar el estado del formulario según el valor de "estado"
        setEstado(data.estado);
        if (data.estado === "Pendiente") {
          setIsDisabled(true); // Bloquear los campos
        } else if (data.estado === "Aprobado") {
          alert("Felicidades, tu formulario ha sido aprobado.");
        } else if (data.estado === "Rechazado") {
          alert("Por favor verifica tu información, tu formulario ha sido rechazado.");
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, []);

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const idUsuario = localStorage.getItem("id"); // Obtener el idUsuario desde localStorage

    const updatedFormData = {
      ...formData,
      idUsuario,
    };

    try {
      // Verificar si el usuario ya tiene datos guardados
      const checkResponse = await fetch(`https://nestbackend.fidare.com/informacion-b/getByIdUsuario/${idUsuario}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (checkResponse.ok) {
        // Si ya existen datos, actualizarlos
        const response = await fetch("https://nestbackend.fidare.com/informacion-b/updateInfo", {
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
      } else if (checkResponse.status === 404) {
        // Si no existen datos, crearlos
        const response = await fetch("https://nestbackend.fidare.com/informacion-b/createInfo", {
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
        localStorage.setItem("idInformacionB", result.data.idInformacionB); // Guardar id en localStorage
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
            <input
              name="nombre"
              className="border p-2 w-full"
              type="text"
              placeholder="Nombre o razón social"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={isDisabled}
              required
            />
            <input
              name="nit"
              className="border p-2 w-full"
              type="text"
              placeholder="NIT"
              value={formData.nit}
              onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
              disabled={isDisabled}
              required
            />
          </div>

          {/* Segunda fila */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              name="direccion"
              className="border p-2 w-full"
              type="text"
              placeholder="Dirección"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="ciudad"
              className="border p-2 w-full"
              type="text"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="telefono"
              className="border p-2 w-full"
              type="text"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              disabled={isDisabled}
            />
          </div>

          {/* Tercera fila */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <input
              name="representante"
              className="border p-2 w-full"
              type="text"
              placeholder="Representante Legal"
              value={formData.representante}
              onChange={(e) => setFormData({ ...formData, representante: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="telefonoRe"
              className="border p-2 w-full"
              type="text"
              placeholder="Teléfono Representante"
              value={formData.telefonoRe}
              onChange={(e) => setFormData({ ...formData, telefonoRe: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="contactoRe"
              className="border p-2 w-full"
              type="text"
              placeholder="Persona de contacto"
              value={formData.contactoRe}
              onChange={(e) => setFormData({ ...formData, contactoRe: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="cargo"
              className="border p-2 w-full"
              type="text"
              placeholder="Cargo"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="correoRe"
              className="border p-2 w-full"
              type="email"
              placeholder="Correo"
              value={formData.correoRe}
              onChange={(e) => setFormData({ ...formData, correoRe: e.target.value })}
              disabled={isDisabled}
            />
          </div>

          {/* Cuarta fila */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              name="ano"
              className="border p-2 w-full"
              type="number"
              placeholder="Año"
              value={formData.ano}
              onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="anoReporte"
              className="border p-2 w-full"
              type="number"
              placeholder="Año reporte"
              value={formData.anoReporte}
              onChange={(e) => setFormData({ ...formData, anoReporte: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="titulares"
              className="border p-2 w-full"
              type="number"
              placeholder="Titulares Representados"
              value={formData.titulares}
              onChange={(e) => setFormData({ ...formData, titulares: e.target.value })}
              disabled={isDisabled}
            />
          </div>

          {/* Quinta fila */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <select
              name="origen"
              className="border p-2 w-full"
              value={formData.origen}
              onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
              disabled={isDisabled}
            >
              <option value="">Seleccione ...</option>
              <option value="Nacional">Nacional</option>
              <option value="Multinacional">Multinacional</option>
            </select>
            <input
              name="correoFacturacion"
              className="border p-2 w-full"
              type="email"
              placeholder="Correo de facturación"
              value={formData.correoFacturacion}
              onChange={(e) => setFormData({ ...formData, correoFacturacion: e.target.value })}
              disabled={isDisabled}
            />
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            disabled={isDisabled}
          >
            Guardar
          </button>
        </div>
      </form>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
          <div className="bg-white p-5 rounded-lg shadow-lg max-h-260-px overflow-y-auto">
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
                    ["1", "Nombre o Razón Social", "Texto", "Razón social o nombre de la persona natural o jurídica participante."],
                    ["2", "NIT", "Número", "Número de Identificación Tributaria."],
                    ["3", "Dirección", "Texto", "Dirección de recepción de notificaciones."],
                    ["4", "Ciudad", "Texto", "Ciudad correspondiente a la Dirección de Notificación."],
                    ["5", "Correo de Facturación", "Texto", "Correo electrónico de la persona que recibe facturas."],
                    ["6", "Persona de Contacto", "Texto", "Nombre de la persona encargada de los trámites."],
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
        </div>
      )}
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};
