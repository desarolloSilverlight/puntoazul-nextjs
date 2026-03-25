import React, { useMemo, useState } from "react";

const DEFAULT_TABLE_STATE = {
  paginaActual: 1,
  filasPorPagina: 10,
  busqueda: "",
};

const PLASTIC_ZERO = {
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
};

const toTon = (gramos, unidades) => {
  const g = Number(gramos || 0);
  const u = Number(unidades || 0);
  return (g * u) / 1000000;
};

const fmt = (n) => {
  const num = Number(n || 0);
  return num.toFixed(8).replace(/\.?0+$/, "") || "0";
};

const normalizeMaterial = (value) => {
  const material = String(value || "").trim().toUpperCase();
  return material || "SIN MATERIAL";
};

const calculateMaterialSummary = (items = []) => {
  const byMaterial = {};
  let subtotal = 0;

  items.forEach((item) => {
    const tons = toTon(item.gramos, item.unidades);
    const material = normalizeMaterial(item.material);
    byMaterial[material] = (byMaterial[material] || 0) + tons;
    subtotal += tons;
  });

  return { byMaterial, subtotal };
};

const calculatePlasticBreakdown = (cliente) => {
  const result = JSON.parse(JSON.stringify(PLASTIC_ZERO));
  const plasticos = cliente.plasticos || [];

  plasticos.forEach((p) => {
    const material = (p.material || "").toUpperCase().trim();
    const tipo = (p.tipo || "").toLowerCase().trim();
    const tons = toTon(p.gramos, p.unidades);

    if (tipo === "liquidos") {
      if (material === "PET AGUA") result.liquidos.petAgua += tons;
      else if (material === "PET OTROS") result.liquidos.petOtros += tons;
      else if (material === "PET") result.liquidos.pet += tons;
      else if (material === "HDPE") result.liquidos.hdpe += tons;
      else if (material === "PVC") result.liquidos.pvc += tons;
      else if (material === "LDPE") result.liquidos.ldpe += tons;
      else if (material === "PP") result.liquidos.pp += tons;
      else if (material === "PS") result.liquidos.ps += tons;
      else if (material === "OTROS") result.liquidos.otros += tons;
    } else if (tipo === "otros") {
      if (material === "PET") result.otrosProductos.pet += tons;
      else if (material === "HDPE") result.otrosProductos.hdpe += tons;
      else if (material === "PVC") result.otrosProductos.pvc += tons;
      else if (material === "LDPE") result.otrosProductos.ldpe += tons;
      else if (material === "PP") result.otrosProductos.pp += tons;
      else if (material === "PS") result.otrosProductos.ps += tons;
      else if (material === "OTROS") result.otrosProductos.otros += tons;
    } else if (tipo === "construccion") {
      if (material === "PET") result.construccion.pet += tons;
      else if (material === "HDPE") result.construccion.hdpe += tons;
      else if (material === "PVC") result.construccion.pvc += tons;
      else if (material === "LDPE") result.construccion.ldpe += tons;
      else if (material === "PP") result.construccion.pp += tons;
      else if (material === "PS") result.construccion.ps += tons;
      else if (material === "OTROS") result.construccion.otros += tons;
    }
  });

  return result;
};

const emptyConsolidadoTotals = () => ({
  primarioSecundario: 0,
  liquidos: { ...PLASTIC_ZERO.liquidos },
  otrosProductos: { ...PLASTIC_ZERO.otrosProductos },
  construccion: { ...PLASTIC_ZERO.construccion },
  total: 0,
});

const getSearchText = (row) => `${row.nombre || ""} ${row.nit || ""}`.toLowerCase();

