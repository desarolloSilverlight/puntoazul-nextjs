import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../utils/config";
import Informacion from "../Forms/Informacion";
import EmpaquePrimario from "../Forms/EmpaquePrimario";
import EmpaqueSecundario from "../Forms/EmpaqueSecundario";
import EmpaquePlastico from "../Forms/EmpaquePlastico";
import EnvasesRetornables from "../Forms/EnvasesRetornables";
import DistribucionGeografica from "../Forms/DistribucionGeografica";

export default function CardVinculados({ color }) {
  const [vinculados, setVinculados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdUsuario, setSelectedIdUsuario] = useState(null);
  const [activeTab, setActiveTab] = useState("informacion");
  const [idInformacionF, setIdInformacionF] = useState(null);
  const [estadosByUsuario, setEstadosByUsuario] = useState({});
  // Buscador y paginación para la tabla principal
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/users/perfilUser?nombrePerfil=Vinculado`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then(res => res.json())
      .then(data => {
        setVinculados(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Al cargar la lista de vinculados, intentar obtener el estado del formulario (informacion-f) de cada uno
  useEffect(() => {
    const fetchEstados = async () => {
      if (!Array.isArray(vinculados) || vinculados.length === 0) return;
      const resultados = await Promise.all(
        vinculados.map(async (v) => {
          try {
            const resp = await fetch(`${API_BASE_URL}/informacion-f/getByIdUsuario/${v.idUsuario}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            if (resp.status === 404) {
              return { idUsuario: v.idUsuario, estado: null, idInformacionF: null };
            }
            if (!resp.ok) throw new Error(`Error ${resp.status}`);
            const data = await resp.json();
            return {
              idUsuario: v.idUsuario,
              estado: data.estado || null,
              idInformacionF: data.idInformacionF || null,
            };
          } catch (e) {
            console.warn("No se pudo obtener estado para vinculado", v.idUsuario, e);
            return { idUsuario: v.idUsuario, estado: null, idInformacionF: null };
          }
        })
      );
      const map = resultados.reduce((acc, r) => {
        acc[r.idUsuario] = { estado: r.estado, idInformacionF: r.idInformacionF };
        return acc;
      }, {});
      setEstadosByUsuario(map);
    };
    fetchEstados();
  }, [vinculados]);

  useEffect(() => {
    if (selectedIdUsuario) {
      fetch(`${API_BASE_URL}/informacion-f/getByIdUsuario/${selectedIdUsuario}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setIdInformacionF(data?.idInformacionF || null);
        });
    } else {
      setIdInformacionF(null);
    }
  }, [selectedIdUsuario]);

  const EstadoPill = ({ estado }) => {
    if (!estado) {
      return <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">Sin información</span>;
    }
    const styles = {
      Iniciado: "bg-gray-100 text-gray-700",
      Guardado: "bg-gray-100 text-gray-700",
      Pendiente: "bg-yellow-100 text-yellow-800",
      Rechazado: "bg-red-100 text-red-800",
      Aprobado: "bg-green-100 text-green-800",
      Finalizado: "bg-blue-100 text-blue-800",
    };
    const cls = styles[estado] || "bg-gray-100 text-gray-700";
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>{estado}</span>;
  };

  // Buscador y paginación para la tabla principal
  const filteredVinculados = vinculados.filter(v => {
    const term = search.toLowerCase();
    return (
      v.nombre?.toLowerCase().includes(term) ||
      v.nit?.toLowerCase().includes(term) ||
      v.celular?.toLowerCase().includes(term) ||
      v.email?.toLowerCase().includes(term)
    );
  });
  const totalPages = Math.ceil(filteredVinculados.length / pageSize);
  const paginatedVinculados = filteredVinculados.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (selectedIdUsuario) {
    // Detalle del vinculado (sin cambios)
    return (
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
        <div className="flex items-center justify-between px-6 pt-4">
          <h3 className="font-semibold text-lg text-blueGray-700">Detalle Vinculado</h3>
          <button
            className="bg-blueGray-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setSelectedIdUsuario(null);
              setActiveTab("informacion");
            }}
          >
            ← Volver
          </button>
        </div>
        {/* Tabs */}
        <div className="px-6 mt-4">
          <nav className="flex space-x-1 mb-4">
            <button
              onClick={() => setActiveTab("informacion")}
              className={`px-4 py-2 rounded-t-lg font-medium border-b-2 ${
                activeTab === "informacion"
                  ? "bg-blueGray-100 text-blueGray-800 border-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
              }`}
            >
              Información
            </button>
            <button
              onClick={() => setActiveTab("empaque-primario")}
              className={`px-4 py-2 rounded-t-lg font-medium border-b-2 ${
                activeTab === "empaque-primario"
                  ? "bg-blueGray-100 text-blueGray-800 border-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
              }`}
            >
              Empaque Primario
            </button>
            <button
              onClick={() => setActiveTab("empaque-secundario")}
              className={`px-4 py-2 rounded-t-lg font-medium border-b-2 ${
                activeTab === "empaque-secundario"
                  ? "bg-blueGray-100 text-blueGray-800 border-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
              }`}
            >
              Empaque Secundario
            </button>
            <button
              onClick={() => setActiveTab("empaque-plastico")}
              className={`px-4 py-2 rounded-t-lg font-medium border-b-2 ${
                activeTab === "empaque-plastico"
                  ? "bg-blueGray-100 text-blueGray-800 border-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
              }`}
            >
              Empaque Plástico
            </button>
            <button
              onClick={() => setActiveTab("envases-retornables")}
              className={`px-4 py-2 rounded-t-lg font-medium border-b-2 ${
                activeTab === "envases-retornables"
                  ? "bg-blueGray-100 text-blueGray-800 border-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
              }`}
            >
              Envases Retornables
            </button>
            <button
              onClick={() => setActiveTab("distribucion-geografica")}
              className={`px-4 py-2 rounded-t-lg font-medium border-b-2 ${
                activeTab === "distribucion-geografica"
                  ? "bg-blueGray-100 text-blueGray-800 border-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
              }`}
            >
              Distribución Geográfica
            </button>
          </nav>
        </div>
        {/* Contenido */}
        <div className="p-6 pt-0">
          {idInformacionF ? (
            <>
              {activeTab === "informacion" && (
                <Informacion color="light" readonly={true} idInformacionF={idInformacionF} />
              )}
              {activeTab === "empaque-primario" && (
                <EmpaquePrimario color="light" readonly={true} idInformacionF={idInformacionF} />
              )}
              {activeTab === "empaque-secundario" && (
                <EmpaqueSecundario color="light" readonly={true} idInformacionF={idInformacionF} />
              )}
              {activeTab === "empaque-plastico" && (
                <EmpaquePlastico color="light" readonly={true} idInformacionF={idInformacionF} />
              )}
              {activeTab === "envases-retornables" && (
                <EnvasesRetornables color="light" readonly={true} idInformacionF={idInformacionF} />
              )}
              {activeTab === "distribucion-geografica" && (
                <DistribucionGeografica color="light" readonly={true} idInformacionF={idInformacionF} />
              )}
            </>
          ) : (
            <div className="p-4 text-center text-sm text-red-500">Este vinculado aún no ha diligenciado su formulario de línea base.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={
      "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
      (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
    }>
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full px-4 max-w-full flex-grow flex-1">
            <h3 className={
              "font-semibold text-lg " +
              (color === "light" ? "text-blueGray-700" : "text-white")
            }>
              Vinculados
            </h3>
          </div>
        </div>
      </div>
      <div className="block w-full overflow-x-auto">
        {loading ? (
          <div className="p-4 text-center">Cargando...</div>
        ) : (
          <>
            {/* Buscador */}
            <div className="flex flex-wrap gap-2 mb-4 px-4">
              <input
                type="text"
                className="border p-2 rounded w-1/2"
                placeholder="Buscar por nombre, NIT, celular o email"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <table className="items-center w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">Nombre</th>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">NIT</th>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">Celular</th>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">Email</th>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">Estado</th>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(paginatedVinculados) && paginatedVinculados.length > 0 ? (
                  paginatedVinculados.map((vinculado) => (
                    <tr key={vinculado.idUsuario} className="border-t">
                      <td className="p-2">{vinculado.nombre}</td>
                      <td className="p-2">{vinculado.identificacion}</td>
                      <td className="p-2">{vinculado.celular}</td>
                      <td className="p-2">{vinculado.email}</td>
                      <td className="p-2">
                        <EstadoPill estado={(estadosByUsuario[vinculado.idUsuario] || {}).estado} />
                      </td>
                      <td className="p-2">
                        <button
                          className="bg-blueGray-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                          type="button"
                          onClick={() => setSelectedIdUsuario(vinculado.idUsuario)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      No hay vinculados para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Paginación */}
            <div className="flex justify-center items-center gap-2 py-4">
              <button
                className="px-3 py-1 rounded bg-blueGray-200 text-blueGray-700 font-bold disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >Anterior</button>
              <span className="px-2">Página {currentPage} de {totalPages || 1}</span>
              <button
                className="px-3 py-1 rounded bg-blueGray-200 text-blueGray-700 font-bold disabled:opacity-50"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(currentPage + 1)}
              >Siguiente</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
