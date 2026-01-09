import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/config";

export default function CardRenovarFormulariosB() {
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const formulariosPorPagina = 10;

  // Cargar formularios finalizados
  const cargarFormularios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-b/finalizados`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron cargar los formularios`);
      }
      
      const data = await response.json();
      setFormularios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando formularios:', error);
      alert('Error al cargar formularios: ' + error.message);
      setFormularios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFormularios();
  }, []);

  // Manejar selección individual
  const handleSeleccion = (idInformacionB, checked) => {
    if (checked) {
      setSeleccionados([...seleccionados, idInformacionB]);
    } else {
      setSeleccionados(seleccionados.filter(id => id !== idInformacionB));
    }
  };

  // Seleccionar/deseleccionar todos (solo finalizados en página actual)
  const handleSeleccionarTodos = (checked) => {
    if (checked) {
      const idsFinalizados = formulariosFiltrados
        .slice((paginaActual - 1) * formulariosPorPagina, paginaActual * formulariosPorPagina)
        .filter(f => f.estado === 'Finalizado')
        .map(f => f.idInformacionB);
      setSeleccionados([...new Set([...seleccionados, ...idsFinalizados])]);
    } else {
      const idsEnPagina = formulariosFiltrados
        .slice((paginaActual - 1) * formulariosPorPagina, paginaActual * formulariosPorPagina)
        .map(f => f.idInformacionB);
      setSeleccionados(seleccionados.filter(id => !idsEnPagina.includes(id)));
    }
  };

  // Renovar formularios seleccionados
  const handleRenovar = async () => {
    if (seleccionados.length === 0) {
      alert('Por favor seleccione al menos un formulario para renovar');
      return;
    }

    const confirmacion = window.confirm(
      `¿Está seguro de renovar ${seleccionados.length} formulario(s)?\n\n` +
      `Esta acción creará una copia en el historial y limpiará los datos del formulario original para que pueda ser diligenciado nuevamente.`
    );

    if (!confirmacion) return;

    console.log('🔄 Renovando formularios:', seleccionados);

    try {
      const requestData = { idsInformacionB: seleccionados };
      console.log('📤 Request data:', requestData);

      const response = await fetch(`${API_BASE_URL}/informacion-b/renovar-formularios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Success response:', result);

      alert(`Formularios renovados exitosamente. Se crearon copias en el historial y los formularios están listos para ser diligenciados nuevamente.`);
      
      setSeleccionados([]);
      cargarFormularios();
    } catch (error) {
      console.error('❌ Error completo:', error);
      alert('Error al renovar formularios: ' + error.message);
    }
  };

  // Filtrar formularios por búsqueda
  const formulariosFiltrados = formularios.filter(f => {
    const termino = busqueda.toLowerCase();
    return (
      f.nombre?.toLowerCase().includes(termino) ||
      f.nit?.toLowerCase().includes(termino) ||
      f.ano_reportado?.toString().includes(termino)
    );
  });

  // Paginación
  const totalPaginas = Math.ceil(formulariosFiltrados.length / formulariosPorPagina);
  const formulariosPaginados = formulariosFiltrados.slice(
    (paginaActual - 1) * formulariosPorPagina,
    paginaActual * formulariosPorPagina
  );

  // Verificar si todos los de la página están seleccionados
  const todosSeleccionados = formulariosPaginados
    .filter(f => f.estado === 'Finalizado')
    .every(f => seleccionados.includes(f.idInformacionB)) &&
    formulariosPaginados.filter(f => f.estado === 'Finalizado').length > 0;

  return (
    <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
      {/* Header */}
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full max-w-full flex-grow flex-1">
            <h3 className="font-semibold text-lg text-blueGray-700">
              Renovar Formularios Literal B
            </h3>
            <p className="text-sm text-blueGray-500 mt-1">
              Seleccione los formularios finalizados que desea renovar. Se creará una copia en el historial y el formulario quedará listo para ser diligenciado nuevamente.
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
              <span className="text-blueGray-600">{formulariosFiltrados.length}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-green-600">Finalizados:</span>{" "}
              <span className="text-green-700">{formulariosFiltrados.filter(f => f.estado === 'Finalizado').length}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-blue-600">Seleccionados:</span>{" "}
              <span className="text-blue-700">{seleccionados.length}</span>
            </div>
          </div>
          <div>
            <button
              onClick={handleRenovar}
              disabled={seleccionados.length === 0}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                seleccionados.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              🔄 Renovar Seleccionados ({seleccionados.length})
            </button>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="px-6 py-3 border-t border-blueGray-200">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, NIT o año..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPaginaActual(1);
          }}
          className="w-full px-4 py-2 border border-blueGray-300 rounded focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="block w-full overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-blueGray-500">Cargando formularios...</p>
          </div>
        ) : (
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={(e) => handleSeleccionarTodos(e.target.checked)}
                    disabled={formulariosPaginados.filter(f => f.estado === 'Finalizado').length === 0}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Asociado
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
              </tr>
            </thead>
            <tbody>
              {formulariosPaginados.length > 0 ? (
                formulariosPaginados.map((formulario) => {
                  const isFinalized = formulario.estado === 'Finalizado';
                  return (
                    <tr key={formulario.idInformacionB} className={!isFinalized ? 'opacity-50' : ''}>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        <input
                          type="checkbox"
                          checked={seleccionados.includes(formulario.idInformacionB)}
                          onChange={(e) => handleSeleccion(formulario.idInformacionB, e.target.checked)}
                          disabled={!isFinalized}
                          className="cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {formulario.nombre || 'N/A'}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {formulario.nit || 'N/A'}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        {formulario.ano_reportado || 'N/A'}
                      </td>
                      <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          formulario.estado === 'Finalizado' ? 'bg-blue-100 text-blue-800' :
                          formulario.estado === 'Aprobado' ? 'bg-green-100 text-green-800' :
                          formulario.estado === 'Rechazado' ? 'bg-red-100 text-red-800' :
                          formulario.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {formulario.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-blueGray-500">
                    {busqueda ? 'No se encontraron formularios con ese criterio' : 'No hay formularios finalizados para renovar'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="px-4 py-3 border-t border-blueGray-200 flex items-center justify-between">
          <div className="text-sm text-blueGray-500">
            Mostrando {((paginaActual - 1) * formulariosPorPagina) + 1} - {Math.min(paginaActual * formulariosPorPagina, formulariosFiltrados.length)} de {formulariosFiltrados.length} formularios
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
