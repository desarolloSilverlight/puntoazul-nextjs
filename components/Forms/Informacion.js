import React, { useState } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  const [productos, setProductos] = useState([]);

  const agregarProducto = () => {
    setProductos([...productos, { id: productos.length + 1 }]);
  };

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      {/* SECCIÓN I */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Información sobre el vinculado</h3>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <input className="border p-2" type="text" placeholder="Nombre o razón social" />
          <input className="border p-2" type="text" placeholder="NIT" />
          <input className="border p-2" type="text" placeholder="Dirección" />
          <input className="border p-2" type="text" placeholder="Ciudad" />
          <input className="border p-2" type="text" placeholder="Pais Casa matriz" />
          <input className="border p-2" type="text" placeholder="Correo de Facturación" />
          <input className="border p-2" type="text" placeholder="Persona de contacto" />
          <input className="border p-2" type="text" placeholder="Teléfono y extension" />
          <input className="border p-2" type="text" placeholder="Celular" />
          <input className="border p-2" type="text" placeholder="Cargo" />
          <input className="border p-2" type="text" placeholder="Correo electrónico" />
          <input className="border p-2" type="date" placeholder="Fecha de diligenciamiento" />
          <input className="border p-2" type="text" placeholder="Año reportado" />
          <select className="border p-2">
            {Array.from({ length: 49 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
            <option value="50+">50 o más</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="mr-4">
            <input
              type="radio"
              name="reporte"
              value="unitario"
              // checked={reporte === "unitario"}
              // onChange={() => setReporte("unitario")}
            /> Reporte Unitario
          </label>
          <label>
            <input
              type="radio"
              name="reporte"
              value="totalizado"
              // checked={reporte === "totalizado"}
              // onChange={() => setReporte("totalizado")}
            /> Reporte Totalizado
          </label>
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

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};
