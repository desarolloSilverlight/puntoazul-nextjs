import React, { useState } from "react";

// components
import CardSettings from "components/Cards/CardParametros.js";
import Parametro from "components/Cards/Parametro.js";

// layout for page
import Admin from "layouts/Admin.js";

export default function Users() {
  const [view, setView] = useState("table"); // Controla la vista actual ("table" o "form")
  const [selectedUserId, setSelectedUserId] = useState(null); // ID del usuario seleccionado para edición

  // Función para cambiar a la vista de "Nuevo Usuario"
  const handleNew = () => {
    setSelectedUserId(null);
    setView("form");
  };

  // Función para cambiar a la vista de "Editar Usuario"
  const handleEdit = (id) => {
    setSelectedUserId(id);
    setView("form");
  };

  // Función para regresar a la vista de la tabla
  const handleBack = () => {
    setView("table");
  };

  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full lg:w-12 px-4">
          {view === "table" ? (
            <CardSettings color="light" onNew={handleNew} onEdit={handleEdit} />
          ) : (
            <Parametro idParametro={selectedUserId} onBack={handleBack} />
          )}
        </div>
      </div>
    </>
  );
}

Users.layout = Admin;