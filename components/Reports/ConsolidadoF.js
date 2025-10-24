import React from "react";

// Muestra dos tablas: Resumen Base global y Resumen Plásticos global
export default function ConsolidadoF({ resumenBase, resumenPlasticos }) {
  // resumenBase: { primarios: {papel, metalFerroso, metalNoFerroso, carton, vidrio, total},
  //                secundarios: {...}, total: {...} }
  // resumenPlasticos: { liquidos: { petAgua, petOtros, pet, hdpe, pvc, ldpe, pp, ps, otros, total },
  //                     otros: { pet, hdpe, pvc, ldpe, pp, ps, otros, total },
  //                     construccion: { pet, hdpe, pvc, ldpe, pp, ps, otros, total },
  //                     totales: { totalLiquidos, totalOtros, totalConstruccion, totalGeneral } }

  if (!resumenBase && !resumenPlasticos) {
    return <div className="p-4 text-center text-gray-600">No hay datos de consolidado para mostrar.</div>;
  }

  const fmt5 = (n) => (Number(n || 0)).toFixed(5);

  return (
    <div className="space-y-8">
      {resumenBase && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-center">Consolidado Línea Base - Resumen Base (Todos los finalizados)</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-separate border-spacing-1 border border-gray-300">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Resumen</th>
                  <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Papel</th>
                  <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Metal Ferroso</th>
                  <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Metal No Ferroso</th>
                  <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Cartón</th>
                  <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Vidrio</th>
                  <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Total</th>
                </tr>
                <tr className="bg-yellow-50">
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300"></th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const prim = resumenBase.primarios || {};
                  const sec = resumenBase.secundarios || {};
                  const tot = resumenBase.total || {};
                  const totalPorMaterial = {
                    papel: (prim.papel || 0) + (sec.papel || 0),
                    metalFerroso: (prim.metalFerroso || 0) + (sec.metalFerroso || 0),
                    metalNoFerroso: (prim.metalNoFerroso || 0) + (sec.metalNoFerroso || 0),
                    carton: (prim.carton || 0) + (sec.carton || 0),
                    vidrio: (prim.vidrio || 0) + (sec.vidrio || 0),
                  };
                  const totalGeneral = (tot.total || 0);
                  const pct = (num, den) => den > 0 ? ((num / den) * 100).toFixed(2) : '0.00';
                  return (
                    <>
                      <tr className="text-center bg-blue-50">
                        <td className="px-2 py-1 text-xs font-semibold border border-gray-300">Primarios</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(prim.papel)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(prim.papel || 0, totalPorMaterial.papel || 0)}%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(prim.metalFerroso)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(prim.metalFerroso || 0, totalPorMaterial.metalFerroso || 0)}%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(prim.metalNoFerroso)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(prim.metalNoFerroso || 0, totalPorMaterial.metalNoFerroso || 0)}%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(prim.carton)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(prim.carton || 0, totalPorMaterial.carton || 0)}%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(prim.vidrio)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(prim.vidrio || 0, totalPorMaterial.vidrio || 0)}%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(prim.total)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(prim.total || 0, totalGeneral || 0)}%</td>
                      </tr>
                      <tr className="text-center bg-green-50">
                        <td className="px-2 py-1 text-xs font-semibold border border-gray-300">Secundarios</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(sec.papel)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(sec.papel || 0, totalPorMaterial.papel || 0)}%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(sec.metalFerroso)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(sec.metalFerroso || 0, totalPorMaterial.metalFerroso || 0)}%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(sec.metalNoFerroso)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(sec.metalNoFerroso || 0, totalPorMaterial.metalNoFerroso || 0)}%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(sec.carton)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(sec.carton || 0, totalPorMaterial.carton || 0)}%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(sec.vidrio)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(sec.vidrio || 0, totalPorMaterial.vidrio || 0)}%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(sec.total)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{pct(sec.total || 0, totalGeneral || 0)}%</td>
                      </tr>
                      <tr className="text-center bg-yellow-200 font-bold">
                        <td className="px-2 py-1 text-xs font-bold border border-gray-300">Total</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(totalPorMaterial.papel)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(totalPorMaterial.metalFerroso)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(totalPorMaterial.metalNoFerroso)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(totalPorMaterial.carton)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(totalPorMaterial.vidrio)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">{fmt5(totalGeneral)}</td>
                        <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resumenPlasticos && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-center">Consolidado Línea Base - Resumen Plásticos (Todos los finalizados)</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-separate border-spacing-1 border border-gray-300">
              <thead>
                <tr className="bg-indigo-100">
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Categoría</th>
                  <th colSpan={9} className="px-2 py-1 text-xs font-semibold border border-gray-300">Líquidos (ton)</th>
                  <th colSpan={7} className="px-2 py-1 text-xs font-semibold border border-gray-300">Otros (ton)</th>
                  <th colSpan={7} className="px-2 py-1 text-xs font-semibold border border-gray-300">Construcción (ton)</th>
                  <th colSpan={4} className="px-2 py-1 text-xs font-semibold border border-gray-300">Totales (ton)</th>
                </tr>
                <tr className="bg-indigo-50">
                  <th className="px-2 py-1 text-xs font-semibold border border-gray-300"></th>
                  {/* Líquidos */}
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET Agua</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET Otros</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">HDPE</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PVC</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">LDPE</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PP</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PS</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Otros</th>
                  {/* Otros */}
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">HDPE</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PVC</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">LDPE</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PP</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PS</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Otros</th>
                  {/* Construcción */}
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">HDPE</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PVC</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">LDPE</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PP</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PS</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Otros</th>
                  {/* Totales */}
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Total Líquidos</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Total Otros</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Total Construcción</th>
                  <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Total General</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const L = resumenPlasticos.liquidos || {};
                  const O = resumenPlasticos.otros || {};
                  const C = resumenPlasticos.construccion || {};
                  const T = resumenPlasticos.totales || {};
                  return (
                    <tr className="text-center bg-gray-100 font-bold">
                      <td className="px-2 py-1 text-xs font-bold border border-gray-300">TOTAL</td>
                      {/* Líquidos */}
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(L.petAgua)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(L.petOtros)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(L.pet)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(L.hdpe)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(L.pvc)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(L.ldpe)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(L.pp)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(L.ps)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(L.otros)}</td>
                      {/* Otros */}
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(O.pet)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(O.hdpe)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(O.pvc)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(O.ldpe)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(O.pp)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(O.ps)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(O.otros)}</td>
                      {/* Construcción */}
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(C.pet)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(C.hdpe)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(C.pvc)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(C.ldpe)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(C.pp)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(C.ps)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300">{fmt5(C.otros)}</td>
                      {/* Totales */}
                      <td className="px-1 py-1 text-xs border border-gray-300 bg-blue-200 font-bold">{fmt5(T.totalLiquidos)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300 bg-green-200 font-bold">{fmt5(T.totalOtros)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300 bg-orange-200 font-bold">{fmt5(T.totalConstruccion)}</td>
                      <td className="px-1 py-1 text-xs border border-gray-300 bg-red-300 font-bold">{fmt5(T.totalGeneral)}</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
