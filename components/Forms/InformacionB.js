import React, { useState } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded p-6 " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      {/* SECCIÓN I */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-4">Información sobre el Afiliado</h3>

        {/* Primera fila (2 columnas) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input className="border p-2 w-full" type="text" placeholder="Nombre o razón social" />
          <input className="border p-2 w-full" type="text" placeholder="NIT" />
        </div>

        {/* Segunda fila (3 columnas) */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input className="border p-2 w-full" type="text" placeholder="Dirección" />
          <input className="border p-2 w-full" type="text" placeholder="Ciudad" />
          <input className="border p-2 w-full" type="text" placeholder="Telefono" />
        </div>

        {/* Tercera fila (5 columnas) */}
        <div className="grid grid-cols-5 gap-4 mb-4">
          <input className="border p-2 w-full" type="text" placeholder="Representante Legal" />
          <input className="border p-2 w-full" type="text" placeholder="Telefono" />
          <input className="border p-2 w-full" type="text" placeholder="Persona de contacto" />
          <input className="border p-2 w-full" type="text" placeholder="Cargo" />
          <input className="border p-2 w-full" type="text" placeholder="Correo" />
        </div>

        {/* Cuarta fila (3 columnas) */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input className="border p-2 w-full" type="text" placeholder="Año" />
          <input className="border p-2 w-full" type="text" placeholder="Año reporte" />
          <input className="border p-2 w-full" type="text" placeholder="Titulares Representados" />
        </div>

        {/* Quinta fila (2 columnas) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input className="border p-2 w-full" type="text" placeholder="Capital de origen (Nacional / Multinacional)" />
          <input className="border p-2 w-full" type="text" placeholder="Correo de facturacion" />
        </div>

        {/* Botón Guardar */}
        <button className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3">
          Guardar
        </button>
      </div>
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};
