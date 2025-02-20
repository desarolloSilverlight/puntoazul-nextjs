import React, { useState } from "react";
import PropTypes from "prop-types";

export default function TablaRetornabilidad({ color }) {
  const [datos, setDatos] = useState([
    "(1) EERM",
    "(2) EER",
    "(3) EENC",
    "(4) EERI",
    "(5) ER",
    "(EENC +  EERI)",
    "Material con % mayor al 70% (*)",
    "Ningún material con % mayor al 70%  (**)",
    "Material 1",
    "Material 2",
    "Material 3",
    "Multimaterial n",
  ]);

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold">
          Cantidad total en peso (toneladas) de materiales de envases y empaques retornables
        </h3>
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
              {datos.map((parametro, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{parametro}</td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="text" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

TablaRetornabilidad.propTypes = {
  color: PropTypes.string,
};
