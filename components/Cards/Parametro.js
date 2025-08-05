import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function Parametro({ idParametro, onBack }) {
  const [parametro, setParametro] = useState({
    nombre: "",
    valor: "",
  });
  
  // Estados para configuración de tabla dinámica
  const [columns, setColumns] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [isDefiningTable, setIsDefiningTable] = useState(false);
  const [numColumns, setNumColumns] = useState(2);
  const [columnNames, setColumnNames] = useState([]);
  
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
          
          // Intentar parsear el valor como JSON
          try {
            const parsedData = JSON.parse(data.valor);
            if (parsedData && parsedData.columns && parsedData.data) {
              setColumns(parsedData.columns);
              setTableData(parsedData.data);
              setColumnNames(parsedData.columns.map(col => col.name));
              setNumColumns(parsedData.columns.length);
            } else if (Array.isArray(parsedData)) {
              // Compatibilidad con formato anterior
              setTableData(parsedData);
              if (parsedData.length > 0) {
                const keys = Object.keys(parsedData[0]);
                const cols = keys.map(key => ({ name: key, type: 'text' }));
                setColumns(cols);
                setColumnNames(keys);
                setNumColumns(keys.length);
              }
            }
          } catch {
            // Si no es JSON válido, inicializar tabla vacía
            setColumns([]);
            setTableData([]);
            setColumnNames([]);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchParametro();
    } else {
      // Modo creación - mostrar configuración de tabla
      setParametro({ nombre: "", valor: "" });
      setColumns([]);
      setTableData([]);
      setColumnNames(['', '']);
      setIsDefiningTable(true);
    }
  }, [idParametro]);

  // Manejar cambios en el nombre del parámetro
  const handleNombreChange = (e) => {
    setParametro((prev) => ({ ...prev, nombre: e.target.value }));
  };

  // Manejar cambio en número de columnas
  const handleNumColumnsChange = (e) => {
    const num = parseInt(e.target.value);
    setNumColumns(num);
    const newColumnNames = Array(num).fill('').map((_, i) => columnNames[i] || '');
    setColumnNames(newColumnNames);
  };

  // Manejar cambio en nombres de columnas
  const handleColumnNameChange = (index, value) => {
    const newColumnNames = [...columnNames];
    newColumnNames[index] = value;
    setColumnNames(newColumnNames);
  };

  // Crear tabla con las columnas definidas
  const handleCreateTable = () => {
    if (columnNames.some(name => !name.trim())) {
      alert('Por favor, define nombres para todas las columnas');
      return;
    }

    const newColumns = columnNames.map(name => ({
      name: name.trim(),
      type: 'text'
    }));

    setColumns(newColumns);
    setTableData([]);
    setIsDefiningTable(false);
  };

  // Agregar fila a la tabla
  const handleAddRow = () => {
    const emptyRow = {};
    columns.forEach(col => emptyRow[col.name] = "");
    setTableData(prev => [...prev, emptyRow]);
  };

  // Eliminar fila
  const handleRemoveRow = (idx) => {
    setTableData((prev) => prev.filter((_, i) => i !== idx));
  };

  // Manejar cambio en celda de tabla
  const handleCellChange = (rowIndex, columnName, value) => {
    setTableData(prev =>
      prev.map((row, i) =>
        i === rowIndex ? { ...row, [columnName]: value } : row
      )
    );
  };

  // Reconfigurar tabla (volver a definir columnas)
  const handleReconfigureTable = () => {
    setIsDefiningTable(true);
    setTableData([]);
  };

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!parametro.nombre.trim()) {
      alert('Por favor, ingresa un nombre para el parámetro');
      return;
    }

    if (columns.length === 0) {
      alert('Por favor, define las columnas de la tabla');
      return;
    }

    setLoading(true);

    try {
      const method = idParametro ? "PUT" : "POST";
      const url = idParametro
        ? `https://nestbackend.fidare.com/parametros/${idParametro}`
        : "https://nestbackend.fidare.com/parametros";

      // Crear estructura JSON para el backend
      const tableStructure = {
        columns: columns,
        data: tableData,
        created: new Date().toISOString(),
        version: "2.0"
      };

      const payload = {
        nombre: parametro.nombre,
        valor: JSON.stringify(tableStructure),
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

  if (loading) {
    return (
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
      <div className="rounded-t mb-0 px-4 py-3 border-0 bg-blueGray-50">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg text-blueGray-700">
              {idParametro ? "Editar Parámetro" : "Nuevo Parámetro"}
            </h3>
            <p className="text-sm text-blueGray-500 mt-1">
              {isDefiningTable ? "Paso 1: Define la estructura de tu tabla" : "Gestiona los datos de tu tabla"}
            </p>
          </div>
          <button
            className="bg-red-500 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
            onClick={onBack}
            type="button"
          >
            ← Atrás
          </button>
        </div>
      </div>

      <div className="block w-full p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Nombre del parámetro */}
          <div className="mb-6">
            <label className="block text-blueGray-600 text-sm font-bold mb-2">Nombre del Parámetro</label>
            <input
              name="nombre"
              className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
              type="text"
              placeholder="Ej: Lista de Precios, Catálogo de Productos, etc."
              value={parametro.nombre}
              required
              onChange={handleNombreChange}
            />
          </div>

          {/* Configuración de tabla (solo para nuevos o reconfiguración) */}
          {isDefiningTable && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blueGray-700 mb-4">📊 Configuración de Tabla</h4>
              
              <div className="mb-4">
                <label className="block text-blueGray-600 text-sm font-bold mb-2">Número de Columnas</label>
                <select
                  value={numColumns}
                  onChange={handleNumColumnsChange}
                  className="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>{num} columna{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-blueGray-600 text-sm font-bold mb-2">Nombres de las Columnas</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array(numColumns).fill(0).map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      placeholder={`Columna ${index + 1}`}
                      value={columnNames[index] || ''}
                      onChange={(e) => handleColumnNameChange(index, e.target.value)}
                      className="border-0 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring ease-linear transition-all duration-150"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateTable}
                className="bg-blue-600 text-white font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150"
              >
                ✓ Crear Tabla
              </button>
            </div>
          )}

          {/* Tabla de datos */}
          {columns.length > 0 && !isDefiningTable && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-blueGray-700">📋 Datos de la Tabla</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="bg-green-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
                  >
                    + Agregar Fila
                  </button>
                  <button
                    type="button"
                    onClick={handleReconfigureTable}
                    className="bg-yellow-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
                  >
                    ⚙️ Reconfigurar
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map((col) => (
                        <th key={col.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {col.name}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                          No hay datos. Haz clic en "Agregar Fila" para comenzar.
                        </td>
                      </tr>
                    ) : (
                      tableData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {columns.map((col) => (
                            <td className="px-6 py-4 whitespace-nowrap" key={col.name}>
                              <input
                                className="border-0 px-3 py-2 placeholder-blueGray-300 text-blueGray-600 bg-gray-50 rounded text-sm shadow-sm focus:outline-none focus:ring focus:border-blue-300 w-full ease-linear transition-all duration-150"
                                value={item[col.name] || ""}
                                onChange={(e) => handleCellChange(idx, col.name, e.target.value)}
                                placeholder={`Ingresa ${col.name.toLowerCase()}`}
                              />
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              className="bg-red-500 text-white font-bold uppercase text-xs px-3 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
                              onClick={() => handleRemoveRow(idx)}
                            >
                              🗑️ Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {tableData.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
                  📊 Total de filas: <strong>{tableData.length}</strong> | 
                  Columnas: <strong>{columns.map(c => c.name).join(', ')}</strong>
                </div>
              )}
            </div>
          )}

          {/* Botón de guardar */}
          {columns.length > 0 && !isDefiningTable && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-lightBlue-600 text-white font-bold uppercase text-sm px-8 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none ease-linear transition-all duration-150 disabled:opacity-50"
              >
                {loading ? "Guardando..." : (idParametro ? "💾 Actualizar Parámetro" : "💾 Crear Parámetro")}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

Parametro.propTypes = {
  idParametro: PropTypes.number,
  onBack: PropTypes.func.isRequired,
};