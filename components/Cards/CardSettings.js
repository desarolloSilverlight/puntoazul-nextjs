import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

export default function CardSettings({ color, onNew, onEdit }) {
  const [usuarios, setUsuarios] = useState([]); // Estado para almacenar los usuarios
  const [loading, setLoading] = useState(true); // Estado para manejar el estado de carga
  const [error, setError] = useState(null); // Estado para manejar errores

  // Función para obtener los usuarios desde el backend
  const fetchUsuarios = async () => {
    try {
      const response = await fetch("https://nestbackend.fidare.com/users/getUsers", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Si necesitas enviar cookies
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsuarios(data); // Asignar los usuarios al estado
    } catch (err) {
      setError(err.message); // Manejar errores
    } finally {
      setLoading(false); // Finalizar el estado de carga
    }
  };

  // useEffect para llamar a la función al montar el componente
  useEffect(() => {
    fetchUsuarios();
  }, []);

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
              Usuarios
            </h3>
          </div>
          <button
            className="bg-lightBlue-600 active:bg-lightBlue-400 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
            type="button"
            onClick={onNew} // Cambiar a la vista de "Nuevo Usuario"
          >
            Nuevo
          </button>
        </div>
      </div>
      <div className="block w-full overflow-x-auto">
        {loading ? (
          <p className="text-center py-4">Cargando usuarios...</p>
        ) : error ? (
          <p className="text-center py-4 text-red-500">Error: {error}</p>
        ) : (
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Nombre
                </th>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Identificación
                </th>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Estado
                </th>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Perfil
                </th>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.idUsuario} className="border-t">
                  <td className="p-2">{usuario.nombre}</td>
                  <td className="p-2">{usuario.identificacion}</td>
                  <td className="p-2">{usuario.estado}</td>
                  <td className="p-2">{usuario.perfil}</td>
                  <td className="p-2">
                    <button
                      className="bg-blueGray-700 active:bg-blueGray-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => onEdit(usuario.idUsuario)} // Cambiar a la vista de edición
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

CardSettings.propTypes = {
  color: PropTypes.string,
  onNew: PropTypes.func.isRequired, // Función para manejar "Nuevo"
  onEdit: PropTypes.func.isRequired, // Función para manejar "Editar"
};