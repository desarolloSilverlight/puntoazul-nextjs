import React, { useState } from "react";
import Admin from "layouts/Admin.js";
import Informacion from "components/Forms/Informacion";
import EmpaquePrimario from "components/Forms/EmpaquePrimario";
import EmpaqueSecundario from "components/Forms/EmpaqueSecundario";
import EmpaquePlastico from "components/Forms/EmpaquePlastico";
import EnvasesRetornables from "components/Forms/EnvasesRetornables";
import DistribucionGeografica from "components/Forms/DistribucionGeografica";

export default function FormularioF() {
  const [activeTab, setActiveTab] = useState("Informacion");

  const renderForm = () => {
    switch (activeTab) {
      case "Informacion":
        return <Informacion color="light"/>;
      case "Empaque Primario":
        return <EmpaquePrimario color="light"/>;
      case "Empaque Secundario":
        return <EmpaqueSecundario color="light"/>;
      case "Empaque Plastico":
        return <EmpaquePlastico color="light"/>;
      case "Envases Retornables":
        return <EnvasesRetornables color="light"/>;
      case "Distribucion Geografica":
        return <DistribucionGeografica color="light"/>;
      default:
        return null;
    }
  };

  return (
    <div className="mt-10 p-4 bg-gray-100 min-h-screen">
      <div className="relative flex border-b-2 border-gray-300">
        {["Informacion", "Empaque Primario", "Empaque Secundario", "Empaque Plastico", "Envases Retornables", "Distribucion Geografica"].map((tab) => (
          <button
            key={tab}
            className={`p-3 px-6 text-lg font-semibold transition-all duration-300 rounded-t-lg ${
              activeTab === tab
                ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md"
                : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-4 bg-white shadow-md rounded-lg">{renderForm()}</div>
    </div>
  );
}

FormularioF.layout = Admin;
