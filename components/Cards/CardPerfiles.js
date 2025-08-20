import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../utils/config";

export default function CardPerfiles({ color, onEdit }) {
  const [perfiles, setPerfiles] = useState([]); // Estado para almacenar los perfiles
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error

  // Función para obtener los datos del backend
  const fetchPerfiles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/countByProfile`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Si necesitas enviar cookies
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log( data); // Ver datos en consola
      const perfilesArray = Object.entries(data).map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
      }));
      // Verifica si la respuesta es un array
      if (Array.isArray(perfilesArray)) {
        setPerfiles(perfilesArray); // Asignar los datos al estado
      } else {
        throw new Error("La respuesta del backend no es un array");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Llamar a la función al montar el componente
  useEffect(() => {
    fetchPerfiles();
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
              Tabla de Perfiles
            </h3>
          </div>
        </div>
      </div>
      <div className="block w-full overflow-x-auto">
        {loading ? (
          <p className="text-center py-4">Cargando perfiles...</p>
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
                  Cantidad
                </th>
                <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(perfiles) && perfiles.map((perfil) => (
                <tr key={perfil.nombre} className="border-t">
                  <td className="p-2">{perfil.nombre}</td>
                  <td className="p-2">{perfil.cantidad}</td>
                  <td className="p-2">
                    <button
                      className="bg-blueGray-700 active:bg-blueGray-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => {
                        console.log("Perfil seleccionado:", perfil.nombre); // Verifica el valor de perfil.nombre
                        onEdit(perfil.nombre);
                      }}
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

CardPerfiles.propTypes = {
  color: PropTypes.string,
  onEdit: PropTypes.func.isRequired, // Función para manejar la edición
};