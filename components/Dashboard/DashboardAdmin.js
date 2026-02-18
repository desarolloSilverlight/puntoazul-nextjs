import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/config";
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



export default function DashboardAdmin({ tipo }) {
  const emptyStates = { finalizados: 0, guardados: 0, pendientes: 0, aprobados: 0, rechazados: 0 };
  const [stats, setStats] = useState({
    usuariosRegistrados: { vinculados: 0, asociados: 0, total: 0 },
    estadosFormularios: {
      lineaBase: { ...emptyStates },
      literalB: { ...emptyStates }
    },
    pendientesValidacion: 0,
  });

  const [selectedYear, setSelectedYear] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [error, setError] = useState(null);

  const shouldLoadLineaBase = tipo !== "B";
  const shouldLoadLiteralB = tipo !== "F";

  const extractRows = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.empresas)) return payload.empresas;
    if (Array.isArray(payload.result)) return payload.result;
    return [];
  };

  const dedupeRowsByNitAndYear = (rows, year) => {
    if (!Array.isArray(rows)) return [];
    const uniques = new Map();
    rows.forEach((row, index) => {
      const nit = (row?.nit || row?.NIT || row?.identificacion || row?.usuario_nit || row?.documento || "").toString();
      const rowYear = row?.anoReporte || row?.ano_reportado || row?.ano || year;
      const fallback = row?.idInformacionF || row?.idInformacionB || row?.id || `row_${index}`;
      const key = nit ? `${nit}_${rowYear}` : `${fallback}_${rowYear}`;

      if (!uniques.has(key)) {
        uniques.set(key, row);
      } else {
        const existing = uniques.get(key);
        const currentId = row?.idInformacionF || row?.idInformacionB || "";
        const existingId = existing?.idInformacionF || existing?.idInformacionB || "";
        const currentIsHist = currentId.toString().toLowerCase().startsWith("hist");
        const existingIsHist = existingId.toString().toLowerCase().startsWith("hist");

        if (existingIsHist && !currentIsHist) {
          uniques.set(key, row);
        }
      }
    });
    return Array.from(uniques.values());
  };

  const aggregateStatus = (rows) => {
    const result = { ...emptyStates };

    rows.forEach((row) => {
      const estado = (row?.estado || "").toString().toLowerCase();

      if (estado.includes("rechaz")) {
        result.rechazados += 1;
      } else if (estado.includes("pend") || estado.includes("revision") || estado.includes("revisión")) {
        result.pendientes += 1;
      } else if (estado.includes("finaliz")) {
        result.finalizados += 1;
      } else if (estado.includes("aprobad")) {
        result.aprobados += 1;
      } else if (estado.includes("guard") || estado.includes("progreso") || estado.includes("proceso") || estado.includes("borrador")) {
        result.guardados += 1;
      } else {
        result.guardados += 1;
      }
    });

    return result;
  };

  // Cargar usuarios y años disponibles
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setLoadingBase(true);
        setError(null);

        const [vinculadosResponse, asociadosResponse, anosFResponse, anosBResponse] = await Promise.all([
          shouldLoadLineaBase
            ? fetch(`${API_BASE_URL}/users/perfilUser?nombrePerfil=Vinculado`)
            : Promise.resolve({ ok: true, json: async () => [] }),
          shouldLoadLiteralB
            ? fetch(`${API_BASE_URL}/users/perfilUser?nombrePerfil=Asociado`)
            : Promise.resolve({ ok: true, json: async () => [] }),
          shouldLoadLineaBase
            ? fetch(`${API_BASE_URL}/informacion-f/getAnosReporte`)
            : Promise.resolve({ ok: true, json: async () => [] }),
          shouldLoadLiteralB
            ? fetch(`${API_BASE_URL}/informacion-b/getAnosReporte`)
            : Promise.resolve({ ok: true, json: async () => [] })
        ]);

        const [vinculadosData, asociadosData, anosFData, anosBData] = await Promise.all([
          vinculadosResponse.json(),
          asociadosResponse.json(),
          anosFResponse.json(),
          anosBResponse.json()
        ]);

        const vinculados = Array.isArray(vinculadosData) ? vinculadosData.length : 0;
        const asociados = Array.isArray(asociadosData) ? asociadosData.length : 0;
        const yearsF = extractRows(anosFData).length ? extractRows(anosFData) : (Array.isArray(anosFData) ? anosFData : []);
        const yearsB = extractRows(anosBData).length ? extractRows(anosBData) : (Array.isArray(anosBData) ? anosBData : []);

        const mergedYears = Array.from(
          new Set(
            [...yearsF, ...yearsB]
              .map((year) => parseInt(year, 10))
              .filter((year) => !isNaN(year))
          )
        ).sort((a, b) => b - a);

        setAvailableYears(mergedYears);
        setSelectedYear((current) => {
          if (current && mergedYears.includes(parseInt(current, 10))) return current;
          return mergedYears.length > 0 ? mergedYears[0].toString() : "";
        });

        const visibleVinculados = shouldLoadLineaBase ? vinculados : 0;
        const visibleAsociados = shouldLoadLiteralB ? asociados : 0;

        setStats((prev) => ({
          ...prev,
          usuariosRegistrados: {
            vinculados: visibleVinculados,
            asociados: visibleAsociados,
            total: visibleVinculados + visibleAsociados,
          },
        }));

      } catch (err) {
        setError(err.message);
        console.error("Error cargando base del dashboard:", err);
      } finally {
        setLoadingBase(false);
      }
    };

    fetchBaseData();
  }, [tipo]);

  // Cargar métricas por año usando la misma lógica base de reportes
  useEffect(() => {
    if (!selectedYear) {
      setStats((prev) => ({
        ...prev,
        estadosFormularios: { lineaBase: { ...emptyStates }, literalB: { ...emptyStates } },
        pendientesValidacion: 0,
      }));
      return;
    }

    const fetchMetricsByYear = async () => {
      try {
        setLoadingMetrics(true);
        setError(null);
        const year = parseInt(selectedYear, 10);

        const requestBodyLB = JSON.stringify({
          literal: "linea_base",
          reporte: "estado",
          cliente: null,
          ano: year,
        });
        const requestBodyB = JSON.stringify({
          literal: "literal_b",
          reporte: "estado",
          cliente: null,
          ano: year,
        });

        const [lineaBaseResponse, literalBResponse] = await Promise.all([
          shouldLoadLineaBase
            ? fetch(`${API_BASE_URL}/informacion-f/reporteEstado`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: requestBodyLB,
                credentials: "include",
              })
            : Promise.resolve({ ok: true, json: async () => [] }),
          shouldLoadLiteralB
            ? fetch(`${API_BASE_URL}/informacion-b/reporteEstado`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: requestBodyB,
                credentials: "include",
              })
            : Promise.resolve({ ok: true, json: async () => [] }),
        ]);

        const [lineaBasePayload, literalBPayload] = await Promise.all([
          lineaBaseResponse.json(),
          literalBResponse.json(),
        ]);

        const lineaBaseRows = shouldLoadLineaBase
          ? dedupeRowsByNitAndYear(extractRows(lineaBasePayload), year)
          : [];
        const literalBRows = shouldLoadLiteralB
          ? dedupeRowsByNitAndYear(extractRows(literalBPayload), year)
          : [];

        const estadosFormularios = {
          lineaBase: shouldLoadLineaBase ? aggregateStatus(lineaBaseRows) : { ...emptyStates },
          literalB: shouldLoadLiteralB ? aggregateStatus(literalBRows) : { ...emptyStates },
        };

        const pendientesValidacion = estadosFormularios.lineaBase.pendientes + estadosFormularios.literalB.pendientes;

        setStats((prev) => ({
          ...prev,
          estadosFormularios,
          pendientesValidacion,
        }));
      } catch (err) {
        setError(err.message);
        console.error("Error cargando métricas por año:", err);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetricsByYear();
  }, [selectedYear, tipo]);

  const loading = loadingBase || loadingMetrics;

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
    labels: ['Finalizados', 'Guardados', 'Pendientes', 'Aprobados', 'Rechazados'],
    datasets: [
      ...(tipo === 'B' ? [] : [{
        label: 'Línea Base',
        data: [
          stats.estadosFormularios.lineaBase.finalizados,
          stats.estadosFormularios.lineaBase.guardados,
          stats.estadosFormularios.lineaBase.pendientes,
          stats.estadosFormularios.lineaBase.aprobados,
          stats.estadosFormularios.lineaBase.rechazados
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]),
      ...(tipo === 'F' ? [] : [{
        label: 'Literal B',
        data: [
          stats.estadosFormularios.literalB.finalizados,
          stats.estadosFormularios.literalB.guardados,
          stats.estadosFormularios.literalB.pendientes,
          stats.estadosFormularios.literalB.aprobados,
          stats.estadosFormularios.literalB.rechazados
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }])
    ]
  };

  // Helpers de presentación
  const safePercent = (num, den) => {
    const n = Number(num) || 0;
    const d = Number(den) || 0;
    if (d <= 0) return 0;
    return Math.round((n / d) * 100);
  };

  const aprobadosLB = shouldLoadLineaBase ? stats.estadosFormularios.lineaBase.aprobados : 0;
  const aprobadosB = shouldLoadLiteralB ? stats.estadosFormularios.literalB.aprobados : 0;
  const finalizadosLB = shouldLoadLineaBase ? stats.estadosFormularios.lineaBase.finalizados : 0;
  const finalizadosB = shouldLoadLiteralB ? stats.estadosFormularios.literalB.finalizados : 0;
  const pendientesLB = shouldLoadLineaBase ? stats.estadosFormularios.lineaBase.pendientes : 0;
  const pendientesB = shouldLoadLiteralB ? stats.estadosFormularios.literalB.pendientes : 0;
  const usuariosV = stats.usuariosRegistrados.vinculados;
  const usuariosA = stats.usuariosRegistrados.asociados;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Card principal que contiene todo el dashboard */}
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header del Dashboard */}
        <div className="p-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Dashboard Administrativo</h1>
          <p className="text-gray-600 text-lg">Panel de control y métricas del sistema Punto Azul</p>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Año de análisis</label>
              <select
                className="w-full border border-gray-300 rounded p-2 bg-white"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={!availableYears.length}
              >
                <option value="">Seleccione año...</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm font-medium text-blueGray-600">
              {selectedYear
                ? `Mostrando métricas del año ${selectedYear}`
                : "No hay años disponibles para mostrar métricas"}
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Usuarios"
              value={stats.usuariosRegistrados.total}
              subtitle={`${tipo !== 'B' ? `Vinculados: ${stats.usuariosRegistrados.vinculados}` : ''}${tipo ? ' ' : ' | '}${tipo !== 'F' ? `Asociados: ${stats.usuariosRegistrados.asociados}` : ''}`}
              icon="fas fa-users"
              color="blue"
            />
            
            <StatsCard
              title="Pendientes Validación"
              value={tipo === 'B' ? pendientesB : tipo === 'F' ? pendientesLB : stats.pendientesValidacion}
              subtitle={tipo === 'B' ? `${pendientesB} Asociados` : tipo === 'F' ? `${pendientesLB} Vinculados` : `${pendientesLB} Vinculados | ${pendientesB} Asociados`}
              icon="fas fa-clock"
              color="orange"
            />
            
            <StatsCard
              title="Formularios Aprobados"
              value={tipo === 'B' ? aprobadosB : tipo === 'F' ? aprobadosLB : (aprobadosLB + aprobadosB)}
              subtitle={tipo === 'B' ? `${aprobadosB} Asociados` : tipo === 'F' ? `${aprobadosLB} Vinculados` : `${aprobadosLB} Vinculados | ${aprobadosB} Asociados`}
              icon="fas fa-check-circle"
              color="green"
            />
            
            <StatsCard
              title="Cobertura"
              value={
                tipo === 'B'
                  ? `A: ${safePercent(finalizadosB, usuariosA)}%`
                  : tipo === 'F'
                    ? `V: ${safePercent(finalizadosLB, usuariosV)}%`
                    : `V: ${safePercent(finalizadosLB, usuariosV)}% | A: ${safePercent(finalizadosB, usuariosA)}%`
              }
              subtitle="% Finalizados por tipo"
              icon="fas fa-percentage"
              color="purple"
            />
          </div>

          {/* Estados de Formularios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {tipo !== 'B' && (
            <FormStatusCard
              title="Formularios Línea Base (Vinculados)"
              states={stats.estadosFormularios.lineaBase}
              totalUsers={stats.usuariosRegistrados.vinculados}
              type="lineaBase"
            />)}
            
            {tipo !== 'F' && (
            <FormStatusCard
              title="Formularios Literal B (Asociados)"
              states={stats.estadosFormularios.literalB}
              totalUsers={stats.usuariosRegistrados.asociados}
              type="literalB"
            />)}
          </div>

          {/* Gráfico de Estados */}
          <div className="mb-10">
            <ChartCard
              title={`Distribución de Estados por Tipo de Formulario${selectedYear ? ` - Año ${selectedYear}` : ""}`}
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
