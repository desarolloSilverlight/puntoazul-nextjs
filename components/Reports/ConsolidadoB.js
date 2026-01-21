import React, { useState, useMemo } from "react";

// Tabla consolidada de Literal B: una fila por cliente finalizado + fila TOTAL
export default function ConsolidadoB({ filas, total, año }) {
  // Estados para paginación y búsqueda
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [busqueda, setBusqueda] = useState("");

  // Obtener el año actual y años históricos de los datos
  const primeraFila = filas?.[0];
  const añoActual = primeraFila?.anoReporte || año;
  const year1 = primeraFila?.historicoYear1?.anoReporte || (añoActual ? añoActual - 1 : null);
  const year2 = primeraFila?.historicoYear2?.anoReporte || (añoActual ? añoActual - 2 : null);

  // Filtrar filas según búsqueda
  const filasFiltradas = useMemo(() => {
    if (!Array.isArray(filas) || filas.length === 0) return [];
    if (!busqueda.trim()) return filas;
    const busquedaLower = busqueda.toLowerCase();
    return filas.filter(f => 
      (f.nombre || '').toLowerCase().includes(busquedaLower) ||
      (f.nit || '').toLowerCase().includes(busquedaLower) ||
      (f.origen || '').toLowerCase().includes(busquedaLower) ||
      (f.grupo || '').toLowerCase().includes(busquedaLower)
    );
  }, [filas, busqueda]);

  // Calcular paginación
  const totalPaginas = Math.ceil(filasFiltradas.length / filasPorPagina);
  const indiceInicio = (paginaActual - 1) * filasPorPagina;
  const indiceFin = indiceInicio + filasPorPagina;
  const filasPaginadas = filasFiltradas.slice(indiceInicio, indiceFin);

  // Resetear a página 1 cuando cambia la búsqueda
  React.useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filasPorPagina]);

  // Early return después de todos los hooks
  if (!Array.isArray(filas) || filas.length === 0) {
    return <div className="p-4 text-center text-gray-600">No hay datos de consolidado para mostrar.</div>;
  }

  const fmt2 = (n) => (Number(n || 0)).toFixed(2);

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3 text-center">
          Consolidado Literal B - Año {añoActual || 'N/A'}
        </h3>
        
        {/* Controles de búsqueda y paginación */}
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Mostrar:</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={filasPorPagina}
              onChange={(e) => setFilasPorPagina(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm">registros</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Buscar:</label>
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-1 text-sm"
              placeholder="Nombre, NIT, Origen..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          Mostrando {indiceInicio + 1} a {Math.min(indiceFin, filasFiltradas.length)} de {filasFiltradas.length} registros
          {busqueda && ` (filtrados de ${filas.length} registros totales)`}
        </div>
      </div>

      <table className="w-full table-auto border-separate border-spacing-1 border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Razón Social</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">NIT</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Origen</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Grupo ({añoActual || 'N/A'})</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300 bg-blue-50">Grupo ({year1 || 'N/A'})</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300 bg-blue-100">Grupo ({year2 || 'N/A'})</th>
            <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Comercial RX</th>
            <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Comercial OTC</th>
            <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Institucional</th>
            <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Intrahosp.</th>
            <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Muestras</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Total Empaques</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Total Producto</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Total Facturación ({añoActual || 'N/A'})</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300 bg-blue-50">Total Facturación ({year1 || 'N/A'})</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300 bg-blue-100">Total Facturación ({year2 || 'N/A'})</th>
          </tr>
          <tr className="bg-gray-100">
            <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Empaque</th>
            <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Total</th>
            <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Empaque</th>
            <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Total</th>
            <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Empaque</th>
            <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Total</th>
            <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Empaque</th>
            <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Total</th>
            <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Empaque</th>
            <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Total</th>
          </tr>
        </thead>
        <tbody>
          {filasPaginadas.map((f, idx) => (
            <tr key={idx} className="text-center hover:bg-gray-50">
              <td className="px-2 py-1 text-xs border border-gray-300">{f.nombre}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{f.nit}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{f.origen || '-'}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{f.grupo || 'Sin grupo'}</td>
              <td className="px-2 py-1 text-xs border border-gray-300 bg-blue-50">{f.historicoYear1?.grupo || '-'}</td>
              <td className="px-2 py-1 text-xs border border-gray-300 bg-blue-100">{f.historicoYear2?.grupo || '-'}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.pesoEmpaqueComercialRX)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.pesoTotalComercialRX)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.pesoEmpaqueComercialOTC)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.pesoTotalComercialOTC)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.pesoEmpaqueInstitucional)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.pesoTotalInstitucional)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.pesoEmpaqueIntrahospitalario)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.pesoTotalIntrahospitalario)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.pesoEmpaqueMuestrasMedicas)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.pesoTotalMuestrasMedicas)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.totalPesoEmpaques)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.totalPesoProducto)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300 font-semibold">{fmt2(f.resumen.totalFormula)}</td>
              <td className="px-2 py-1 text-xs border border-gray-300 bg-blue-50">{f.historicoYear1?.totalPesoFacturacion ? fmt2(f.historicoYear1.totalPesoFacturacion) : '-'}</td>
              <td className="px-2 py-1 text-xs border border-gray-300 bg-blue-100">{f.historicoYear2?.totalPesoFacturacion ? fmt2(f.historicoYear2.totalPesoFacturacion) : '-'}</td>
            </tr>
          ))}
          {/* Fila TOTAL */}
          <tr className="text-center bg-green-50 font-bold">
            <td className="px-2 py-1 text-xs border border-gray-300">TOTAL</td>
            <td className="px-2 py-1 text-xs border border-gray-300">-</td>
            <td className="px-2 py-1 text-xs border border-gray-300">-</td>
            <td className="px-2 py-1 text-xs border border-gray-300">-</td>
            <td className="px-2 py-1 text-xs border border-gray-300 bg-blue-50">-</td>
            <td className="px-2 py-1 text-xs border border-gray-300 bg-blue-100">-</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.pesoEmpaqueComercialRX)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.pesoTotalComercialRX)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.pesoEmpaqueComercialOTC)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.pesoTotalComercialOTC)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.pesoEmpaqueInstitucional)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.pesoTotalInstitucional)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.pesoEmpaqueIntrahospitalario)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.pesoTotalIntrahospitalario)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.pesoEmpaqueMuestrasMedicas)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.pesoTotalMuestrasMedicas)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.totalPesoEmpaques)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.totalPesoProducto)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(total.totalFormula)}</td>
            <td className="px-2 py-1 text-xs border border-gray-300 bg-blue-50">-</td>
            <td className="px-2 py-1 text-xs border border-gray-300 bg-blue-100">-</td>
          </tr>
        </tbody>
      </table>

      {/* Controles de paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
          >
            ← Anterior
          </button>
          
          <div className="flex gap-2 items-center">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => {
              // Mostrar solo algunas páginas alrededor de la actual
              if (
                num === 1 ||
                num === totalPaginas ||
                (num >= paginaActual - 1 && num <= paginaActual + 1)
              ) {
                return (
                  <button
                    key={num}
                    className={`px-3 py-1 border rounded text-sm ${
                      paginaActual === num
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                    onClick={() => setPaginaActual(num)}
                  >
                    {num}
                  </button>
                );
              } else if (num === paginaActual - 2 || num === paginaActual + 2) {
                return <span key={num} className="px-2">...</span>;
              }
              return null;
            })}
          </div>
          
          <button
            className="px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