export default function ConsolidadoF({ datosRaw }) {
  const [tableStateByKey, setTableStateByKey] = useState({});

  const getTableState = (key) => ({
    ...DEFAULT_TABLE_STATE,
    ...(tableStateByKey[key] || {}),
  });

  const updateTableState = (key, patch) => {
    setTableStateByKey((prev) => ({
      ...prev,
      [key]: {
        ...DEFAULT_TABLE_STATE,
        ...(prev[key] || {}),
        ...patch,
      },
    }));
  };

  const datosPorAnio = useMemo(() => {
    if (!Array.isArray(datosRaw)) return {};
    return datosRaw.reduce((acc, cliente) => {
      const anio = cliente.ano_reportado || "Sin año";
      if (!acc[anio]) acc[anio] = [];
      acc[anio].push(cliente);
      return acc;
    }, {});
  }, [datosRaw]);

  const anios = Object.keys(datosPorAnio).sort();

  const computedByAnio = useMemo(() => {
    const result = {};

    anios.forEach((anio) => {
      const clientes = datosPorAnio[anio] || [];
      const consolidadoTotales = emptyConsolidadoTotals();

      const primariosRows = [];
      const secundariosRows = [];
      const primariosMateriales = new Set();
      const secundariosMateriales = new Set();
      const primariosTotalesByMaterial = {};
      const secundariosTotalesByMaterial = {};
      let primariosSubtotalGlobal = 0;
      let secundariosSubtotalGlobal = 0;

      const consolidadoRows = clientes.map((cliente) => {
        const primarios = calculateMaterialSummary(cliente.primarios || []);
        const secundarios = calculateMaterialSummary(cliente.secundarios || []);
        const plast = calculatePlasticBreakdown(cliente);

        Object.keys(primarios.byMaterial).forEach((material) => {
          primariosMateriales.add(material);
          primariosTotalesByMaterial[material] =
            (primariosTotalesByMaterial[material] || 0) + primarios.byMaterial[material];
        });
        Object.keys(secundarios.byMaterial).forEach((material) => {
          secundariosMateriales.add(material);
          secundariosTotalesByMaterial[material] =
            (secundariosTotalesByMaterial[material] || 0) + secundarios.byMaterial[material];
        });

        primariosSubtotalGlobal += primarios.subtotal;
        secundariosSubtotalGlobal += secundarios.subtotal;

        const primSec = primarios.subtotal + secundarios.subtotal;
        const totalCliente =
          primSec +
          plast.liquidos.petAgua +
          plast.liquidos.petOtros +
          plast.liquidos.pet +
          plast.liquidos.hdpe +
          plast.liquidos.pvc +
          plast.liquidos.ldpe +
          plast.liquidos.pp +
          plast.liquidos.ps +
          plast.liquidos.otros +
          plast.otrosProductos.pet +
          plast.otrosProductos.hdpe +
          plast.otrosProductos.pvc +
          plast.otrosProductos.ldpe +
          plast.otrosProductos.pp +
          plast.otrosProductos.ps +
          plast.otrosProductos.otros +
          plast.construccion.pet +
          plast.construccion.hdpe +
          plast.construccion.pvc +
          plast.construccion.ldpe +
          plast.construccion.pp +
          plast.construccion.ps +
          plast.construccion.otros;

        consolidadoTotales.primarioSecundario += primSec;
        consolidadoTotales.liquidos.petAgua += plast.liquidos.petAgua;
        consolidadoTotales.liquidos.petOtros += plast.liquidos.petOtros;
        consolidadoTotales.liquidos.pet += plast.liquidos.pet;
        consolidadoTotales.liquidos.hdpe += plast.liquidos.hdpe;
        consolidadoTotales.liquidos.pvc += plast.liquidos.pvc;
        consolidadoTotales.liquidos.ldpe += plast.liquidos.ldpe;
        consolidadoTotales.liquidos.pp += plast.liquidos.pp;
        consolidadoTotales.liquidos.ps += plast.liquidos.ps;
        consolidadoTotales.liquidos.otros += plast.liquidos.otros;
        consolidadoTotales.otrosProductos.pet += plast.otrosProductos.pet;
        consolidadoTotales.otrosProductos.hdpe += plast.otrosProductos.hdpe;
        consolidadoTotales.otrosProductos.pvc += plast.otrosProductos.pvc;
        consolidadoTotales.otrosProductos.ldpe += plast.otrosProductos.ldpe;
        consolidadoTotales.otrosProductos.pp += plast.otrosProductos.pp;
        consolidadoTotales.otrosProductos.ps += plast.otrosProductos.ps;
        consolidadoTotales.otrosProductos.otros += plast.otrosProductos.otros;
        consolidadoTotales.construccion.pet += plast.construccion.pet;
        consolidadoTotales.construccion.hdpe += plast.construccion.hdpe;
        consolidadoTotales.construccion.pvc += plast.construccion.pvc;
        consolidadoTotales.construccion.ldpe += plast.construccion.ldpe;
        consolidadoTotales.construccion.pp += plast.construccion.pp;
        consolidadoTotales.construccion.ps += plast.construccion.ps;
        consolidadoTotales.construccion.otros += plast.construccion.otros;
        consolidadoTotales.total += totalCliente;

        const baseRow = {
          nombre: cliente.nombre || "Sin nombre",
          nit: cliente.nit || "",
        };

        primariosRows.push({
          ...baseRow,
          byMaterial: primarios.byMaterial,
          subtotal: primarios.subtotal,
        });
        secundariosRows.push({
          ...baseRow,
          byMaterial: secundarios.byMaterial,
          subtotal: secundarios.subtotal,
        });

        return {
          ...baseRow,
          primSec,
          plast,
          totalCliente,
        };
      });

      result[anio] = {
        consolidadoRows,
        consolidadoTotales,
        primariosRows,
        primariosMateriales: Array.from(primariosMateriales).sort((a, b) => a.localeCompare(b)),
        primariosTotalesByMaterial,
        primariosSubtotalGlobal,
        secundariosRows,
        secundariosMateriales: Array.from(secundariosMateriales).sort((a, b) => a.localeCompare(b)),
        secundariosTotalesByMaterial,
        secundariosSubtotalGlobal,
      };
    });

    return result;
  }, [anios, datosPorAnio]);

  const getPaginatedRows = (rows, key) => {
    const state = getTableState(key);
    const search = String(state.busqueda || "").trim().toLowerCase();
    const filteredRows = search
      ? rows.filter((row) => getSearchText(row).includes(search))
      : rows;
    const totalFiltrados = filteredRows.length;
    const filasPorPagina = Number(state.filasPorPagina || 10);
    const totalPaginas = Math.max(1, Math.ceil(totalFiltrados / filasPorPagina));
    const paginaActual = Math.min(Number(state.paginaActual || 1), totalPaginas);
    const indiceInicio = totalFiltrados === 0 ? 0 : (paginaActual - 1) * filasPorPagina;
    const indiceFin = Math.min(indiceInicio + filasPorPagina, totalFiltrados);
    const rowsPaginadas = filteredRows.slice(indiceInicio, indiceFin);

    return {
      state,
      totalFiltrados,
      totalBase: rows.length,
      totalPaginas,
      paginaActual,
      indiceInicio,
      indiceFin,
      rowsPaginadas,
    };
  };

  const renderPaginationControls = (key, meta) => {
    const { state, totalPaginas, paginaActual, indiceInicio, indiceFin, totalFiltrados, totalBase } = meta;

    return (
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Mostrar:</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={state.filasPorPagina}
              onChange={(e) => updateTableState(key, { filasPorPagina: Number(e.target.value), paginaActual: 1 })}
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
              placeholder="Nombre o NIT"
              value={state.busqueda}
              onChange={(e) => updateTableState(key, { busqueda: e.target.value, paginaActual: 1 })}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          Mostrando {totalFiltrados === 0 ? 0 : indiceInicio + 1} a {indiceFin} de {totalFiltrados} registros
          {state.busqueda && ` (filtrados de ${totalBase} registros totales)`}
        </div>

        {totalPaginas > 1 && (
          <div className="flex justify-between items-center mt-2">
            <button
              className="px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              onClick={() => updateTableState(key, { paginaActual: Math.max(1, paginaActual - 1) })}
              disabled={paginaActual === 1}
            >
              ← Anterior
            </button>

            <div className="flex gap-2 items-center">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => {
                if (num === 1 || num === totalPaginas || (num >= paginaActual - 1 && num <= paginaActual + 1)) {
                  return (
                    <button
                      key={num}
                      className={`px-3 py-1 border rounded text-sm ${
                        paginaActual === num
                          ? "bg-blue-500 text-white border-blue-500"
                          : "border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={() => updateTableState(key, { paginaActual: num })}
                    >
                      {num}
                    </button>
                  );
                }
                if (num === paginaActual - 2 || num === paginaActual + 2) {
                  return (
                    <span key={num} className="px-2">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              className="px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              onClick={() => updateTableState(key, { paginaActual: Math.min(totalPaginas, paginaActual + 1) })}
              disabled={paginaActual === totalPaginas}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderMaterialTable = ({ anio, key, titulo, rows, materiales, totalsByMaterial, subtotalGlobal, subtotalLabel }) => {
    const meta = getPaginatedRows(rows, key);

    return (
      <div className="mb-8">
        <h4 className="text-base font-semibold mb-3">{titulo}</h4>
        {renderPaginationControls(key, meta)}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-100 text-center">
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">Cliente</th>
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">NIT</th>
                {materiales.map((material) => (
                  <th key={`${anio}-${key}-${material}`} className="px-2 py-2 text-xs font-semibold border border-gray-300">
                    {material}
                  </th>
                ))}
                <th className="px-2 py-2 text-xs font-semibold border border-gray-300">{subtotalLabel}</th>
              </tr>
            </thead>
            <tbody>
              {meta.rowsPaginadas.map((row, idx) => (
                <tr key={`${anio}-${key}-${idx}`} className="text-center hover:bg-gray-50">
                  <td className="px-2 py-1 text-xs border border-gray-300 text-left">{row.nombre}</td>
                  <td className="px-2 py-1 text-xs border border-gray-300">{row.nit}</td>
                  {materiales.map((material) => (
                    <td key={`${anio}-${key}-${idx}-${material}`} className="px-2 py-1 text-xs border border-gray-300">
                      {fmt(row.byMaterial[material] || 0)}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-xs border border-gray-300 font-semibold">{fmt(row.subtotal)}</td>
                </tr>
              ))}
              <tr className="bg-yellow-200 font-bold text-center">
                <td className="px-2 py-2 text-xs border border-gray-300">TOTAL</td>
                <td className="px-2 py-2 text-xs border border-gray-300">-</td>
                {materiales.map((material) => (
                  <td key={`${anio}-${key}-total-${material}`} className="px-2 py-2 text-xs border border-gray-300">
                    {fmt(totalsByMaterial[material] || 0)}
                  </td>
                ))}
                <td className="px-2 py-2 text-xs border border-gray-300">{fmt(subtotalGlobal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (anios.length === 0) {
    return <div className="p-4 text-center text-gray-600">No hay datos de consolidado para mostrar.</div>;
  }

  return (
    <div className="space-y-10">
      {anios.map((anio) => {
        const computed = computedByAnio[anio];
        const consolidadoKey = `consolidado-${anio}`;
        const primariosKey = `primarios-${anio}`;
        const secundariosKey = `secundarios-${anio}`;
        const consolidadoMeta = getPaginatedRows(computed.consolidadoRows, consolidadoKey);

        return (
          <div key={anio} className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-center">
              Consolidado Línea Base - Año {anio} (Aprobado y Finalizado)
            </h3>

            {renderPaginationControls(consolidadoKey, consolidadoMeta)}

            <div className="overflow-x-auto mb-6">
              <table className="w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-100">
                    <th rowSpan="2" className="px-2 py-2 text-xs font-semibold border border-gray-300">
                      Cliente
                    </th>
                    <th rowSpan="2" className="px-2 py-2 text-xs font-semibold border border-gray-300">
                      Primario+Secundario
                      <br />
                      (ton)
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
                      Total
                      <br />
                      (ton)
                    </th>
                  </tr>
                  <tr className="bg-blue-100">
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PET Agua</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PET Otros</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PET</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">HDPE</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PVC</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">LDPE</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PP</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">PS</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-green-50">Otros</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">PET</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">HDPE</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">PVC</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">LDPE</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">PP</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">PS</th>
                    <th className="px-2 py-2 text-xs font-semibold border border-gray-300 bg-blue-50">Otros</th>
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
                  {consolidadoMeta.rowsPaginadas.map((fila, idx) => (
                    <tr key={`${anio}-consolidado-${idx}`} className="text-center hover:bg-gray-50">
                      <td className="px-2 py-1 text-xs border border-gray-300 text-left">
                        {fila.nombre}
                        {fila.nit && <span className="text-gray-500"> ({fila.nit})</span>}
                      </td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.primSec)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.petAgua)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.petOtros)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.pet)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.hdpe)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.pvc)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.ldpe)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.pp)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.ps)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.liquidos.otros)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.pet)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.hdpe)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.pvc)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.ldpe)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.pp)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.ps)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.otrosProductos.otros)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.pet)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.hdpe)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.pvc)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.ldpe)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.pp)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.ps)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300">{fmt(fila.plast.construccion.otros)}</td>
                      <td className="px-2 py-1 text-xs border border-gray-300 font-semibold">{fmt(fila.totalCliente)}</td>
                    </tr>
                  ))}
                  <tr className="bg-yellow-200 font-bold text-center">
                    <td className="px-2 py-2 text-xs font-bold border border-gray-300">TOTAL</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.primarioSecundario)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.liquidos.petAgua)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.liquidos.petOtros)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.liquidos.pet)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.liquidos.hdpe)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.liquidos.pvc)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.liquidos.ldpe)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.liquidos.pp)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.liquidos.ps)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.liquidos.otros)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.otrosProductos.pet)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.otrosProductos.hdpe)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.otrosProductos.pvc)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.otrosProductos.ldpe)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.otrosProductos.pp)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.otrosProductos.ps)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.otrosProductos.otros)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.construccion.pet)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.construccion.hdpe)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.construccion.pvc)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.construccion.ldpe)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.construccion.pp)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.construccion.ps)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.construccion.otros)}</td>
                    <td className="px-2 py-2 text-xs border border-gray-300">{fmt(computed.consolidadoTotales.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {renderMaterialTable({
              anio,
              key: primariosKey,
              titulo: "Detalle Primarios",
              rows: computed.primariosRows,
              materiales: computed.primariosMateriales,
              totalsByMaterial: computed.primariosTotalesByMaterial,
              subtotalGlobal: computed.primariosSubtotalGlobal,
              subtotalLabel: "Subtotal Primarios (ton)",
            })}

            {renderMaterialTable({
              anio,
              key: secundariosKey,
              titulo: "Detalle Secundarios",
              rows: computed.secundariosRows,
              materiales: computed.secundariosMateriales,
              totalsByMaterial: computed.secundariosTotalesByMaterial,
              subtotalGlobal: computed.secundariosSubtotalGlobal,
              subtotalLabel: "Subtotal Secundarios (ton)",
            })}
          </div>
        );
      })}
    </div>
  );
}
