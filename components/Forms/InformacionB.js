import React, { useState } from "react";
import PropTypes from "prop-types";
export default function FormularioAfiliado({ color }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded p-6 " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      {/* SECCIÓN I */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          Información sobre el Afiliado&nbsp;
          <i 
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer" 
            onClick={() => setIsOpen(true)}
          ></i>
        </h3>
        {/* Primera fila (2 columnas) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input className="border p-2 w-full" type="text" placeholder="Nombre o razón social" />
          <input className="border p-2 w-full" type="text" placeholder="NIT" />
        </div>

        {/* Segunda fila (3 columnas) */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input className="border p-2 w-full" type="text" placeholder="Dirección" />
          <input className="border p-2 w-full" type="text" placeholder="Ciudad" />
          <input className="border p-2 w-full" type="text" placeholder="Telefono" />
        </div>

        {/* Tercera fila (5 columnas) */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <input className="border p-2 w-full" type="text" placeholder="Representante Legal" />
          <input className="border p-2 w-full" type="text" placeholder="Telefono" />
          <input className="border p-2 w-full" type="text" placeholder="Persona de contacto" />
          <input className="border p-2 w-full" type="text" placeholder="Cargo" />
          <input className="border p-2 w-full" type="text" placeholder="Correo" />
        </div>

        {/* Cuarta fila (3 columnas) */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input className="border p-2 w-full" type="text" placeholder="Año" />
          <input className="border p-2 w-full" type="text" placeholder="Año reporte" />
          <input className="border p-2 w-full" type="text" placeholder="Titulares Representados" />
        </div>

        {/* Quinta fila (2 columnas) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <select className="border p-2">            
            <option value="50+">Seleccione ...</option>
            <option value="50+">Nacional</option>
            <option value="50+">Multinacional</option>
          </select>
          <input className="border p-2 w-full" type="text" placeholder="Correo de facturacion" />
        </div>

        {/* Botón Guardar */}
        <button className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3">
          Guardar
        </button>
      </div>
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
          <div className="bg-white p-5 rounded-lg shadow-lg max-h-260-px overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Instructivo de la sección</h2>
            {/* Tabla */}
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
