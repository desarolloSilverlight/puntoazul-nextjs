import React, { useState } from "react";
import Admin from "layouts/Admin.js";
import InformacionB from "components/Forms/InformacionB";
import ProductosB from "components/Forms/ProductosB";

export default function FormularioF() {
  const [activeTab, setActiveTab] = useState("Informacion");

  const renderForm = () => {
    switch (activeTab) {
      case "Informacion":
        return <InformacionB color="light"/>;
      case "Productos":
        return <ProductosB color="light"/>;
      default:
        return null;
    }
  };

  return (
    <div className="mt-10 p-4 bg-gray-100 min-h-screen">
      <div className="relative z-10 flex border-b-2 border-gray-300">
        {["Informacion", "Productos"].map((tab) => (
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
