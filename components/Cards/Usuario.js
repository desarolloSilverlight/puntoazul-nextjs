import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function Usuario({ idUsuario, onBack }) {
  const [usuario, setUsuario] = useState({
    nombre: "",
    email: "",
    celular: "",
    estado: "",
    perfil: "",
    identificacion: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos del usuario si es edición
  useEffect(() => {
    if (idUsuario) {
      const fetchUsuario = async () => {
        setLoading(true);
        try {
          const response = await fetch(`https://nestbackend.fidare.com/users/${idUsuario}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          // Excluir el campo password de los datos cargados
          const { password, ...rest } = data;
          setUsuario(rest); // Cargar solo los datos necesarios
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchUsuario();
    }
  }, [idUsuario]);

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsuario((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = idUsuario ? "PUT" : "POST";
      const url = idUsuario
        ? `https://nestbackend.fidare.com/users/${idUsuario}`
        : "https://nestbackend.fidare.com/users";

        // Excluir el campo password si está vacío
      const { password, ...rest } = usuario;
      const payload = password ? { ...rest, password } : rest;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert(idUsuario ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
      onBack(); // Volver a la vista de la tabla
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-blueGray-700">
            {idUsuario ? "Editar Usuario" : "Nuevo Usuario"}
          </h3>
          <button
            className="bg-red-500 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
            onClick={onBack}
          >
            Atrás
          </button>
        </div>
      </div>
      <div className="block w-full p-4">
        {loading ? (
          <p className="text-center py-4">Cargando...</p>
        ) : error ? (
          <p className="text-center py-4 text-red-500">Error: {error}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Primera fila */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <input name="nombre" className="border p-2 w-full" type="text" placeholder="Nombre o razón social" value={usuario.nombre} required onChange={handleChange}/>
                <input name="email" className="border p-2 w-full" type="email" placeholder="Correo" value={usuario.email} required onChange={handleChange}/>
            </div>

            {/* Segunda fila */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <input name="celular" className="border p-2 w-full" type="text" placeholder="Celular" value={usuario.celular} onChange={handleChange}/>
              <select name="estado" className="border p-2 w-full" value={usuario.estado} onChange={handleChange}>
                <option value="">Seleccione ...</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              <select name="perfil" className="border p-2 w-full" value={usuario.perfil} onChange={handleChange}
              >
                <option value="">Seleccione ...</option>
                <option value="Administrador">Administrador</option>
                <option value="Empleado">Empleado</option>
                <option value="Asociado">Asociado</option>
              </select>
            </div>

            {/* Tercera fila */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <input name="identificacion" className="border p-2 w-full" type="text" placeholder="Identificacion" value={usuario.identificacion} onChange={handleChange}/>
                <input name="password" className="border p-2 w-full" type="password" placeholder="Contraseña" onChange={handleChange}/>
            </div>
            <button
              type="submit"
              className="bg-lightBlue-600 text-white font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none w-full ease-linear transition-all duration-150"
            >
              {idUsuario ? "Actualizar" : "Crear"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

Usuario.propTypes = {
  idUsuario: PropTypes.number, // ID del usuario para edición
  onBack: PropTypes.func.isRequired, // Función para volver a la vista de la tabla
};