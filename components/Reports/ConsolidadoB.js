import React from "react";

// Tabla consolidada de Literal B: una fila por cliente finalizado + fila TOTAL
export default function ConsolidadoB({ filas, total }) {
  // filas: [{ nombre, nit, origen, resumen: { rxEmpaque, rxTotal, otcEmpaque, otcTotal, instEmpaque, instTotal, intraEmpaque, intraTotal, mmEmpaque, mmTotal, totalEmpaques, totalProducto, totalFormula } }]
  // total: objeto con mismas claves numéricas sumadas

  if (!Array.isArray(filas) || filas.length === 0) {
    return <div className="p-4 text-center text-gray-600">No hay datos de consolidado para mostrar.</div>;
  }

  const fmt2 = (n) => (Number(n || 0)).toFixed(2);

  return (
    <div className="overflow-x-auto">
      <h3 className="text-lg font-semibold mb-3 text-center">Consolidado Literal B - Resumen (Todos los finalizados)</h3>
      <table className="w-full table-auto border-separate border-spacing-1 border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Razón Social</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">NIT</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Origen</th>
            <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Comercial RX</th>
            <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Comercial OTC</th>
            <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Institucional</th>
            <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Intrahosp.</th>
            <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Muestras</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Total Empaques</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Total Producto</th>
            <th rowSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Total Fórmula</th>
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
          {filas.map((f, idx) => (
            <tr key={idx} className="text-center">
              <td className="px-2 py-1 text-xs border border-gray-300">{f.nombre}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{f.nit}</td>
              <td className="px-2 py-1 text-xs border border-gray-300">{f.origen || '-'}</td>
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
              <td className="px-2 py-1 text-xs border border-gray-300">{fmt2(f.resumen.totalFormula)}</td>
            </tr>
          ))}
          {/* Fila TOTAL */}
          <tr className="text-center bg-green-50 font-bold">
            <td className="px-2 py-1 text-xs border border-gray-300">TOTAL</td>
            <td className="px-2 py-1 text-xs border border-gray-300">-</td>
            <td className="px-2 py-1 text-xs border border-gray-300">-</td>
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
          </tr>
        </tbody>
      </table>
    </div>
  );
}
