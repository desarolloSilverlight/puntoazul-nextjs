import React, { useState } from "react";
import Admin from "layouts/Admin.js";

export default function Reportes() {
  const [literal, setLiteral] = useState("");
  const [reporte, setReporte] = useState("");
  const [cliente, setCliente] = useState("");

  return (
    <>
      <div className="flex flex-wrap justify-center mt-8">
        <div className="w-full max-w-2xl bg-white rounded shadow-lg p-6">
          <h2 className="text-blueGray-700 text-xl font-semibold mb-6">Reportes</h2>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 p-2">
            {/* Selector Literal */}
            <div className="p-2">
              <label className="block text-xs font-semibold mb-1">Seleccione Literal</label>
              <select
                className="w-full border border-gray-300 rounded p-2"
                value={literal}
                onChange={e => setLiteral(e.target.value)}
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
              >
                <option value="">Seleccione...</option>
                {/* Opciones de reporte dinámicas según literal si lo deseas */}
                <option value="reporte1">Reporte 1</option>
                <option value="reporte2">Reporte 2</option>
              </select>
            </div>
            {/* Selector Cliente */}
            <div className="p-2">
              <label className="block text-xs font-semibold mb-1">Seleccione Cliente</label>
              <select
                className="w-full border border-gray-300 rounded p-2"
                value={cliente}
                onChange={e => setCliente(e.target.value)}
              >
                <option value="">Seleccione...</option>
                {/* Aquí puedes mapear tus clientes dinámicamente */}
                <option value="cliente1">Cliente 1</option>
                <option value="cliente2">Cliente 2</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Reportes.layout = Admin;