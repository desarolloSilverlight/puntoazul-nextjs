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

  // Calcular plásticos desglosados por categoría (líquidos, otros, construcción)
  const calcularPlasticosDesglosados = (cliente) => {
    const plasticos = cliente.plasticos || [];
    
    // Inicializar contadores para cada categoría y material
    const result = {
      // Líquidos
      liquidos: {
        petAgua: 0,
        petOtros: 0,
        pet: 0,
        hdpe: 0,
        pvc: 0,
        ldpe: 0,
        pp: 0,
        ps: 0,
        otros: 0,
      },
      // Otros Productos
      otrosProductos: {
        pet: 0,
        hdpe: 0,
        pvc: 0,
        ldpe: 0,
        pp: 0,
        ps: 0,
        otros: 0,
      },
      // Construcción
      construccion: {
        pet: 0,
        hdpe: 0,
        pvc: 0,
        ldpe: 0,
        pp: 0,
        ps: 0,
        otros: 0,
      }
    };

    plasticos.forEach((p) => {
      const material = (p.material || "").toUpperCase().trim();
      const tipo = (p.tipo || "").toLowerCase().trim();
      const gramos = Number(p.gramos || 0);
      const unidades = Number(p.unidades || 0);
      const tons = toTon(gramos, unidades);

      // Clasificar según el tipo y material
      if (tipo === "liquidos") {
        if (material === "PET AGUA") {
          result.liquidos.petAgua += tons;
        } else if (material === "PET OTROS") {
          result.liquidos.petOtros += tons;
        } else if (material === "PET") {
          result.liquidos.pet += tons;
        } else if (material === "HDPE") {
          result.liquidos.hdpe += tons;
        } else if (material === "PVC") {
          result.liquidos.pvc += tons;
        } else if (material === "LDPE") {
          result.liquidos.ldpe += tons;
        } else if (material === "PP") {
          result.liquidos.pp += tons;
        } else if (material === "PS") {
          result.liquidos.ps += tons;
        } else if (material === "OTROS") {
          result.liquidos.otros += tons;
        }
      } else if (tipo === "otros") {
        if (material === "PET") {
          result.otrosProductos.pet += tons;
        } else if (material === "HDPE") {
          result.otrosProductos.hdpe += tons;
        } else if (material === "PVC") {
          result.otrosProductos.pvc += tons;
        } else if (material === "LDPE") {
          result.otrosProductos.ldpe += tons;
        } else if (material === "PP") {
          result.otrosProductos.pp += tons;
        } else if (material === "PS") {
          result.otrosProductos.ps += tons;
        } else if (material === "OTROS") {
          result.otrosProductos.otros += tons;
        }
      } else if (tipo === "construccion") {
        if (material === "PET") {
          result.construccion.pet += tons;
        } else if (material === "HDPE") {
          result.construccion.hdpe += tons;
        } else if (material === "PVC") {
          result.construccion.pvc += tons;
        } else if (material === "LDPE") {
          result.construccion.ldpe += tons;
        } else if (material === "PP") {
          result.construccion.pp += tons;
        } else if (material === "PS") {
          result.construccion.ps += tons;
        } else if (material === "OTROS") {
          result.construccion.otros += tons;
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
      liquidos: {
        petAgua: 0,
        petOtros: 0,
        pet: 0,
        hdpe: 0,
        pvc: 0,
        ldpe: 0,
        pp: 0,
        ps: 0,
        otros: 0,
      },
      otrosProductos: {
        pet: 0,
        hdpe: 0,
        pvc: 0,
        ldpe: 0,
        pp: 0,
        ps: 0,
        otros: 0,
      },
      construccion: {
        pet: 0,
        hdpe: 0,
        pvc: 0,
        ldpe: 0,
        pp: 0,
        ps: 0,
        otros: 0,
      },
      total: 0,
    };

    const filas = clientes.map((cliente) => {
      const primSec = calcularPrimarioSecundario(cliente);
      const plast = calcularPlasticosDesglosados(cliente);
      
      // Calcular total del cliente
      const totalCliente = primSec +
        plast.liquidos.petAgua + plast.liquidos.petOtros + plast.liquidos.pet +
        plast.liquidos.hdpe + plast.liquidos.pvc + plast.liquidos.ldpe +
        plast.liquidos.pp + plast.liquidos.ps + plast.liquidos.otros +
        plast.otrosProductos.pet + plast.otrosProductos.hdpe + plast.otrosProductos.pvc +
        plast.otrosProductos.ldpe + plast.otrosProductos.pp + plast.otrosProductos.ps +
        plast.otrosProductos.otros +
        plast.construccion.pet + plast.construccion.hdpe + plast.construccion.pvc +
        plast.construccion.ldpe + plast.construccion.pp + plast.construccion.ps +
        plast.construccion.otros;

      // Acumular totales
      totales.primarioSecundario += primSec;
      totales.liquidos.petAgua += plast.liquidos.petAgua;
      totales.liquidos.petOtros += plast.liquidos.petOtros;
      totales.liquidos.pet += plast.liquidos.pet;
      totales.liquidos.hdpe += plast.liquidos.hdpe;
      totales.liquidos.pvc += plast.liquidos.pvc;
      totales.liquidos.ldpe += plast.liquidos.ldpe;
      totales.liquidos.pp += plast.liquidos.pp;
      totales.liquidos.ps += plast.liquidos.ps;
      totales.liquidos.otros += plast.liquidos.otros;
      totales.otrosProductos.pet += plast.otrosProductos.pet;
      totales.otrosProductos.hdpe += plast.otrosProductos.hdpe;
      totales.otrosProductos.pvc += plast.otrosProductos.pvc;
      totales.otrosProductos.ldpe += plast.otrosProductos.ldpe;
      totales.otrosProductos.pp += plast.otrosProductos.pp;
      totales.otrosProductos.ps += plast.otrosProductos.ps;
      totales.otrosProductos.otros += plast.otrosProductos.otros;
      totales.construccion.pet += plast.construccion.pet;
      totales.construccion.hdpe += plast.construccion.hdpe;
      totales.construccion.pvc += plast.construccion.pvc;
      totales.construccion.ldpe += plast.construccion.ldpe;
      totales.construccion.pp += plast.construccion.pp;
      totales.construccion.ps += plast.construccion.ps;
      totales.construccion.otros += plast.construccion.otros;
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
              {/* Primera fila: agrupaciones de columnas */}
              <tr className="bg-blue-100">
                <th rowSpan="2" className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  Cliente
                </th>
                <th rowSpan="2" className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  Primario+Secundario<br/>(ton)
                </th>
                <th colSpan="9" className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">
                  Líquidos (ton)
                </th>
                <th colSpan="7" className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">
                  Otros Productos Plásticos (ton)
                </th>
                <th colSpan="7" className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-purple-50">
                  Plásticos de Construcción (ton)
                </th>
                <th rowSpan="2" className="px-2 py-2 text-xs font-semibold border border-gray-300">
                  Total<br/>(ton)
                </th>
              </tr>
              {/* Segunda fila: columnas individuales */}
              <tr className="bg-blue-100">
                {/* Líquidos */}
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PET Agua</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PET Otros</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PET</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">HDPE</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PVC</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">LDPE</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PP</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PS</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">Otros</th>
                {/* Otros Productos */}
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">PET</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">HDPE</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">PVC</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">LDPE</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">PP</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">PS</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">Otros</th>
                {/* Construcción */}
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-purple-50">PET</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-purple-50">HDPE</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-purple-50">PVC</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-purple-50">LDPE</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-purple-50">PP</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-purple-50">PS</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-purple-50">Otros</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, idx) => (
                <tr key={idx} className="text-center hover:bg-gray-50">
                  <td className="px-2 py-1 text-xs border border-gray-300 text-left">
                    {fila.nombre}
                    {fila.nit && (
                      <span className="text-gray-500"> ({fila.nit})</span>
                    )}
                  </td>
                  <td className="px-2 py-1 text-xs border border-gray-300">
                    {fmt(fila.primSec)}
                  </td>
                  {/* Líquidos */}
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.petAgua)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.petOtros)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.pet)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.hdpe)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.pvc)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.ldpe)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.pp)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.ps)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.otros)}</td>
                  {/* Otros Productos */}
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.pet)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.hdpe)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.pvc)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.ldpe)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.pp)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.ps)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.otros)}</td>
                  {/* Construcción */}
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.pet)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.hdpe)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.pvc)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.ldpe)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.pp)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.ps)}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.otros)}</td>
                  {/* Total */}
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
                {/* Líquidos */}
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.liquidos.petAgua)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.liquidos.petOtros)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.liquidos.pet)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.liquidos.hdpe)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.liquidos.pvc)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.liquidos.ldpe)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.liquidos.pp)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.liquidos.ps)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.liquidos.otros)}</td>
                {/* Otros Productos */}
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.otrosProductos.pet)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.otrosProductos.hdpe)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.otrosProductos.pvc)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.otrosProductos.ldpe)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.otrosProductos.pp)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.otrosProductos.ps)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.otrosProductos.otros)}</td>
                {/* Construcción */}
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.construccion.pet)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.construccion.hdpe)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.construccion.pvc)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.construccion.ldpe)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.construccion.pp)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.construccion.ps)}</td>
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(totales.construccion.otros)}</td>
                {/* Total */}
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
