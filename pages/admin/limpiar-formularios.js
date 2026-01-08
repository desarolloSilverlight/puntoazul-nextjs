import React from "react";
import CardLimpiarFormularios from "components/Cards/CardLimpiarFormularios.js";
import Admin from "layouts/Admin.js";

export default function LimpiarFormularios() {
  return (
    <>
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <CardLimpiarFormularios />
        </div>
      </div>
    </>
  );
}

LimpiarFormularios.layout = Admin;
