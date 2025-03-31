import React, { useState } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formData = {
      nombre: e.target.nombre.value,
      nit: e.target.nit.value,
      direccion: e.target.direccion.value,
      ciudad: e.target.ciudad.value,
      telefono: e.target.telefono.value,
      representante: e.target.representanteLegal.value,
      telefonoRe: e.target.telefonoRepresentante.value,
      contactoRe: e.target.personaContacto.value,
      cargoRe: e.target.cargo.value,
      correoRe: e.target.correo.value,
      ano: e.target.año.value,
      anoReporte: e.target.añoReporte.value,
      titulares: e.target.titularesRepresentados.value,
      origen: e.target.nacionalidad.value,
      correoFacturacion: e.target.correoFacturacion.value,
    };
  
    try {
      const response = await fetch('https://nestbackend.fidare.com/informacion-b/createInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(formData),
      });
  
      // Verificar si la respuesta es correcta
      if (!response.ok) {
        const errorText = await response.text(); // Obtener respuesta en texto para debug
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
  
      const result = await response.json();
      console.log("Respuesta de la API:", result); // Ver respuesta en consola
      alert(result.message);
      localStorage.setItem("idInformacionB", result.data.idInformacionB); // Guardar id en localStorage
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert(`Error: ${error.message}`); // Mostrar error en una alerta
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
            <input name="nombre" className="border p-2 w-full" type="text" placeholder="Nombre o razón social" required />
            <input name="nit" className="border p-2 w-full" type="text" placeholder="NIT" required />
          </div>

          {/* Segunda fila */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input name="direccion" className="border p-2 w-full" type="text" placeholder="Dirección" />
            <input name="ciudad" className="border p-2 w-full" type="text" placeholder="Ciudad" />
            <input name="telefono" className="border p-2 w-full" type="text" placeholder="Teléfono" />
          </div>

          {/* Tercera fila */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <input name="representanteLegal" className="border p-2 w-full" type="text" placeholder="Representante Legal" />
            <input name="telefonoRepresentante" className="border p-2 w-full" type="text" placeholder="Teléfono Representante" />
            <input name="personaContacto" className="border p-2 w-full" type="text" placeholder="Persona de contacto" />
            <input name="cargo" className="border p-2 w-full" type="text" placeholder="Cargo" />
            <input name="correo" className="border p-2 w-full" type="email" placeholder="Correo" />
          </div>

          {/* Cuarta fila */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input name="año" className="border p-2 w-full" type="number" placeholder="Año" />
            <input name="añoReporte" className="border p-2 w-full" type="number" placeholder="Año reporte" />
            <input name="titularesRepresentados" className="border p-2 w-full" type="number" placeholder="Titulares Representados" />
          </div>

          {/* Quinta fila */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <select name="nacionalidad" className="border p-2">
              <option value="">Seleccione ...</option>
              <option value="Nacional">Nacional</option>
              <option value="Multinacional">Multinacional</option>
            </select>
            <input name="correoFacturacion" className="border p-2 w-full" type="email" placeholder="Correo de facturación" />
          </div>

          {/* Botón Guardar */}
          <button type="submit" className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3">
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
