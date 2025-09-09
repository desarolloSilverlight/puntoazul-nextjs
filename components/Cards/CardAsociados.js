import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../utils/config";
// Formularios
import InformacionB from "../Forms/InformacionB";
import ProductosB from "../Forms/ProductosB";

export default function CardAsociados({ color }) {
  const [asociados, setAsociados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdUsuario, setSelectedIdUsuario] = useState(null);
  const [activeTab, setActiveTab] = useState("informacion"); // Tabs: informacion | productos
  const [infoLoading, setInfoLoading] = useState(false);
  const [selectedInfoB, setSelectedInfoB] = useState(null); // Datos de informacion-b del asociado
  const [infoError, setInfoError] = useState(null);
  const [estadosByUsuario, setEstadosByUsuario] = useState({}); // { [idUsuario]: { estado, idInformacionB } }

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/users/perfilUser?nombrePerfil=Asociado`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      .then(res => res.json())
      .then(data => {
        console.log("Asociados:", data);
        setAsociados(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Al cargar la lista de asociados, intentar obtener el estado del formulario (informacion-b) de cada uno
  useEffect(() => {
    const fetchEstados = async () => {
      if (!Array.isArray(asociados) || asociados.length === 0) return;
      const resultados = await Promise.all(
        asociados.map(async (a) => {
          try {
            const resp = await fetch(`${API_BASE_URL}/informacion-b/getByIdUsuario/${a.idUsuario}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            if (resp.status === 404) {
              return { idUsuario: a.idUsuario, estado: null, idInformacionB: null };
            }
            if (!resp.ok) throw new Error(`Error ${resp.status}`);
            const data = await resp.json();
            return {
              idUsuario: a.idUsuario,
              estado: data.estado || null,
              idInformacionB: data.idInformacionB || null,
            };
          } catch (e) {
            console.warn("No se pudo obtener estado para usuario", a.idUsuario, e);
            return { idUsuario: a.idUsuario, estado: null, idInformacionB: null };
          }
        })
      );
      const map = resultados.reduce((acc, r) => {
        acc[r.idUsuario] = { estado: r.estado, idInformacionB: r.idInformacionB };
        return acc;
      }, {});
      setEstadosByUsuario(map);
    };
    fetchEstados();
  }, [asociados]);

  const handleVerAsociado = async (idUsuario) => {
    setSelectedIdUsuario(idUsuario);
    setActiveTab("informacion");
    setInfoLoading(true);
    setInfoError(null);
    setSelectedInfoB(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/informacion-b/getByIdUsuario/${idUsuario}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (resp.status === 404) {
        setInfoError("Este asociado aún no ha diligenciado su información.");
      } else if (!resp.ok) {
        throw new Error(`Error ${resp.status}`);
      } else {
        const data = await resp.json();
        setSelectedInfoB(data);
        // Actualizar el mapa de estados con la información recién obtenida
        setEstadosByUsuario(prev => ({
          ...prev,
          [idUsuario]: { estado: data.estado || null, idInformacionB: data.idInformacionB || null }
        }));
      }
    } catch (e) {
      setInfoError("No se pudo cargar la información del asociado.");
    } finally {
      setInfoLoading(false);
    }
  };

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

  // Vista detalle con tabs (sin resumen)
  if (selectedIdUsuario) {
    return (
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
        <div className="flex items-center justify-between px-6 pt-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg text-blueGray-700">Detalle Asociado</h3>
            {/* Mostrar estado si está disponible */}
            <div>
              {infoLoading ? (
                <span className="text-sm text-blueGray-500">Cargando estado...</span>
              ) : infoError ? (
                <EstadoPill estado={null} />
              ) : selectedInfoB ? (
                <EstadoPill estado={selectedInfoB.estado} />
              ) : null}
            </div>
          </div>
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
              Información Empresa
            </button>
            <button
              onClick={() => setActiveTab("productos")}
              className={`px-4 py-2 rounded-t-lg font-medium border-b-2 ${
                activeTab === "productos"
                  ? "bg-blueGray-100 text-blueGray-800 border-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
              }`}
            >
              Productos
            </button>
          </nav>
        </div>
        {/* Contenido */}
        <div className="p-6 pt-0">
          {activeTab === "informacion" && (
            infoLoading ? (
              <div className="p-4 text-center">Cargando información...</div>
            ) : infoError ? (
              <div className="p-4 text-center text-red-500 text-sm">{infoError}</div>
            ) : selectedInfoB ? (
              <InformacionB
                color="light"
                readonly={true}
                idInformacionB={selectedInfoB.idInformacionB}
              />
            ) : (
              <div className="p-4 text-center text-sm">Sin datos para mostrar.</div>
            )
          )}
          {activeTab === "productos" && (
            selectedInfoB ? (
              <ProductosB
                color="light"
                readonly={true}
                idInformacionB={selectedInfoB.idInformacionB}
              />
            ) : infoLoading ? (
              <div className="p-4 text-center">Cargando productos...</div>
            ) : (
              <div className="p-4 text-center text-sm">Primero debe existir la Información del asociado.</div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full px-4 max-w-full flex-grow flex-1">
            <h3
              className={
                "font-semibold text-lg " +
                (color === "light" ? "text-blueGray-700" : "text-white")
              }
            >
              Asociados
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
                  Estado
                </th>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(asociados) && asociados.length > 0 ? (
                asociados.map((asociado) => (
                  <tr key={asociado.idUsuario} className="border-t">
                    <td className="p-2">{asociado.nombre}</td>
                    <td className="p-2">{asociado.nit}</td>
                    <td className="p-2">{asociado.celular}</td>
          <td className="p-2">{asociado.email}</td>
                    <td className="p-2">
                      <EstadoPill estado={(estadosByUsuario[asociado.idUsuario] || {}).estado} />
                    </td>
                    <td className="p-2">
                      <button
                        className="bg-blueGray-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                        type="button"
            onClick={() => handleVerAsociado(asociado.idUsuario)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No hay asociados para mostrar.
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

CardAsociados.propTypes = {
  color: PropTypes.string,
};