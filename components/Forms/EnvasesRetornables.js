import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

// Utilidad para deserializar doble JSON si es necesario
function parseDoubleJSON(value) {
  try {
    if (typeof value === "string") {
      let parsed = JSON.parse(value);
      if (typeof parsed === "string") {
        return JSON.parse(parsed);
      }
      return parsed;
    }
    return value || {};
  } catch {
    return {};
  }
}

export default function TablaRetornabilidad({ color }) {
  let idInformacionF = localStorage.getItem("idInformacionF") || 0;
  let estado = localStorage.getItem("estadoInformacion");
  const [datos, setDatos] = useState({
    parametros: {
      "EERM": "(1) EERM",
      "EER": "(2) EER",
      "EENC": "(3) EENC",
      "EERI": "(4) EERI",
      "ER": "(5) ER",
      "EENC_EERI": "(EENC +  EERI)",
      "MATERIAL_70": "Material con % mayor al 70% (*)",
      "NINGUN_MATERIAL_70": "Ningún material con % mayor al 70%  (**)",
      "MATERIAL_1": "Material 1",
      "MATERIAL_2": "Material 2",
      "MATERIAL_3": "Material 3",
      "MULTIMATERIAL_N": "Multimaterial n"
    },
    pesoTotal: {},
    papel: {},
    carton: {},
    plasticoRigidos: {},
    plasticoFlexibles: {},
    vidrio: {},
    metalesFerrosos: {},
    metalesNoFerrosos: {},
    multimaterial1: {},
    multimaterialn: {},
    descripcion: {}
  });

  // Obtener datos desde el backend al cargar el componente
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await fetch(`https://nestbackend.fidare.com/informacion-f/getEnvasesRetornables/${idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron envases retornables para este idInformacionF.");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Envases retornables obtenidos:", data);

        // Procesar los datos recibidos usando parseDoubleJSON
        if (data && data.length > 0) {
          const primerRegistro = data[0];
          const nuevosDatos = {
            ...datos,
            pesoTotal: parseDoubleJSON(primerRegistro.peso),
            papel: parseDoubleJSON(primerRegistro.papel),
            carton: parseDoubleJSON(primerRegistro.carton),
            plasticoRigidos: parseDoubleJSON(primerRegistro.plasticoRig),
            plasticoFlexibles: parseDoubleJSON(primerRegistro.platicoFlex),
            vidrio: parseDoubleJSON(primerRegistro.vidrio),
            metalesFerrosos: parseDoubleJSON(primerRegistro.metal_ferrosos),
            metalesNoFerrosos: parseDoubleJSON(primerRegistro.metal_no_ferrososs),
            multimaterial1: parseDoubleJSON(primerRegistro.multimaterial1),
            multimaterialn: parseDoubleJSON(primerRegistro.multimaterialn),
            descripcion: parseDoubleJSON(primerRegistro.descripcion)
          };
          setDatos(nuevosDatos);
        }
      } catch (error) {
        console.error("Error al obtener los envases retornables:", error);
      }
    };

    if (idInformacionF) {
      fetchDatos();
    }
  }, [idInformacionF]);

  const handleChange = (parametro, field, value) => {
    setDatos((prevDatos) => {
      // Clonar el objeto anidado de forma segura
      const updatedField = { ...(prevDatos[field] || {}) };
      updatedField[parametro] = value.replace(",", ".");
      return {
        ...prevDatos,
        [field]: updatedField,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://nestbackend.fidare.com/informacion-f/crearEnvaseRetornable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idInformacionF,
          peso: JSON.stringify(datos.pesoTotal),
          papel: JSON.stringify(datos.papel),
          carton: JSON.stringify(datos.carton),
          plasticoRig: JSON.stringify(datos.plasticoRigidos),
          platicoFlex: JSON.stringify(datos.plasticoFlexibles),
          vidrio: JSON.stringify(datos.vidrio),
          metal_ferrosos: JSON.stringify(datos.metalesFerrosos),
          metal_no_ferrososs: JSON.stringify(datos.metalesNoFerrosos),
          multimaterial1: JSON.stringify(datos.multimaterial1),
          multimaterialn: JSON.stringify(datos.multimaterialn),
          descripcion: JSON.stringify(datos.descripcion)
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Respuesta de la API:", result);
      alert(result.message);
    } catch (error) {
      console.error("Error al enviar los envases retornables:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold flex items-center">
          Cantidad total en peso (toneladas) de materiales de envases y empaques retornables
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="w-full overflow-x-auto p-4">
            <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Parámetro</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total (ton) Año base</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Papel</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Cartón</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Plástico Rígidos</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Plástico Flexibles</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Vidrio</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Metales Ferrosos</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Metales No Ferrosos</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Multimaterial 1</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Multimaterial n</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Descripción del procedimiento</th>
                </tr>
              </thead>
              <tbody>
                {datos.parametros && Object.entries(datos.parametros).map(([key, parametro]) => (
                  <tr key={key} className="border-t text-center">
                    <td className="p-2">{parametro}</td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.pesoTotal[key] || ""}
                        onChange={(e) => handleChange(key, "pesoTotal", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.papel[key] || ""}
                        onChange={(e) => handleChange(key, "papel", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.carton[key] || ""}
                        onChange={(e) => handleChange(key, "carton", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.plasticoRigidos[key] || ""}
                        onChange={(e) => handleChange(key, "plasticoRigidos", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.plasticoFlexibles[key] || ""}
                        onChange={(e) => handleChange(key, "plasticoFlexibles", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.vidrio[key] || ""}
                        onChange={(e) => handleChange(key, "vidrio", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.metalesFerrosos[key] || ""}
                        onChange={(e) => handleChange(key, "metalesFerrosos", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.metalesNoFerrosos[key] || ""}
                        onChange={(e) => handleChange(key, "metalesNoFerrosos", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.multimaterial1[key] || ""}
                        onChange={(e) => handleChange(key, "multimaterial1", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.multimaterialn[key] || ""}
                        onChange={(e) => handleChange(key, "multimaterialn", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.descripcion[key] || ""}
                        onChange={(e) => handleChange(key, "descripcion", e.target.value)}
                        disabled={estado === "Aprobado"}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="submit"
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            disabled={estado === "Aprobado"}
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}

TablaRetornabilidad.propTypes = {
  color: PropTypes.string,
};
