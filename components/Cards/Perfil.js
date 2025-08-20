import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../utils/config";

const ACCESOS_DISPONIBLES = [
  "Formulario Linea Base",
  "Formulario Literal B",
  "Enviar Formulario",
  "Validar Linea Base",
  "Validar Literal B",
  "Reportes",
  "Usuarios",
  "Perfiles",
  "Asociados",
  "Vinculados",
  "Parametros",
];

export default function Perfil({ nombre, onBack }) {
  const [seleccionados, setSeleccionados] = useState([]); // Accesos seleccionados para el perfil
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener los accesos seleccionados para el perfil desde el backend
  useEffect(() => {
    console.log("Nombre recibido en Perfil:", nombre); // Verifica el valor de nombre
    const fetchAccesosSeleccionados = async () => {
      try {
        console.log("Fetching accesos seleccionados para el perfil:", nombre); // Verifica el nombre del perfil
        const response = await fetch(`${API_BASE_URL}/users/accesos?idPerfil=${nombre}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
  
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
  
        const data = await response.json();
        console.log("Datos de accesos seleccionados:", data); // Verifica los datos recibidos
  
        // Extraer los valores de "permiso" y actualizar el estado
        const permisosSeleccionados = data.map((item) => item.permiso);
        setSeleccionados(permisosSeleccionados);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAccesosSeleccionados();
  }, [nombre]);

  // Manejar cambios en los accesos seleccionados
  const handleToggle = (acceso) => {
    setSeleccionados((prev) =>
      prev.includes(acceso)
        ? prev.filter((item) => item !== acceso) // Quitar el acceso si ya está seleccionado
        : [...prev, acceso] // Agregar el acceso si no está seleccionado
    );
  };

  // Guardar los accesos seleccionados
  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/accesos?nombre=${nombre}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accesos: seleccionados }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert("Accesos actualizados correctamente");
      onBack(); // Volver a la tabla de perfiles
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-blueGray-700">Editar Accesos</h3>
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
          <p className="text-center py-4">Cargando accesos...</p>
        ) : error ? (
          <p className="text-center py-4 text-red-500">Error: {error}</p>
        ) : (
          <div>
            {ACCESOS_DISPONIBLES.map((acceso) => (
              <div key={acceso} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(acceso)} // Verifica si el acceso está seleccionado
                  onChange={() => handleToggle(acceso)} // Alterna el estado del acceso
                />
                <label className="ml-2">{acceso}</label>
              </div>
            ))}
            <button
              className="bg-lightBlue-600 text-white font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none w-full ease-linear transition-all duration-150"
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

Perfil.propTypes = {
  idPerfil: PropTypes.number.isRequired, // ID del perfil para edición
  onBack: PropTypes.func.isRequired, // Función para volver a la tabla
};