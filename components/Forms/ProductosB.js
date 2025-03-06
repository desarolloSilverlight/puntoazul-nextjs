import React, { useState } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  const [productos, setProductos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const agregarProducto = () => {
    setProductos([...productos, { id: productos.length + 1 }]);
  };

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      {/* SECCIÓN II */}
      <div className="p-4">
        <h3 className="text-lg font-semibold flex items-center">
          Medicamentos&nbsp;
          <i 
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer" 
            onClick={() => setIsOpen(true)}
          ></i>
        </h3>
        <div className="flex justify-between mt-3">
          <button className="bg-lightBlue-600 text-white px-4 py-2 rounded" onClick={agregarProducto}>
            Agregar Producto
          </button>
          <button className="bg-lightBlue-600 text-white px-4 py-2 rounded">
            Cargar Informacion
          </button>
          <button className="bg-lightBlue-600 text-white px-4 py-2 rounded">
            Descargar Excel
          </button>
        </div>
        <div className="text-red-500 text-center mt-3 font-semibold">
          Todos los pesos de la tabla deben estar en gramos.
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="w-full bg-transparent border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th rowSpan={4} colSpan={1} className="p-2 border">No.</th>
                <th rowSpan={4} colSpan={1} className="p-2 border">Razón Social</th>
                <th rowSpan={4} colSpan={1} className="p-2 border">Marca</th>
                <th rowSpan={4} colSpan={1} className="p-2 border">Nombre Generico</th>
                <th rowSpan={4} colSpan={1} className="p-2 border">Número de Registros</th>
                <th rowSpan={4} colSpan={1} className="p-2 border">Código de estándar de datos</th>
                <th colSpan={10} rowSpan={1} className="p-2 border">Distribución y comercialización</th>  
                <th colSpan={2} rowSpan={1} className="p-2 border">Fabricacion</th>              
                <th rowSpan={4} colSpan={1} className="p-2 border">TOTAL DE PESO DE EMPAQUES, ENVASES Y ENVOLTURAS</th>
                <th rowSpan={4} colSpan={1} className="p-2 border">TOTAL DE PESO DEL PRODUCTO</th>
              </tr>
              <tr className="bg-gray-200">
                <th colSpan={4} rowSpan={1} className="p-2 border">Comercial</th>
                <th colSpan={2} rowSpan={2} className="p-2 border">Institucional</th>
                <th colSpan={2} rowSpan={2} className="p-2 border">Intrahospitalario</th>
                <th colSpan={2} rowSpan={2} className="p-2 border">Muestras médicas</th>           
                <th colSpan={1} rowSpan={3} className="p-2 border">Local</th>           
                <th colSpan={1} rowSpan={3} className="p-2 border">Importado</th>           
              </tr>
              <tr className="bg-gray-200">
                <th colSpan={2} rowSpan={1} className="p-2 border">RX</th>
                <th colSpan={2} rowSpan={1} className="p-2 border">OTC</th>
              </tr>
              <tr className="bg-gray-200">
                <th colSpan={1} className="p-2 border">Peso de empaques, envases y envolturas</th>
                <th colSpan={1} className="p-2 border">Peso total del producto</th>
                <th colSpan={1} className="p-2 border">Peso de empaques, envases y envolturas</th>
                <th colSpan={1} className="p-2 border">Peso total del producto</th>
                <th colSpan={1} className="p-2 border">Peso de empaques, envases y envolturas</th>
                <th colSpan={1} className="p-2 border">Peso total del producto</th>
                <th colSpan={1} className="p-2 border">Peso de empaques, envases y envolturas</th>
                <th colSpan={1} className="p-2 border">Peso total del producto</th>
                <th colSpan={1} className="p-2 border">Peso de empaques, envases y envolturas</th>
                <th colSpan={1} className="p-2 border">Peso total del producto</th>              
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id} className="border-t text-center">
                  <td className="p-2">{producto.id}</td>
                  <td><input className="border p-1 w-full" type="text" /></td>
                  <td><input className="border p-1 w-full" type="text" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  {[...Array(15)].map((_, i) => (
                    <td key={i}><input className="border p-1 w-full" type="number" /></td>
                  ))}
                  <td><button className="bg-red-500 text-white px-4 py-1 rounded">Eliminar</button></td>
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

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};