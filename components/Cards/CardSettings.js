import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../utils/config";

export default function CardSettings({ color, onNew, onEdit }) {
    // Eliminar usuario
    const handleDelete = async (idUsuario) => {
      if (!window.confirm("¿Está seguro que desea eliminar este usuario? Esta acción no se puede deshacer.")) return;
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/users/${idUsuario}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        });
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        alert(data.message || "Usuario eliminado correctamente");
        // Actualizar la lista de usuarios
        fetchUsuarios();
      } catch (err) {
        alert("Error al eliminar usuario: " + err.message);
      } finally {
        setLoading(false);
      }
    };
  const [usuarios, setUsuarios] = useState([]); // Todos los usuarios
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [perfilFilter, setPerfilFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Función para obtener los usuarios desde el backend
  const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/getUsers`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Filtrar y buscar usuarios
  const filteredUsuarios = usuarios.filter(u => {
    const matchesSearch =
      u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.identificacion?.toLowerCase().includes(search.toLowerCase());
    const matchesPerfil = perfilFilter ? u.perfil === perfilFilter : true;
    return matchesSearch && matchesPerfil;
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsuarios.length / pageSize);
  const paginatedUsuarios = filteredUsuarios.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Mapeo de perfil a texto legible
  const perfilLabels = {
    Administrador: "Superadministrador",
    AdministradorB: "Administrador Literal B",
    AdministradorF: "Administrador Linea Base",
    ValidadorB: "Validador Literal B",
    ValidadorF: "Validador Linea Base",
    Asociado: "Asociado",
    Vinculado: "Vinculado"
  };

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
          <>
            {/* Buscador y filtro */}
            <div className="flex flex-wrap gap-2 mb-4 px-4">
              <input
                type="text"
                className="border p-2 rounded w-1/2"
                placeholder="Buscar por nombre, correo o identificación"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
              <select
                className="border p-2 rounded w-1/4"
                value={perfilFilter}
                onChange={e => { setPerfilFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Todos los perfiles</option>
                <option value="Administrador">Superadministrador</option>
                <option value="AdministradorB">Administrador Literal B</option>
                <option value="AdministradorF">Administrador Linea Base</option>
                <option value="ValidadorB">Validador Literal B</option>
                <option value="ValidadorF">Validador Linea Base</option>
                <option value="Asociado">Asociado</option>
                <option value="Vinculado">Vinculado</option>
              </select>
            </div>
            <table className="items-center w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">Nombre</th>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">Identificación</th>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">Correo</th>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">Perfil</th>
                  <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsuarios.map((usuario) => (
                  <tr key={usuario.idUsuario} className="border-t">
                    <td className="p-2">{usuario.nombre}</td>
                    <td className="p-2">{usuario.identificacion}</td>
                    <td className="p-2">{usuario.email}</td>
                    <td className="p-2">{perfilLabels[usuario.perfil] || usuario.perfil}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        className="bg-blueGray-700 active:bg-blueGray-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                        type="button"
                        onClick={() => onEdit(usuario.idUsuario)}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-red-600 active:bg-red-700 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
                        type="button"
                        onClick={() => handleDelete(usuario.idUsuario)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
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

CardSettings.propTypes = {
  color: PropTypes.string,
  onNew: PropTypes.func.isRequired, // Función para manejar "Nuevo"
  onEdit: PropTypes.func.isRequired, // Función para manejar "Editar"
};