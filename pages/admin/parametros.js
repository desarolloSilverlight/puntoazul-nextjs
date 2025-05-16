import React, { useState, useEffect } from "react";

// layout for page
import Admin from "layouts/Admin.js";

// Componente para la tabla de parámetros
function TablaParametros({ parametros, onEdit }) {
  return (
    <table className="min-w-full border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 border">Nombre del Parámetro</th>
          <th className="p-2 border">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {parametros.map((param) => (
          <tr key={param.id}>
            <td className="p-2 border">{param.nombreParametro}</td>
            <td className="p-2 border">
              <button
                className="bg-lightBlue-600 text-white px-3 py-1 rounded"
                onClick={() => onEdit(param)}
              >
                Editar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Componente para editar un parámetro
function FormParametro({ parametro, onBack, onSave }) {
  const [nombreParametro, setNombreParametro] = useState(parametro.nombreParametro);
  const [valores, setValores] = useState(parametro.valor ? JSON.parse(parametro.valor) : {});

  // Manejar cambios en los valores del JSON
  const handleValorChange = (key, value) => {
    setValores((prev) => ({ ...prev, [key]: value }));
  };

  // Agregar nueva clave
  const handleAddKey = () => {
    setValores((prev) => ({ ...prev, "": "" }));
  };

  // Eliminar clave
  const handleRemoveKey = (key) => {
    const newValores = { ...valores };
    delete newValores[key];
    setValores(newValores);
  };

  // Guardar cambios
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...parametro,
      nombreParametro,
      valor: JSON.stringify(valores),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded bg-white">
      <div className="mb-4">
        <label className="block font-bold mb-1">Nombre del Parámetro</label>
        <input
          className="border p-2 w-full"
          value={nombreParametro}
          onChange={(e) => setNombreParametro(e.target.value)}
          disabled
        />
      </div>
      <div className="mb-4">
        <label className="block font-bold mb-1">Valores (key:value)</label>
        {Object.entries(valores).map(([key, value], idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input
              className="border p-2 flex-1"
              placeholder="Clave"
              value={key}
              onChange={(e) => {
                const newKey = e.target.value;
                const newValores = { ...valores };
                delete newValores[key];
                newValores[newKey] = value;
                setValores(newValores);
              }}
            />
            <input
              className="border p-2 flex-1"
              placeholder="Valor"
              value={value}
              onChange={(e) => handleValorChange(key, e.target.value)}
            />
            <button
              type="button"
              className="bg-red-500 text-white px-2 rounded"
              onClick={() => handleRemoveKey(key)}
            >
              X
            </button>
          </div>
        ))}
        <button
          type="button"
          className="bg-green-500 text-white px-3 py-1 rounded"
          onClick={handleAddKey}
        >
          + Agregar clave
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="bg-gray-400 text-white px-4 py-2 rounded"
          onClick={onBack}
        >
          Volver
        </button>
        <button
          type="submit"
          className="bg-lightBlue-600 text-white px-4 py-2 rounded"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

const ParametrosPage = () => {
  const [view, setView] = useState("table");
  const [parametros, setParametros] = useState([]);
  const [parametroEdit, setParametroEdit] = useState(null);

  // Cargar parámetros (simulado, reemplaza con fetch real)
  useEffect(() => {
    // Simulación de fetch
    setParametros([
      { id: 1, nombreParametro: "limiteUsuarios", valor: '{"max":10,"min":1}' },
      { id: 2, nombreParametro: "colorPrincipal", valor: '{"hex":"#0099ff"}' },
    ]);
  }, []);

  // Guardar cambios (aquí deberías hacer el fetch PUT/POST real)
  const handleSave = (param) => {
    setParametros((prev) =>
      prev.map((p) => (p.id === param.id ? param : p))
    );
    setView("table");
  };

  return (
    <div className="p-6">
      {view === "table" ? (
        <TablaParametros parametros={parametros} onEdit={(param) => { setParametroEdit(param); setView("form"); }} />
      ) : (
        <FormParametro
          parametro={parametroEdit}
          onBack={() => setView("table")}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

ParametrosPage.layout = Admin;
export default ParametrosPage;