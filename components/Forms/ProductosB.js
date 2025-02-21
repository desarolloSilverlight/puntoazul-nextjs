import React, { useState } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  const [productos, setProductos] = useState([]);

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
        <h3 className="text-lg font-semibold">
          Información General de Productos Plásticos
        </h3>
        <button
          className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
          onClick={agregarProducto}
        >
          Agregar Producto
        </button>
        <div className="overflow-x-auto mt-4">
          <table className="w-full bg-transparent border-collapse">
            <thead>
              <tr className="bg-blueGray-50 text-blueGray-500 text-center">
                <th rowSpan="3" className="p-2">No.</th>
                <th rowSpan="3" className="p-2">Empresa Titular</th>
                <th rowSpan="3" className="p-2">Nombre Producto</th>
                <th rowSpan="3" className="p-2">Peso Unitario (g)</th>
                <th rowSpan="3" className="p-2">Unidades</th>
                <th colSpan="7" className="p-2 border">Líquidos</th>
                <th colSpan="7" className="p-2 border">Otros Productos Plásticos</th>
                <th colSpan="7" className="p-2 border">Plásticos de Construcción</th>
              </tr>
              <tr className="bg-gray-200 text-gray-700 text-center">
                {[...Array(3)].flatMap(() =>
                  ["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map(
                    (item, index) => (
                      <th key={index} className="p-2 border">{item} (g)</th>
                    )
                  )
                )}
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
                  {[...Array(21)].map((_, i) => (
                    <td key={i}><input className="border p-1 w-full" type="number" /></td>
                  ))}
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
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};