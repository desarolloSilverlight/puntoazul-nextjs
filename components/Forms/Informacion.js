import React, { useState } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
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
    reporte: "",
  });

  const [isOpen, setIsOpen] = useState(false);

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
  
    // Crear el objeto formData a partir del estado actual
    const formData = {
      nombre: formData.nombre,
      nit: formData.nit,
      direccion: formData.direccion,
      ciudad: formData.ciudad,
      pais: formData.pais,
      correoFacturacion: formData.correoFacturacion,
      personaContacto: formData.personaContacto,
      telefono: formData.telefono,
      celular: formData.celular,
      cargo: formData.cargo,
      correoElectronico: formData.correoElectronico,
      fechaDiligenciamiento: formData.fechaDiligenciamiento,
      anioReportado: formData.anioReportado,
      empresasRepresentadas: formData.empresasRepresentadas,
      reporte: formData.reporte,
    };
  
    try {
      // Enviar los datos al backend
      const response = await fetch('https://nestbackend.fidare.com/informacion-b/createInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Incluir cookies si es necesario
        body: JSON.stringify(formData), // Convertir los datos a JSON
      });
  
      // Verificar si la respuesta es correcta
      if (!response.ok) {
        const errorText = await response.text(); // Obtener respuesta en texto para debug
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
  
      // Procesar la respuesta del servidor
      const result = await response.json();
      console.log('Respuesta de la API:', result); // Ver respuesta en consola
      alert(result.message); // Mostrar mensaje del servidor
      // localStorage.setItem('idInformacionB', result.data.idInformacionB); // Guardar id en localStorage
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      alert(`Error: ${error.message}`); // Mostrar error en una alerta
    }
  };

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            Información sobre el vinculado&nbsp;
            <i
              className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
              onClick={() => setIsOpen(true)}
            ></i>
          </h3>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <input
              className="border p-2"
              type="text"
              name="nombre"
              placeholder="Nombre o razón social"
              value={formData.nombre}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="nit"
              placeholder="NIT"
              value={formData.nit}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="direccion"
              placeholder="Dirección"
              value={formData.direccion}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="ciudad"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="pais"
              placeholder="Pais Casa matriz"
              value={formData.pais}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="correoFacturacion"
              placeholder="Correo de Facturación"
              value={formData.correoFacturacion}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="personaContacto"
              placeholder="Persona de contacto"
              value={formData.personaContacto}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="telefono"
              placeholder="Teléfono y extensión"
              value={formData.telefono}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="celular"
              placeholder="Celular"
              value={formData.celular}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="cargo"
              placeholder="Cargo"
              value={formData.cargo}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="correoElectronico"
              placeholder="Correo electrónico"
              value={formData.correoElectronico}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="date"
              name="fechaDiligenciamiento"
              value={formData.fechaDiligenciamiento}
              onChange={handleChange}
            />
            <input
              className="border p-2"
              type="text"
              name="anioReportado"
              placeholder="Año reportado"
              value={formData.anioReportado}
              onChange={handleChange}
            />
            <select
              className="border p-2"
              name="empresasRepresentadas"
              value={formData.empresasRepresentadas}
              onChange={handleChange}
            >
              {Array.from({ length: 49 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
              <option value="50+">50 o más</option>
            </select>
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
            </label>
          </div>
          <button
            type="submit"
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
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
                    ["13", "Empresas Representadas", "Número", "Cantidad de empresas representadas en el plan."]
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