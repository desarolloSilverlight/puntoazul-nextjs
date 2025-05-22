import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function Parametro({ idParametro, onBack }) {
  const [parametro, setParametro] = useState({
    nombre: "",
    valor: "",
  });
  const [jsonArray, setJsonArray] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos del parámetro si es edición
  useEffect(() => {
    if (idParametro) {
      const fetchParametro = async () => {
        setLoading(true);
        try {
          const response = await fetch(`https://nestbackend.fidare.com/parametros/${idParametro}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          setParametro({
            nombre: data.nombre,
            valor: data.valor,
          });
          // Si el valor es un array JSON, lo parseamos
          try {
            const arr = JSON.parse(data.valor);
            if (Array.isArray(arr)) setJsonArray(arr);
            else setJsonArray([]);
          } catch {
            setJsonArray([]);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchParametro();
    } else {
      setParametro({ nombre: "", valor: "" });
      setJsonArray([]);
    }
  }, [idParametro]);

  // Manejar cambios en el nombre del parámetro
  const handleNombreChange = (e) => {
    setParametro((prev) => ({ ...prev, nombre: e.target.value }));
  };

  // Agregar fila
  const handleAddRow = () => {
    const emptyRow = {};
    dynamicColumns.forEach(col => emptyRow[col] = "");
    setJsonArray(prev => [...prev, emptyRow]);
  };

  // Eliminar fila
  const handleRemoveRow = (idx) => {
    setJsonArray((prev) => prev.filter((_, i) => i !== idx));
  };

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = idParametro ? "PUT" : "POST";
      const url = idParametro
        ? `https://nestbackend.fidare.com/parametros/${idParametro}`
        : "https://nestbackend.fidare.com/parametros";

      const payload = {
        nombre: parametro.nombre,
        valor: JSON.stringify(jsonArray),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert(idParametro ? "Parámetro actualizado correctamente" : "Parámetro creado correctamente");
      onBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dynamicColumns = React.useMemo(() => {
    if (!jsonArray.length) return [];
    // Obtiene todas las claves únicas de todos los objetos
    const keys = new Set();
    jsonArray.forEach(obj => Object.keys(obj).forEach(k => keys.add(k)));
    return Array.from(keys);
  }, [jsonArray]);

  return (
    <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-blueGray-700">
            {idParametro ? "Editar Parámetro" : "Nuevo Parámetro"}
          </h3>
          <button
            className="bg-red-500 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
            onClick={onBack}
            type="button"
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
            {/* Nombre editable */}
            <div className="mb-4">
              <label className="block font-bold mb-1">Nombre del Parámetro</label>
              <div className="grid grid-cols-2 gap-4 mb-4 justify-items-center">
              <input
                name="nombre"
                className="border p-2 w-full"
                type="text"
                placeholder="Nombre del parámetro"
                value={parametro.nombre}
                required
                onChange={handleNombreChange}
              />
              <button
                  type="button"
                  className="bg-green text-white px-3 py-1 rounded mt-2 max-w-sm"
                  onClick={handleAddRow}
                >
                  + Agregar fila
                </button>
              </div>
            </div>
            {/* Tabla editable para el JSON */}
            <div className="mb-4">
              <label className="block font-bold mb-1">Valores (JSON)</label>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 mb-2">
                  <thead>
                    <tr>
                      {dynamicColumns.map((col) => (
                        <th key={col} className="p-2 border">{col}</th>
                      ))}
                      <th className="p-2 border">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jsonArray.map((item, idx) => (
                      <tr key={idx}>
                        {dynamicColumns.map((col) => (
                          <td className="p-2 border" key={col}>
                            <input
                              className="border p-1 w-full"
                              value={
                                typeof item[col] === "object" && item[col] !== null
                                  ? JSON.stringify(item[col])
                                  : item[col] ?? ""
                              }
                              onChange={(e) => {
                                let value = e.target.value;
                                // Si el campo es un objeto, intenta parsear JSON
                                if (typeof item[col] === "object" && item[col] !== null) {
                                  try {
                                    value = JSON.parse(value);
                                  } catch {
                                    // Si no es JSON válido, lo deja como string
                                  }
                                }
                                setJsonArray(prev =>
                                  prev.map((row, i) =>
                                    i === idx ? { ...row, [col]: value } : row
                                  )
                                );
                              }}
                            />
                          </td>
                        ))}
                        <td className="p-2 border">
                          <button
                            type="button"
                            className="bg-red-500 text-white px-2 rounded"
                            onClick={() => handleRemoveRow(idx)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>                
              </div>
            </div>
            <button
              type="submit"
              className="bg-lightBlue-600 text-white font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none w-full ease-linear transition-all duration-150"
            >
              {idParametro ? "Actualizar" : "Crear"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

Parametro.propTypes = {
  idParametro: PropTypes.number,
  onBack: PropTypes.func.isRequired,
};