import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
// Importa tus formularios
import InformacionB from "../Forms/InformacionB";
import ProductosB from "../Forms/ProductosB";

export default function CardAsociados({ color }) {
  const [asociados, setAsociados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdUsuario, setSelectedIdUsuario] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("https://nestbackend.fidare.com/users/perfilUser?nombrePerfil=Asociado", {
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

  if (selectedIdUsuario) {
    return (
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded p-6 ">
        <button
          className="mb-4 bg-blueGray-600 text-white px-4 py-2 rounded"
          onClick={() => setSelectedIdUsuario(null)}
        >
          Volver a la lista
        </button>
        <InformacionB color="light" idUsuario={selectedIdUsuario} />
        <ProductosB color="light" idUsuario={selectedIdUsuario} />
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
                      <button
                        className="bg-blueGray-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                        type="button"
                        onClick={() => setSelectedIdUsuario(asociado.idUsuario)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
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