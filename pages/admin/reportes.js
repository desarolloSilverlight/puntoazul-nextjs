import React, { useState } from "react";
import Admin from "layouts/Admin.js";

export default function Reportes() {
  const [literal, setLiteral] = useState("");
  const [reporte, setReporte] = useState("");
  const [cliente, setCliente] = useState("");
  const [clientes, setClientes] = useState([]);
  const [tablaDatos, setTablaDatos] = useState([]);

  // Maneja el cambio del selector de Literal y carga los clientes
  const handleLiteralChange = async (e) => {
    const value = e.target.value;
    setLiteral(value);
    setCliente(""); // Limpiar selección de cliente al cambiar literal
    setTablaDatos([]); // Limpiar tabla si cambia literal

    if (!value) {
      setClientes([]);
      return;
    }

    const perfil = value === "linea_base" ? "Vinculado" : "Asociado";
    try {
      const response = await fetch(
        `https://nestbackend.fidare.com/users/perfilUser?nombrePerfil=${perfil}`
      );
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      } else {
        setClientes([]);
      }
    } catch {
      setClientes([]);
    }
  };

  // Evento del botón Buscar
  const handleBuscar = () => {
    // Si ya hay datos, limpiar y volver a cargar
    if (tablaDatos.length > 0) {
      setTablaDatos([]);
      setTimeout(() => {
        setTablaDatos(generarDatosEjemplo());
      }, 100); // Pequeño delay para simular recarga
    } else {
      setTablaDatos(generarDatosEjemplo());
    }
  };

  // Genera 10 datos de ejemplo para la tabla
  const generarDatosEjemplo = () => {
    return Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      campo1: `Dato ${i + 1} - ${literal}`,
      campo2: `Reporte: ${reporte}`,
      campo3: `Cliente: ${cliente}`,
    }));
  };

  const opcionesReporte =
    literal === "literal_b"
      ? [
          { value: "estado", label: "Estado" },
          { value: "meta", label: "Meta" },
          { value: "grupo", label: "Grupo" },
        ]
      : literal === "linea_base"
      ? [
          { value: "material", label: "Material" },
          { value: "meta", label: "Meta" },
          { value: "estado", label: "Estado" },
        ]
      : [];

  return (
    <>
      <div className="flex flex-wrap justify-center mt-8">
        <div className="w-full max-w-2xl bg-white rounded shadow-lg p-6">
          <h2 className="text-blueGray-700 text-xl font-semibold mb-6">Reportes</h2>
          <div className="grid grid-cols-4 md:grid-cols-3 gap-4 p-2">
            {/* Selector Literal */}
            <div className="p-2">
              <label className="block text-xs font-semibold mb-1">Seleccione Literal</label>
              <select
                className="w-full border border-gray-300 rounded p-2"
                value={literal}
                onChange={handleLiteralChange}
              >
                <option value="">Seleccione...</option>
                <option value="linea_base">Línea Base</option>
                <option value="literal_b">Literal B</option>
              </select>
            </div>
            {/* Selector Reporte */}
            <div className="p-2">
              <label className="block text-xs font-semibold mb-1">Seleccione Reporte</label>
              <select
                className="w-full border border-gray-300 rounded p-2"
                value={reporte}
                onChange={e => setReporte(e.target.value)}
                disabled={!literal}
              >
                <option value="">Seleccione...</option>
                {opcionesReporte.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Selector Cliente */}
            <div className="p-2">
              <label className="block text-xs font-semibold mb-1">Seleccione Cliente</label>
              <select
                className="w-full border border-gray-300 rounded p-2"
                value={cliente}
                onChange={e => setCliente(e.target.value)}
                disabled={!clientes.length}
              >
                <option value="">Seleccione...</option>
                {clientes.map((c) => (
                  <option key={c.idUsuario || c.usuario_idUsuario} value={c.idUsuario || c.usuario_idUsuario}>
                    {c.nombre || c.usuario_nombre}
                  </option>
                ))}
              </select>
            </div>
            {/* Botón Buscar */}
            <div className="flex justify-center">
              <button
                className="bg-blueGray-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                onClick={handleBuscar}
                disabled={!literal || !reporte || !cliente}
              >
                Buscar
              </button>
            </div>
          </div>
          {/* Tabla de ejemplo */}
          {tablaDatos.length > 0 && (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-center">
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Campo 1</th>
                    <th className="px-4 py-2 border">Campo 2</th>
                    <th className="px-4 py-2 border">Campo 3</th>
                  </tr>
                </thead>
                <tbody>
                  {tablaDatos.map((fila) => (
                    <tr key={fila.id} className="text-center">
                      <td className="px-4 py-2 border">{fila.id}</td>
                      <td className="px-4 py-2 border">{fila.campo1}</td>
                      <td className="px-4 py-2 border">{fila.campo2}</td>
                      <td className="px-4 py-2 border">{fila.campo3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

Reportes.layout = Admin;