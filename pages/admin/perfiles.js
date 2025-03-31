import React, { useState } from "react";

// components
import CardPerfiles from "components/Cards/CardPerfiles.js";
import Perfil from "components/Cards/Perfil.js";

// layout for page
import Admin from "layouts/Admin.js";

export default function Perfiles() {
  const [view, setView] = useState("table"); // Controla la vista actual ("table" o "form")
  const [selectedPerfilId, setSelectedPerfilId] = useState(null); // ID del perfil seleccionado para edición

  // Función para cambiar a la vista de edición
  const handleEdit = (id) => {
    console.log("Perfil seleccionado en handleEdit:", id); // Verifica el valor de id
    setSelectedPerfilId(id);
    setView("form");
  };

  // Función para regresar a la vista de la tabla
  const handleBack = () => {
    setView("table");
  };

  return (
    <>
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          {view === "table" ? (
            <CardPerfiles color="light" onEdit={handleEdit} />
          ) : (
            <Perfil nombre={selectedPerfilId} onBack={handleBack} />
          )}
        </div>
      </div>
    </>
  );
}

Perfiles.layout = Admin;