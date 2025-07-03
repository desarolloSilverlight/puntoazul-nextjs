import React, { useState } from "react";
import Admin from "layouts/Admin.js";
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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

  // Genera datos de ejemplo para los gráficos
  const getChartData = () => {
    if (!tablaDatos.length) return null;
    switch (reporte) {
      case 'estado':
        // Ejemplo: cuenta por estado
        return {
          type: 'bar',
          data: {
            labels: ['Aprobado', 'Pendiente', 'Rechazado'],
            datasets: [{
              label: 'Cantidad',
              data: [3, 5, 2], // Reemplaza con tus datos reales
              backgroundColor: ['#38bdf8', '#fbbf24', '#ef4444']
            }]
          },
          options: { responsive: true, plugins: { legend: { display: false } } }
        };
      case 'meta':
        // Ejemplo: avance de meta
        return {
          type: 'bar',
          data: {
            labels: ['2022', '2023', '2024'],
            datasets: [{
              label: 'Avance (%)',
              data: [80, 60, 95],
              backgroundColor: ['#22c55e', '#3b82f6', '#f59e42']
            }]
          },
          options: { responsive: true }
        };
      case 'grupo':
        // Ejemplo: distribución por grupo
        return {
          type: 'pie',
          data: {
            labels: ['Grupo A', 'Grupo B', 'Grupo C'],
            datasets: [{
              label: 'Cantidad',
              data: [4, 3, 3],
              backgroundColor: ['#f472b6', '#60a5fa', '#facc15']
            }]
          },
          options: { responsive: true }
        };
      case 'material':
        // Ejemplo: distribución por material
        return {
          type: 'pie',
          data: {
            labels: ['Plástico', 'Vidrio', 'Metal', 'Cartón'],
            datasets: [{
              label: 'Cantidad',
              data: [5, 2, 1, 2],
              backgroundColor: ['#38bdf8', '#a3e635', '#fbbf24', '#f472b6']
            }]
          },
          options: { responsive: true }
        };
      default:
        return null;
    }
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
            <>
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
            {/* Gráfico dinámico debajo de la tabla */}
            {(() => {
              const chart = getChartData();
              if (!chart) return null;
              if (chart.type === 'bar') {
                return (
                  <div className="mt-8 flex justify-center">
                    <div style={{ maxWidth: 350, width: '100%' }}>
                      <Bar data={chart.data} options={chart.options} height={180} />
                    </div>
                  </div>
                );
              }
              if (chart.type === 'pie') {
                return (
                  <div className="mt-8 flex justify-center">
                    <div style={{ maxWidth: 350, width: '100%' }}>
                      <Pie data={chart.data} options={chart.options} height={180} />
                    </div>
                  </div>
                );
              }
              // Progress bar para meta
              if (reporte === 'meta') {
                // Ejemplo de datos de avance
                const metas = [
                  { nombre: 'Meta 1', avance: 80 },
                  { nombre: 'Meta 2', avance: 60 },
                  { nombre: 'Meta 3', avance: 95 },
                ];
                return (
                  <div className="mt-8 space-y-4">
                    {metas.map((meta, idx) => (
                      <div key={meta.nombre}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-blueGray-700">{meta.nombre}</span>
                          <span className="text-sm font-medium text-blueGray-700">{meta.avance}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${meta.avance}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })()}
            </>
          )}
        </div>
      </div>
    </>
  );
}

Reportes.layout = Admin;