import React, { useState } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  const [productos, setProductos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const agregarProducto = () => {
    setProductos([...productos, { id: productos.length + 1 }]);
  };
  const data = [
    { id: "A", campo: "No", tipo: "Número", descripcion: "Enumeración de cada fila diligenciada" },
    { id: "B", campo: "Empresa titular del Producto", tipo: "Texto", descripcion: "Razón social/Nombre de cada persona natural o jurídica (titular de registro) representada por la empresa vinculada a Soluciones Ambientales Sostenibles Punto Azul" },
    { id: "C", campo: "Nombre del Producto", tipo: "Texto", descripcion: "Nombre del producto que está reportando" },
    { id: "D", campo: "Papel (g)", tipo: "Gramos", descripcion: "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de PAPEL." },
    { id: "E", campo: "Metal (g)", tipo: "Gramos", descripcion: "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de METAL." },
    { id: "F", campo: "Cartón (g)", tipo: "Gramos", descripcion: "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de CARTÓN." },
    { id: "G", campo: "Vidrio (g)", tipo: "Gramos", descripcion: "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de VIDRIO." },
    { id: "H", campo: "Multimaterial", tipo: "Texto", descripcion: "Producto o empaque hecho de dos o más materiales diferentes combinados, como plástico y metal, en una sola estructura." },
    { id: "I", campo: "Unidades del Producto puestas en el mercado", tipo: "Número", descripcion: "Total de empaques puestos en el mercado del Producto indicado durante el año reportado." }
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
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2">Código</th>
                    <th className="border px-4 py-2">Campo</th>
                    <th className="border px-4 py-2">Tipo</th>
                    <th className="border px-4 py-2">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="border px-4 py-2">{item.id}</td>
                      <td className="border px-4 py-2">{item.campo}</td>
                      <td className="border px-4 py-2">{item.tipo}</td>
                      <td className="border px-4 py-2">{item.descripcion}</td>
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
