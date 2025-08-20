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

  if (selectedIdUsuario) {
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
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Nombre
                </th>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  NIT
                </th>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Celular
                </th>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Email
                </th>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(vinculados) && vinculados.length > 0 ? (
                vinculados.map((vinculado) => (
                  <tr key={vinculado.idUsuario} className="border-t">
                    <td className="p-2">{vinculado.nombre}</td>
                    <td className="p-2">{vinculado.nit}</td>
                    <td className="p-2">{vinculado.celular}</td>
                    <td className="p-2">{vinculado.email}</td>
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
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No hay vinculados para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
