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

  // Manejar cambios en la tabla JSON
  const handleJsonChange = (idx, key, value) => {
    setJsonArray((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [key]: value } : item
      )
    );
  };

  // Manejar cambios en rango_kg (min o max)
  const handleRangoKgChange = (idx, subKey, value) => {
    setJsonArray((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              rango_kg: {
                ...item.rango_kg,
                [subKey]: value,
              },
            }
          : item
      )
    );
  };

  // Agregar fila
  const handleAddRow = () => {
    setJsonArray((prev) => [
      ...prev,
      { grupo: "", valor_facturar_2024: "", rango_kg: { min: "", max: "" } },
    ]);
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

  // Definir las columnas a mostrar
  const columns = [
    { key: "grupo", label: "Grupo" },
    { key: "valor_facturar_2024", label: "Valor Facturar" },
    { key: "rango_kg.min", label: "Rango KG Mín" },
    { key: "rango_kg.max", label: "Rango KG Máx" },
  ];

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
              <input
                name="nombre"
                className="border p-2 w-full"
                type="text"
                placeholder="Nombre del parámetro"
                value={parametro.nombre}
                required
                onChange={handleNombreChange}
              />
            </div>
            {/* Tabla editable para el JSON */}
            <div className="mb-4">
              <label className="block font-bold mb-1">Valores (JSON)</label>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 mb-2">
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} className="p-2 border">{col.label}</th>
                      ))}
                      <th className="p-2 border">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jsonArray.map((item, idx) => (
                      <tr key={idx}>
                        {/* Grupo */}
                        <td className="p-2 border">
                          <input
                            className="border p-1 w-full"
                            value={item.grupo ?? ""}
                            onChange={(e) =>
                              handleJsonChange(idx, "grupo", e.target.value)
                            }
                          />
                        </td>
                        {/* Valor Facturar */}
                        <td className="p-2 border">
                          <input
                            className="border p-1 w-full"
                            value={item.valor_facturar_2024 ?? ""}
                            onChange={(e) =>
                              handleJsonChange(idx, "valor_facturar_2024", e.target.value)
                            }
                          />
                        </td>
                        {/* Rango KG Min */}
                        <td className="p-2 border">
                          <input
                            className="border p-1 w-full"
                            type="number"
                            value={item.rango_kg?.min ?? ""}
                            onChange={(e) =>
                              handleRangoKgChange(idx, "min", e.target.value)
                            }
                          />
                        </td>
                        {/* Rango KG Max */}
                        <td className="p-2 border">
                          <input
                            className="border p-1 w-full"
                            type="number"
                            value={item.rango_kg?.max ?? ""}
                            onChange={(e) =>
                              handleRangoKgChange(idx, "max", e.target.value)
                            }
                          />
                        </td>
                        {/* Acciones */}
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
                <button
                  type="button"
                  className="bg-green-500 text-white px-3 py-1 rounded"
                  onClick={handleAddRow}
                >
                  + Agregar fila
                </button>
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