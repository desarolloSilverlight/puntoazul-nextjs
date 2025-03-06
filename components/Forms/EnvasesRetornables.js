import React, { useState } from "react";
import PropTypes from "prop-types";

export default function TablaRetornabilidad({ color }) {
  const [datos, setDatos] = useState([
    "(1) EERM",
    "(2) EER",
    "(3) EENC",
    "(4) EERI",
    "(5) ER",
    "(EENC +  EERI)",
    "Material con % mayor al 70% (*)",
    "Ningún material con % mayor al 70%  (**)",
    "Material 1",
    "Material 2",
    "Material 3",
    "Multimaterial n",
  ]);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold flex items-center">
          Cantidad total en peso (toneladas) de materiales de envases y empaques retornables&nbsp;
          {/* <i 
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer" 
            onClick={() => setIsOpen(true)}
          ></i> */}
        </h3>
        <div className="overflow-x-auto mt-4">
          <table className="w-full bg-transparent border-collapse">
            <thead>
              <tr className="bg-blueGray-50 text-blueGray-500">
                <th className="p-2">Parámetro</th>
                <th className="p-2">Peso total (ton) Año base</th>
                <th className="p-2">Papel</th>
                <th className="p-2">Cartón</th>
                <th className="p-2">Plástico Rígidos</th>
                <th className="p-2">Plástico Flexibles</th>
                <th className="p-2">Vidrio</th>
                <th className="p-2">Metales Ferrosos</th>
                <th className="p-2">Metales No Ferrosos</th>
                <th className="p-2">Multimaterial 1</th>
                <th className="p-2">Multimaterial n</th>
                <th className="p-2">Descripción del procedimiento</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((parametro, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{parametro}</td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="text" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
        >
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

TablaRetornabilidad.propTypes = {
  color: PropTypes.string,
};
