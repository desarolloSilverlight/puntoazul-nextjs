import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../utils/config";

export default function CardLimpiarFormularios() {
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    cargarFormularios();
  }, []);

  const cargarFormularios = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/informacion-f/vinculadosConFormularios`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then(res => res.json())
      .then(response => {
        if (response.success && response.data) {
          setFormularios(response.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar formularios:", err);
        setLoading(false);
      });
  };

  const handleCheckboxChange = (idInformacionF, estado) => {
    // Solo permitir seleccionar formularios finalizados
    if (estado !== "Finalizado") return;

    if (selectedIds.includes(idInformacionF)) {
      setSelectedIds(selectedIds.filter(id => id !== idInformacionF));
    } else {
      setSelectedIds([...selectedIds, idInformacionF]);
    }
  };

  const handleSelectAll = () => {
    const finalizados = filteredFormularios.filter(f => f.estado === "Finalizado");
    if (selectedIds.length === finalizados.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(finalizados.map(f => f.idInformacionF));
    }
  };

  const handleLimpiar = async () => {
    if (selectedIds.length === 0) {
      alert("⚠️ Debe seleccionar al menos un formulario para limpiar");
      return;
    }

    const confirmacion = window.confirm(
      `⚠️ ¿Está seguro de que desea limpiar ${selectedIds.length} formulario(s)?\n\n` +
      `Esta acción eliminará los formularios de las tablas operativas.\n` +
      `Los datos quedarán respaldados en el historial.\n\n` +
      `Esta operación NO se puede deshacer.`
    );

    if (!confirmacion) return;

    setProcesando(true);

    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/limpiarFormularios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idsInformacionF: selectedIds }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `✅ ${data.message}\n\n` +
          `Eliminados: ${data.resultados.eliminados}\n` +
          `No finalizados: ${data.resultados.noFinalizados.length}\n` +
          `Sin respaldo: ${data.resultados.sinRespaldo.length}\n` +
          `Errores: ${data.resultados.errores.length}`
        );

        // Recargar la lista
        setSelectedIds([]);
        cargarFormularios();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error al limpiar formularios:", error);
      alert("❌ Error al limpiar formularios");
    } finally {
      setProcesando(false);
    }
  };

  // Filtrado y paginación
  const filteredFormularios = formularios.filter(f => {
    const term = search.toLowerCase();
    return (
      f.nombre?.toLowerCase().includes(term) ||
      f.nit?.toLowerCase().includes(term) ||
      f.estado?.toLowerCase().includes(term) ||
      f.anioReportado?.toString().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredFormularios.length / pageSize);
  const paginatedFormularios = filteredFormularios.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const finalizadosCount = filteredFormularios.filter(f => f.estado === "Finalizado").length;

  return (
    <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
      {/* Header */}
      <div className="rounded-t mb-0 px-6 py-4 border-0">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full max-w-full flex-grow flex-1">
            <h3 className="font-semibold text-lg text-blueGray-700">
              Renovar Formularios Finalizados
            </h3>
            <p className="text-sm text-blueGray-500 mt-1">
              Seleccione los formularios finalizados que desea renovar de las tablas operativas.
              Los datos quedarán respaldados en el historial.
            </p>
          </div>
        </div>
      </div>

      {/* Stats y Acciones */}
      <div className="px-6 py-4 border-t border-blueGray-200 bg-blueGray-50">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="font-semibold text-blueGray-700">Total formularios:</span>{" "}
              <span className="text-blueGray-600">{filteredFormularios.length}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-green-600">Finalizados:</span>{" "}
              <span className="text-green-700">{finalizadosCount}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-blue-600">Seleccionados:</span>{" "}
              <span className="text-blue-700">{selectedIds.length}</span>
            </div>
          </div>
          <div>
            <button
              onClick={handleLimpiar}
              disabled={selectedIds.length === 0 || procesando}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                selectedIds.length === 0 || procesando
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {procesando ? "Procesando..." : `Renovar Seleccionados (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="px-6 py-3 border-t border-blueGray-200">
        <input
          type="text"
          placeholder="🔍 Buscar por empresa, NIT, estado o año..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-blueGray-300 rounded focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="block w-full overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-blueGray-500">Cargando formularios...</p>
          </div>
        ) : paginatedFormularios.length === 0 ? (
          <div className="text-center py-8 text-blueGray-500">
            No se encontraron formularios
          </div>
        ) : (
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === finalizadosCount
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Empresa
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  NIT
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Año
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Estado
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Fecha Dilig.
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedFormularios.map((form, index) => {
                const isFinalizado = form.estado === "Finalizado";
                const isSelected = selectedIds.includes(form.idInformacionF);

                return (
                  <tr
                    key={form.idInformacionF}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-blueGray-50"
                    } ${!isFinalizado ? "opacity-50" : ""} ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          handleCheckboxChange(form.idInformacionF, form.estado)
                        }
                        disabled={!isFinalizado}
                        className={`w-4 h-4 ${
                          isFinalizado ? "cursor-pointer" : "cursor-not-allowed"
                        }`}
                        title={
                          isFinalizado
                            ? "Seleccionar para limpiar"
                            : "Solo se pueden limpiar formularios finalizados"
                        }
                      />
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <span className="font-medium text-blueGray-700">
                        {form.nombre}
                      </span>
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-blueGray-600">
                      {form.nit}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-blueGray-600">
                      {form.anioReportado}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          form.estado === "Finalizado"
                            ? "bg-green-100 text-green-700"
                            : form.estado === "Aprobado"
                            ? "bg-blue-100 text-blue-700"
                            : form.estado === "Pendiente"
                            ? "bg-yellow-100 text-yellow-700"
                            : form.estado === "Rechazado"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {form.estado}
                      </span>
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-blueGray-600">
                      {form.fechaDiligenciamiento
                        ? new Date(form.fechaDiligenciamiento).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-blueGray-200 flex items-center justify-between">
          <div className="text-sm text-blueGray-600">
            Página {currentPage} de {totalPages} ({filteredFormularios.length} registros)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-blueGray-200 text-blueGray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blueGray-300"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-blueGray-200 text-blueGray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blueGray-300"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
