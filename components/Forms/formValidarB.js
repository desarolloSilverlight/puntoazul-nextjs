import { useState } from "react";

export default function FormValidarB({ nombre, nit }) {
  const [productos, setProductos] = useState([
    { id: 1, razonSocial: nombre || "", nit: nit || "", pesoEmpaque: "", pesoProducto: "" }
  ]);

  const agregarProducto = () => {
    setProductos([...productos, { id: productos.length + 1, razonSocial: "", nit: "", pesoEmpaque: "", pesoProducto: "" }]);
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded">
      <h3 className="text-lg font-semibold">Información General de Productos</h3>
      <button className="bg-blue-600 text-white px-4 py-2 rounded mt-3" onClick={agregarProducto}>
        Agregar Producto
      </button>
      <div className="overflow-x-auto mt-4">
        <table className="w-full bg-transparent border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">No.</th>
              <th className="p-2">Razón Social</th>
              <th className="p-2">NIT</th>
              <th className="p-2">Peso Empaque (g)</th>
              <th className="p-2">Peso Producto (g)</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">{producto.id}</td>
                <td><input className="border p-1 w-full" type="text" value={producto.razonSocial} readOnly /></td>
                <td><input className="border p-1 w-full" type="text" value={producto.nit} readOnly /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="bg-green-600 text-white px-4 py-2 rounded mt-3">Guardar</button>
    </div>
  );
}
