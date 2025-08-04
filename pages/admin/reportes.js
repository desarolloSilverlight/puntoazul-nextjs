import React, { useState } from "react";
import Admin from "layouts/Admin.js";
import { API_BASE_URL } from "../../utils/config";
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
  const [ano, setAno] = useState(""); // Nuevo estado para año
  const [clientes, setClientes] = useState([]);
  const [anosDisponibles, setAnosDisponibles] = useState([]); // Nuevo estado para años
  const [tablaDatos, setTablaDatos] = useState([]);
  const [datosReporte, setDatosReporte] = useState(null); // Para almacenar respuesta del backend
  
  // Estados para paginación y búsqueda de la tabla
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [busquedaTabla, setBusquedaTabla] = useState("");

  // Maneja el cambio del selector de Literal y carga los clientes
  const handleLiteralChange = async (e) => {
    const value = e.target.value;
    setLiteral(value);
    setCliente(""); // Limpiar selección de cliente al cambiar literal
    setReporte(""); // Limpiar selección de reporte
    setAno(""); // Limpiar selección de año
    setTablaDatos([]); // Limpiar tabla si cambia literal
    setDatosReporte(null); // Limpiar datos de reporte
    setAnosDisponibles([]); // Limpiar años disponibles

    if (!value) {
      setClientes([]);
      return;
    }

    const perfil = value === "linea_base" ? "Vinculado" : "Asociado";
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/perfilUser?nombrePerfil=${perfil}`
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

  // Maneja el cambio del selector de Reporte y carga los años disponibles
  const handleReporteChange = async (e) => {
    const value = e.target.value;
    setReporte(value);
    setAno(""); // Limpiar selección de año
    setTablaDatos([]); // Limpiar tabla
    setDatosReporte(null); // Limpiar datos de reporte

    // Si es Línea Base y se selecciona "toneladas", cargar años disponibles
    if (literal === "linea_base" && value === "toneladas") {
      try {
        const response = await fetch(
          `${API_BASE_URL}/informacion-f/getAnosReporte`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Años disponibles recibidos:", data);
          setAnosDisponibles(data.data);
        } else {
          console.error("Error al obtener años:", response.statusText);
          setAnosDisponibles([]);
        }
      } catch (error) {
        console.error("Error al cargar años:", error);
        setAnosDisponibles([]);
      }
    } else {
      setAnosDisponibles([]);
    }
  };

  // Evento del botón Buscar
  const handleBuscar = async () => {
    // Validar que se haya seleccionado literal, reporte y año (año es obligatorio)
    if (!literal || !reporte || !ano) {
      alert("Por favor selecciona Literal, Reporte y Año");
      return;
    }

    try {
      // Preparar datos para enviar
      const datosEnvio = {
        literal,
        reporte,
        cliente: cliente || null, // Si está vacío, enviar null (todos los clientes)
        ano: parseInt(ano)
      };

      console.log("Datos enviados al backend:", datosEnvio);

      const response = await fetch(
        `${API_BASE_URL}/informacion-f/reportes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(datosEnvio),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Verificar si los datos vienen en una propiedad específica
        let datosParaTabla = data;
        if (data && data.data && Array.isArray(data.data)) {
          datosParaTabla = data.data;
        } else if (data && data.empresas && Array.isArray(data.empresas)) {
          datosParaTabla = data.empresas;
        } else if (data && data.result && Array.isArray(data.result)) {
          datosParaTabla = data.result;
        }
        
        setDatosReporte(datosParaTabla);
        setTablaDatos(datosParaTabla);
        // Reset pagination when new data arrives
        setPaginaActual(1);
        setBusquedaTabla("");
      } else {
        console.error("Error en la respuesta:", response.statusText);
        alert("Error al obtener los datos del reporte");
      }
    } catch (error) {
      console.error("Error al realizar la consulta:", error);
      alert("Error de conexión al obtener el reporte");
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

  // Procesa los datos de toneladas para comparación
  const procesarDatosToneladas = () => {
    if (!datosReporte || !Array.isArray(datosReporte) || datosReporte.length === 0) {
      return null;
    }

    const empresasComparacion = [];
    const anosDisponiblesOrdenados = [...anosDisponibles].sort((a, b) => a - b);
    
    datosReporte.forEach((empresa, index) => {
      const datosEmpresa = {
        nombre: empresa.nombre || 'N/A',
        nit: empresa.nit || 'N/A',
        ciudad: empresa.ciudad || 'N/A',
        toneladas: {}
      };

      // Extraer toneladas_reportadas para cada año disponible desde la propiedad 'anos'
      anosDisponiblesOrdenados.forEach(year => {
        const yearStr = year.toString();
        
        if (empresa.anos && empresa.anos[yearStr] && empresa.anos[yearStr].toneladas_reportadas !== undefined && empresa.anos[yearStr].toneladas_reportadas !== null) {
          // Convertir string con coma a punto decimal y luego a float
          let valor = empresa.anos[yearStr].toneladas_reportadas;
          if (typeof valor === 'string') {
            valor = valor.replace(',', '.');
          }
          datosEmpresa.toneladas[yearStr] = parseFloat(valor) || 0;
        } else {
          datosEmpresa.toneladas[yearStr] = 0;
        }
      });

      empresasComparacion.push(datosEmpresa);
    });

    return { empresasComparacion, anosDisponiblesOrdenados };
  };

  // Calcula el cambio porcentual entre años
  const calcularCambioPorcentual = (valorAnterior, valorActual) => {
    if (valorAnterior === 0) {
      return valorActual > 0 ? 100 : 0;
    }
    return ((valorActual - valorAnterior) / valorAnterior) * 100;
  };

  // Filtrar y paginar datos de la tabla
  const filtrarYPaginarDatos = (empresasComparacion) => {
    // Filtrar por búsqueda
    const datosFiltrados = empresasComparacion.filter(empresa =>
      empresa.nombre.toLowerCase().includes(busquedaTabla.toLowerCase()) ||
      empresa.nit.includes(busquedaTabla) ||
      empresa.ciudad.toLowerCase().includes(busquedaTabla.toLowerCase())
    );

    // Calcular paginación
    const totalPaginas = Math.ceil(datosFiltrados.length / filasPorPagina);
    const indiceInicio = (paginaActual - 1) * filasPorPagina;
    const indiceFin = indiceInicio + filasPorPagina;
    const datosPaginados = datosFiltrados.slice(indiceInicio, indiceFin);

    return {
      datos: datosPaginados,
      totalResultados: datosFiltrados.length,
      totalPaginas: totalPaginas
    };
  };

  // Resetear paginación cuando cambia la búsqueda
  const handleBusquedaChange = (e) => {
    setBusquedaTabla(e.target.value);
    setPaginaActual(1);
  };

  // Genera datos de ejemplo para los gráficos
  const getChartData = () => {
    if (!datosReporte || !datosReporte.length) return null;
    switch (reporte) {
      case 'toneladas':
        const datosProcesados = procesarDatosToneladas();
        if (!datosProcesados) return null;

        const { empresasComparacion, anosDisponiblesOrdenados } = datosProcesados;
        
        // Contar empresas que aumentaron, disminuyeron o mantuvieron
        let aumentaron = 0, disminuyeron = 0, mantuvieron = 0;
        
        if (anosDisponiblesOrdenados.length >= 2) {
          const anoAnterior = anosDisponiblesOrdenados[0].toString();
          const anoActual = anosDisponiblesOrdenados[1].toString();
          
          empresasComparacion.forEach(empresa => {
            const valorAnterior = empresa.toneladas[anoAnterior];
            const valorActual = empresa.toneladas[anoActual];
            
            if (valorActual > valorAnterior) aumentaron++;
            else if (valorActual < valorAnterior) disminuyeron++;
            else mantuvieron++;
          });
        }

        return {
          type: 'pie',
          data: {
            labels: ['Aumentaron', 'Disminuyeron', 'Se Mantuvieron'],
            datasets: [{
              label: 'Empresas',
              data: [aumentaron, disminuyeron, mantuvieron],
              backgroundColor: ['#22c55e', '#ef4444', '#fbbf24']
            }]
          },
          options: { 
            responsive: true,
            plugins: { 
              title: {
                display: true,
                text: `Comparación de Toneladas Reportadas`
              },
              legend: {
                position: 'bottom'
              }
            }
          }
        };
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
          { value: "toneladas", label: "Toneladas" }, // Cambiado de "material" a "toneladas"
          { value: "meta", label: "Meta" },
          { value: "estado", label: "Estado" },
        ]
      : [];

  return (
    <>
      <div className="flex flex-wrap justify-center mt-8">
        <div className="w-full max-w-2xl bg-white rounded shadow-lg p-6">
          <h2 className="text-blueGray-700 text-xl font-semibold mb-6">Reportes</h2>
          <div className="grid grid-cols-5 md:grid-cols-4 gap-4 p-2">
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
                onChange={handleReporteChange}
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
                <option value="">Todos los clientes</option>
                {clientes.map((c) => (
                  <option key={c.idUsuario || c.usuario_idUsuario} value={c.idUsuario || c.usuario_idUsuario}>
                    {c.nombre || c.usuario_nombre}
                  </option>
                ))}
              </select>
            </div>
            {/* Selector Año (solo para Línea Base - Toneladas) */}
            {literal === "linea_base" && reporte === "toneladas" && (
              <div className="p-2">
                <label className="block text-xs font-semibold mb-1">Seleccione Año</label>
                <select
                  className="w-full border border-gray-300 rounded p-2"
                  value={ano}
                  onChange={e => setAno(e.target.value)}
                  disabled={!anosDisponibles.length}
                >
                  <option value="">Seleccione año...</option>
                  {anosDisponibles.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Botón Buscar */}
            <div className="flex justify-center items-end">
              <button
                className="bg-blueGray-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                onClick={handleBuscar}
                disabled={!literal || !reporte || (literal === "linea_base" && reporte === "toneladas" && !ano)}
              >
                Buscar
              </button>
            </div>
          </div>
          
          {/* Tabla de datos del reporte */}
          {datosReporte && Array.isArray(datosReporte) && datosReporte.length > 0 && (
            <>
            {reporte === 'toneladas' && literal === 'linea_base' ? (
              // Tabla especializada para comparación de toneladas
              (() => {
                const datosProcesados = procesarDatosToneladas();
                
                if (!datosProcesados) {
                  return <div className="mt-8 p-4 bg-red-100 text-red-700 rounded">
                    No se pudieron procesar los datos de toneladas
                  </div>;
                }
                
                const { empresasComparacion, anosDisponiblesOrdenados } = datosProcesados;
                const { datos, totalResultados, totalPaginas } = filtrarYPaginarDatos(empresasComparacion);
                
                return (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      Comparación de Toneladas Reportadas
                    </h3>
                    
                    {/* Controles de la tabla */}
                    <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Mostrar:</label>
                        <select
                          value={filasPorPagina}
                          onChange={(e) => {setFilasPorPagina(Number(e.target.value)); setPaginaActual(1);}}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="text-sm">resultados</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Buscar:</label>
                        <input
                          type="text"
                          value={busquedaTabla}
                          onChange={handleBusquedaChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm"
                          placeholder="Empresa, NIT o Ciudad..."
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100 text-center">
                            <th className="px-4 py-2 border">Empresa</th>
                            <th className="px-4 py-2 border">NIT</th>
                            <th className="px-4 py-2 border">Ciudad</th>
                            {anosDisponiblesOrdenados.map(year => (
                              <th key={year} className="px-4 py-2 border">
                                Toneladas {year}
                              </th>
                            ))}
                            {anosDisponiblesOrdenados.length >= 2 && (
                              <th className="px-4 py-2 border">% Cambio</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {datos.map((empresa, index) => {
                            let cambio = null;
                            let colorCambio = '';
                            let iconoCambio = '';
                            
                            if (anosDisponiblesOrdenados.length >= 2) {
                              const anoAnterior = anosDisponiblesOrdenados[0].toString();
                              const anoActual = anosDisponiblesOrdenados[1].toString();
                              const valorAnterior = empresa.toneladas[anoAnterior];
                              const valorActual = empresa.toneladas[anoActual];
                              
                              cambio = calcularCambioPorcentual(valorAnterior, valorActual);
                              
                              if (cambio > 0) {
                                colorCambio = 'bg-green-100 text-green-800';
                                iconoCambio = '↗';
                              } else if (cambio < 0) {
                                colorCambio = 'bg-red-100 text-red-800';
                                iconoCambio = '↘';
                              } else {
                                colorCambio = 'bg-yellow-100 text-yellow-800';
                                iconoCambio = '→';
                              }
                            }
                            
                            return (
                              <tr key={index} className="text-center hover:bg-gray-50">
                                <td className="px-4 py-2 border font-medium">
                                  {empresa.nombre}
                                </td>
                                <td className="px-4 py-2 border">{empresa.nit}</td>
                                <td className="px-4 py-2 border">{empresa.ciudad}</td>
                                {anosDisponiblesOrdenados.map(year => (
                                  <td key={year} className="px-4 py-2 border">
                                    {empresa.toneladas[year.toString()].toFixed(2)}
                                  </td>
                                ))}
                                {cambio !== null && (
                                  <td className="px-4 py-2 border">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorCambio}`}>
                                      {iconoCambio} {Math.abs(cambio).toFixed(1)}%
                                    </span>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Información de paginación y controles */}
                    <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {datos.length === 0 ? 0 : ((paginaActual - 1) * filasPorPagina) + 1} a{' '}
                        {Math.min(paginaActual * filasPorPagina, totalResultados)} de {totalResultados} resultados
                      </div>
                      
                      {/* Controles de paginación */}
                      {totalPaginas > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                            disabled={paginaActual === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Anterior
                          </button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                              let pageNum;
                              if (totalPaginas <= 5) {
                                pageNum = i + 1;
                              } else {
                                const start = Math.max(1, paginaActual - 2);
                                const end = Math.min(totalPaginas, start + 4);
                                pageNum = start + i;
                                if (pageNum > end) return null;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setPaginaActual(pageNum)}
                                  className={`px-3 py-1 border text-sm rounded ${
                                    paginaActual === pageNum
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              // Tabla genérica para otros reportes
              <div className="mt-8 overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 text-center">
                      <th className="px-4 py-2 border">ID</th>
                      <th className="px-4 py-2 border">Cliente</th>
                      <th className="px-4 py-2 border">Datos</th>
                      <th className="px-4 py-2 border">Año</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosReporte.map((fila, index) => (
                      <tr key={index} className="text-center">
                        <td className="px-4 py-2 border">{index + 1}</td>
                        <td className="px-4 py-2 border">{fila.cliente || 'N/A'}</td>
                        <td className="px-4 py-2 border">{JSON.stringify(fila).substring(0, 50)}...</td>
                        <td className="px-4 py-2 border">{fila.ano || ano}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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