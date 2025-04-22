import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function TablaRetornabilidad({ color }) {
  let idInformacionF = localStorage.getItem("idInformacionF");
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

  // Inicializar los objetos vacíos para cada campo
  useEffect(() => {
    const initialData = { ...datos };
    Object.keys(datos.parametros).forEach(key => {
      initialData.pesoTotal[key] = "";
      initialData.papel[key] = "";
      initialData.carton[key] = "";
      initialData.plasticoRigidos[key] = "";
      initialData.plasticoFlexibles[key] = "";
      initialData.vidrio[key] = "";
      initialData.metalesFerrosos[key] = "";
      initialData.metalesNoFerrosos[key] = "";
      initialData.multimaterial1[key] = "";
      initialData.multimaterialn[key] = "";
      initialData.descripcion[key] = "";
    });
    setDatos(initialData);
  }, []);

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
        setDatos(data);
      } catch (error) {
        console.error("Error al obtener los envases retornables:", error);
      }
    };

    if (idInformacionF) {
      fetchDatos();
    }
  }, [idInformacionF]);

  const handleChange = (parametro, field, value) => {
    const nuevosDatos = { ...datos };
    const sanitizedValue = value.replace(",", ".");
    nuevosDatos[field][parametro] = sanitizedValue;
    setDatos(nuevosDatos);
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
          peso: datos.pesoTotal,
          papel: datos.papel,
          carton: datos.carton,
          plasticoRig: datos.plasticoRigidos,
          platicoFlex: datos.plasticoFlexibles,
          vidrio: datos.vidrio,
          metal_ferrosos: datos.metalesFerrosos,
          metal_no_ferrososs: datos.metalesNoFerrosos,
          multimaterial1: datos.multimaterial1,
          multimaterialn: datos.multimaterialn,
          descripcion: datos.descripcion
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
          Cantidad total en peso (toneladas) de materiales de envases y empaques retornables&nbsp;
          {/* <i 
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer" 
            onClick={() => setIsOpen(true)}
          ></i> */}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto mt-4">
            <table className="w-full bg-transparent border-collapse">
              <thead>
                <tr className="bg-blueGray-50 text-blueGray-500">
                  <th className="p-2">Parámetro</th>
                  <th className="p-2">Peso total (ton) Año base</th>
                  <th className="p-2">Papel</th>
                  <th className="p-2">Cartón</th>
                  <th className="p-2">Plástico Rígidos</th>
                  <th className="p-2">Plástico Flexibles</th>
                  <th className="p-2">Vidrio</th>
                  <th className="p-2">Metales Ferrosos</th>
                  <th className="p-2">Metales No Ferrosos</th>
                  <th className="p-2">Multimaterial 1</th>
                  <th className="p-2">Multimaterial n</th>
                  <th className="p-2">Descripción del procedimiento</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(datos.parametros).map(([key, parametro]) => (
                  <tr key={key} className="border-t">
                    <td className="p-2">{parametro}</td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "pesoTotal", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.pesoTotal[key]}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "papel", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.papel[key]}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "carton", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.carton[key]}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "plasticoRigidos", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.plasticoRigidos[key]}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "plasticoFlexibles", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.plasticoFlexibles[key]}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "vidrio", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.vidrio[key]}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "metalesFerrosos", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.metalesFerrosos[key]}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "metalesNoFerrosos", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.metalesNoFerrosos[key]}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "multimaterial1", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.multimaterial1[key]}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "multimaterialn", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.multimaterialn[key]}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(key, "descripcion", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {datos.descripcion[key]}
                      </div>
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
