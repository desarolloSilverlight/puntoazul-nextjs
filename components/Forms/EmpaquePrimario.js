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
        <h3 className="text-lg font-semibold">Información General de Productos</h3>
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
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};
