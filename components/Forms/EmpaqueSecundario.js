import React, { useState } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  const [productos, setProductos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const agregarProducto = () => {
    setProductos([...productos, { id: productos.length + 1 }]);
  };
  const data = [
    ["AA", "Empresa titular del Producto", "Texto", "Razón social/Nombre de cada persona natural o jurídica (titular de registro) representada por la empresa vinculada a Soluciones Ambientales Sostenibles Punto Azul"],
    ["AB", "Nombre del Producto", "Texto", "Nombre del producto que esta reportando"],
    ["AC", "Papel (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de PAPEL. Colocar cifra en gramos."],
    ["AD", "Metal (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de METAL. Colocar cifra en gramos."],
    ["AE", "Cartón (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de CARTÓN. Colocar cifra en gramos. De igual manera se debe reportar el material corrugado como material de cartón."],
    ["AF", "Vidrio (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de VIDRIO. Colocar cifra en gramos."],
    ["AG", "Multimaterial", "Texto", "Es un producto o empaque hecho de dos o más materiales diferentes combinados, como plástico y metal, en una sola estructura."],
    ["AH", "Unidades del Producto puestas en el mercado durante el año reportado", "Número", "Total de empaques puestos en el mercado del Producto indicado en la fila correspondiente, durante el año reportado. En la cuantificación se debe tener en cuenta la relación con el producto (Ej.: una unidad de empaque contiene 24 unidades de producto, el reporte que se debe hacer es la unidad de empaque que se puso en el mercado."],
  ];

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
          Información General de Productos&nbsp;
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
              <tr className="bg-blueGray-50 text-blueGray-500">
                <th className="p-2">No.</th>
                <th className="p-2">Empresa Titular</th>
                <th className="p-2">Nombre Producto</th>
                <th className="p-2">Papel (g)</th>
                <th className="p-2">Metal Ferrosos(g)</th>
                <th className="p-2">Metal No Ferrosos(g)</th>
                <th className="p-2">Cartón (g)</th>
                <th className="p-2">Vidrio (g)</th>
                <th className="p-2">Multimaterial</th>
                <th className="p-2">Unidades</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id} className="border-t">
                  <td className="p-2">{producto.id}</td>
                  <td><input className="border p-1 w-full" type="text" /></td>
                  <td><input className="border p-1 w-full" type="text" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="text" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
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
                  <th className="border border-gray-300 px-4 py-2">Código</th>
                  <th className="border border-gray-300 px-4 py-2">Campo</th>
                  <th className="border border-gray-300 px-4 py-2">Tipo</th>
                  <th className="border border-gray-300 px-4 py-2">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
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
