import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/config";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
// Componentes de cards específicos
import StatsCard from "./Cards/StatsCard";
import FormStatusCard from "./Cards/FormStatusCard";
import ChartCard from "./Cards/ChartCard";
// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);



export default function DashboardAdmin() {
  const [stats, setStats] = useState({
    usuariosRegistrados: { vinculados: 0, asociados: 0, total: 0 },
    estadosFormularios: {
      lineaBase: { iniciados: 0, guardados: 0, pendientes: 0, aprobados: 0, rechazados: 0 },
      literalB: { iniciados: 0, guardados: 0, pendientes: 0, aprobados: 0, rechazados: 0 }
    },
    pendientesValidacion: 0,
    progresoPorAno: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Obtener usuarios por perfil
        const [vinculadosResponse, asociadosResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/users/perfilUser?nombrePerfil=Vinculado`),
          fetch(`${API_BASE_URL}/users/perfilUser?nombrePerfil=Asociado`)
        ]);

        const [vinculadosData, asociadosData] = await Promise.all([
          vinculadosResponse.json(),
          asociadosResponse.json()
        ]);

        const vinculados = Array.isArray(vinculadosData) ? vinculadosData.length : 0;
        const asociados = Array.isArray(asociadosData) ? asociadosData.length : 0;

        // Obtener conteos reales de formularios por estado
        const [lineaBaseResponse, literalBResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/informacion-f/count-by-status`),
          fetch(`${API_BASE_URL}/informacion-b/count-by-status`)
        ]);

        const [lineaBaseData, literalBData] = await Promise.all([
          lineaBaseResponse.json(),
          literalBResponse.json()
        ]);
        console.log("Datos de formularios:", lineaBaseData, literalBData);
        const estadosFormularios = {
          lineaBase: {
            iniciados: lineaBaseData.iniciados || 0,
            guardados: lineaBaseData.guardados || 0,
            pendientes: lineaBaseData.pendientes || 0,
            aprobados: lineaBaseData.aprobados || 0,
            rechazados: lineaBaseData.rechazados || 0
          },
          literalB: {
            iniciados: literalBData.iniciados || 0,
            guardados: literalBData.guardados || 0,
            pendientes: literalBData.pendientes || 0,
            aprobados: literalBData.aprobados || 0,
            rechazados: literalBData.rechazados || 0
          }
        };

        const pendientesValidacion = estadosFormularios.lineaBase.pendientes + estadosFormularios.literalB.pendientes;

        setStats({
          usuariosRegistrados: { 
            vinculados, 
            asociados, 
            total: vinculados + asociados 
          },
          estadosFormularios,
          pendientesValidacion,
          progresoPorAno: [
            { year: 2024, completados: estadosFormularios.lineaBase.aprobados + estadosFormularios.literalB.aprobados, total: vinculados + asociados },
            { year: 2023, completados: Math.floor((vinculados + asociados) * 0.85), total: Math.max(1, vinculados + asociados - 5) }
          ]
        });

      } catch (err) {
        setError(err.message);
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lightBlue-600 text-lg font-semibold animate-pulse">
          Cargando dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-lg">
          Error al cargar el dashboard: {error}
        </div>
      </div>
    );
  }

  // Preparar datos para gráficos
  const chartData = {
    labels: ['Iniciados', 'Guardados', 'Pendientes', 'Aprobados', 'Rechazados'],
    datasets: [
      {
        label: 'Línea Base',
        data: [
          stats.estadosFormularios.lineaBase.iniciados,
          stats.estadosFormularios.lineaBase.guardados,
          stats.estadosFormularios.lineaBase.pendientes,
          stats.estadosFormularios.lineaBase.aprobados,
          stats.estadosFormularios.lineaBase.rechazados
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'Literal B',
        data: [
          stats.estadosFormularios.literalB.iniciados,
          stats.estadosFormularios.literalB.guardados,
          stats.estadosFormularios.literalB.pendientes,
          stats.estadosFormularios.literalB.aprobados,
          stats.estadosFormularios.literalB.rechazados
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Card principal que contiene todo el dashboard */}
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header del Dashboard */}
        <div className="p-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Dashboard Administrativo</h1>
          <p className="text-gray-600 text-lg">Panel de control y métricas del sistema Punto Azul</p>
        </div>

        <div className="p-8">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Usuarios"
              value={stats.usuariosRegistrados.total}
              subtitle={`Vinculados: ${stats.usuariosRegistrados.vinculados} | Asociados: ${stats.usuariosRegistrados.asociados}`}
              icon="fas fa-users"
              color="blue"
            />
            
            <StatsCard
              title="Pendientes Validación"
              value={stats.pendientesValidacion}
              subtitle={`${stats.estadosFormularios.lineaBase.pendientes} Vinculados | ${stats.estadosFormularios.literalB.pendientes} Asociados`}
              icon="fas fa-clock"
              color="orange"
            />
            
            <StatsCard
              title="Formularios Aprobados"
              value={stats.estadosFormularios.lineaBase.aprobados + stats.estadosFormularios.literalB.aprobados}
              subtitle={`${stats.estadosFormularios.lineaBase.aprobados} Vinculados | ${stats.estadosFormularios.literalB.aprobados} Asociados`}
              icon="fas fa-check-circle"
              color="green"
            />
            
            <StatsCard
              title="Cobertura"
              value={`V: ${Math.round((stats.estadosFormularios.lineaBase.aprobados / stats.usuariosRegistrados.vinculados) * 100)}% | A: ${Math.round((stats.estadosFormularios.literalB.aprobados / stats.usuariosRegistrados.asociados) * 100)}%`}
              subtitle="% Completados por tipo"
              icon="fas fa-percentage"
              color="purple"
            />
          </div>

          {/* Estados de Formularios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <FormStatusCard
              title="Formularios Línea Base (Vinculados)"
              states={stats.estadosFormularios.lineaBase}
              totalUsers={stats.usuariosRegistrados.vinculados}
              type="lineaBase"
            />
            
            <FormStatusCard
              title="Formularios Literal B (Asociados)"
              states={stats.estadosFormularios.literalB}
              totalUsers={stats.usuariosRegistrados.asociados}
              type="literalB"
            />
          </div>

          {/* Gráfico de Estados */}
          <div className="mb-10">
            <ChartCard
              title="Distribución de Estados por Tipo de Formulario"
              chartData={chartData}
              chartType="bar"
            />
          </div>

          {/* Información Adicional */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Progreso Anual */}
            {/* <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Progreso Comparativo</h3>
              <div className="space-y-5">
                {stats.progresoPorAno.map((year) => (
                  <div key={year.year} className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">{year.year}</span>
                    <div className="flex items-center space-x-4">
                      <div className="w-40 bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-lightBlue-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${(year.completados / year.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                        {year.completados}/{year.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Resumen de Estados */}
            {/* <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Resumen General</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Sin Iniciar</span>
                  <span className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold">
                    {stats.usuariosRegistrados.total - 
                     (stats.estadosFormularios.lineaBase.iniciados + stats.estadosFormularios.lineaBase.guardados + 
                      stats.estadosFormularios.lineaBase.pendientes + stats.estadosFormularios.lineaBase.aprobados + 
                      stats.estadosFormularios.lineaBase.rechazados + stats.estadosFormularios.literalB.iniciados + 
                      stats.estadosFormularios.literalB.guardados + stats.estadosFormularios.literalB.pendientes + 
                      stats.estadosFormularios.literalB.aprobados + stats.estadosFormularios.literalB.rechazados)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">En Progreso</span>
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                    {stats.estadosFormularios.lineaBase.iniciados + stats.estadosFormularios.lineaBase.guardados + 
                     stats.estadosFormularios.literalB.iniciados + stats.estadosFormularios.literalB.guardados}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Completados</span>
                  <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                    {stats.estadosFormularios.lineaBase.aprobados + stats.estadosFormularios.literalB.aprobados}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Pendientes Validación</span>
                  <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold">
                    {stats.pendientesValidacion}
                  </span>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
