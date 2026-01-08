import React, { useMemo } from "react";

// Muestra una tabla por año con filas de clientes y sus datos consolidados
// datosRaw: [{ idInformacionF, nombre, nit, ano_reportado, primarios: [], secundarios: [], plasticos: [] }]
export default function ConsolidadoF({ datosRaw }) {
  console.log('ConsolidadoF - datosRaw recibidos:', datosRaw);
  console.log('ConsolidadoF - tipo de datosRaw:', typeof datosRaw, Array.isArray(datosRaw));
  
  // Agrupar datos por año
  const datosPorAnio = useMemo(() => {
    if (!datosRaw || !Array.isArray(datosRaw)) return {};
    const grupos = {};
    datosRaw.forEach((cliente) => {
      const anio = cliente.ano_reportado || "Sin año";
      if (!grupos[anio]) grupos[anio] = [];
      grupos[anio].push(cliente);
    });
    return grupos;
  }, [datosRaw]);

  const anios = Object.keys(datosPorAnio).sort();

  if (anios.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        No hay datos de consolidado para mostrar.
      </div>
    );
  }

  const fmt = (n) => {
    const num = Number(n || 0);
    // Mostrar hasta 8 decimales pero eliminar ceros innecesarios al final
    return num.toFixed(8).replace(/\.?0+$/, '') || '0';
  };

  // Convertir gramos * unidades a toneladas
  const toTon = (gramos, unidades) => {
    const g = Number(gramos || 0);
    const u = Number(unidades || 0);
    return (g * u) / 1000000;
  };

  // Calcular Primario+Secundario (suma de todos los materiales base)
  const calcularPrimarioSecundario = (cliente) => {
    let total = 0;
    const primarios = cliente.primarios || [];
    const secundarios = cliente.secundarios || [];
    
    primarios.forEach((p) => {
      total += toTon(p.gramos, p.unidades);
    });
    secundarios.forEach((s) => {
      total += toTon(s.gramos, s.unidades);
    });
    
    return total;
  };

  // Calcular plásticos con lógica especial para PET
  const calcularPlasticos = (cliente) => {
    const plasticos = cliente.plasticos || [];
    
    // Inicializar contadores
    const result = {
      petAgua: 0,
      petOtros: 0,
      pet: 0,
      hdpe: 0,
      pvc: 0,
      ldpe: 0,
      pp: 0,
      ps: 0,
      otros: 0,
    };

    plasticos.forEach((p) => {
      const tons = toTon(p.gramos, p.unidades);
      const material = (p.material || "").toLowerCase();
      const tipo = (p.tipo || "").toLowerCase();

      // Parsear liquidos, otros, construccion
      let liquidos = {};
      let otros = {};
      let construccion = {};
      
      try {
        liquidos = JSON.parse(p.liquidos || "{}");
      } catch (e) {
        liquidos = {};
      }
      try {
        otros = JSON.parse(p.otros || "{}");
      } catch (e) {
        otros = {};
      }
      try {
        construccion = JSON.parse(p.construccion || "{}");
      } catch (e) {
        construccion = {};
      }

      // Lógica especial para PET:
      // PET Agua: solo de liquidos.petAgua
      // PET Otros: liquidos.petOtros + liquidos.pet
      // PET: otros.pet + construccion.pet
      
      if (tipo === "liquidos") {
        if (material === "pet agua") {
          result.petAgua += tons;
        } else if (material === "pet otros") {
          result.petOtros += tons;
        } else if (material === "pet") {
          result.petOtros += tons; // liquidos.pet va a PET Otros
        } else if (material === "hdpe") {
          result.hdpe += tons;
        } else if (material === "pvc") {
          result.pvc += tons;
        } else if (material === "ldpe") {
          result.ldpe += tons;
        } else if (material === "pp") {
          result.pp += tons;
        } else if (material === "ps") {
          result.ps += tons;
        } else if (material === "otros") {
          result.otros += tons;
        }
      } else if (tipo === "otros") {
        if (material === "pet") {
          result.pet += tons; // otros.pet va a PET
        } else if (material === "hdpe") {
          result.hdpe += tons;
        } else if (material === "pvc") {
          result.pvc += tons;
        } else if (material === "ldpe") {
          result.ldpe += tons;
        } else if (material === "pp") {
          result.pp += tons;
        } else if (material === "ps") {
          result.ps += tons;
        } else if (material === "otros") {
          result.otros += tons;
        }
      } else if (tipo === "construccion") {
        if (material === "pet") {
          result.pet += tons; // construccion.pet va a PET
        } else if (material === "hdpe") {
          result.hdpe += tons;
        } else if (material === "pvc") {
          result.pvc += tons;
        } else if (material === "ldpe") {
          result.ldpe += tons;
        } else if (material === "pp") {
          result.pp += tons;
        } else if (material === "ps") {
          result.ps += tons;
        } else if (material === "otros") {
          result.otros += tons;
        }
      }
    });

    return result;
  };

  // Renderizar tabla para un año específico
  const renderTabla = (anio) => {
    const clientes = datosPorAnio[anio] || [];
    
    // Calcular totales para cada columna
    const totales = {
      primarioSecundario: 0,
      petAgua: 0,
      petOtros: 0,
      pet: 0,
      hdpe: 0,
      pvc: 0,
      ldpe: 0,
      pp: 0,
      ps: 0,
      otros: 0,
      total: 0,
    };

    const filas = clientes.map((cliente) => {
      const primSec = calcularPrimarioSecundario(cliente);
      const plast = calcularPlasticos(cliente);
      
      const totalCliente =
        primSec +
        plast.petAgua +
        plast.petOtros +
        plast.pet +
        plast.hdpe +
        plast.pvc +
        plast.ldpe +
        plast.pp +
        plast.ps +
        plast.otros;

      // Acumular totales
      totales.primarioSecundario += primSec;
      totales.petAgua += plast.petAgua;
      totales.petOtros += plast.petOtros;
      totales.pet += plast.pet;
      totales.hdpe += plast.hdpe;
      totales.pvc += plast.pvc;
      totales.ldpe += plast.ldpe;
      totales.pp += plast.pp;
      totales.ps += plast.ps;
      totales.otros += plast.otros;
      totales.total += totalCliente;

      return {
        nombre: cliente.nombre || "Sin nombre",
        nit: cliente.nit || "",
        primSec,
        plast,
        totalCliente,
      };
    });

    return (
      <div key={anio} className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-center">
          Consolidado Línea Base - Año {anio} (Todos los estados)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-100">
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  Cliente
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  Primario+Secundario (ton)
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  PET Agua (ton)
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  PET Otros (ton)
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  PET (ton)
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  HDPE (ton)
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  PVC (ton)
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  LDPE (ton)
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  PP (ton)
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  PS (ton)
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  Otros (ton)
                </th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  Total (ton)
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => (
                <tr key={idx} className="text-center hover:bg-gray-50">
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fila.nombre}
                    {fila.nit && (
                      <span className="text-gray-500"> ({fila.nit})</span>
                    )}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.primSec)}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.plast.petAgua)}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.plast.petOtros)}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.plast.pet)}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.plast.hdpe)}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.plast.pvc)}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.plast.ldpe)}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.plast.pp)}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.plast.ps)}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.plast.otros)}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300 font-semibold">
                    {fmt(fila.totalCliente)}
                  </td>
                </tr>
              ))}
              {/* Fila de totales */}
              <tr className="bg-yellow-200 font-bold text-center">
                <td className="px-2 py-2 text-xs font-bold border border-gray-300">
                  TOTAL
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.primarioSecundario)}
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.petAgua)}
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.petOtros)}
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.pet)}
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.hdpe)}
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.pvc)}
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.ldpe)}
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.pp)}
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.ps)}
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.otros)}
                </td>
                <td className="px-2 py-2 text-xs border border-gray-300">
                  {fmt(totales.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {anios.map((anio) => renderTabla(anio))}
    </div>
  );
}
