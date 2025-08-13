import React, { useState, useEffect } from "react";

// layout for page
import Admin from "layouts/Admin.js";

// Componentes del dashboard
import DashboardAdmin from "components/Dashboard/DashboardAdmin.js";
import DashboardAsociado from "components/Dashboard/DashboardAsociado.js";
import DashboardVinculado from "components/Dashboard/DashboardVinculado.js";

export default function Dashboard() {
  const [perfil, setPerfil] = useState("");
  const [loading, setLoading] = useState(true);

  // Obtener el perfil desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPerfil = localStorage.getItem("perfil");
      setPerfil(storedPerfil || "");
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lightBlue-600 text-lg font-semibold animate-pulse">
          Cargando dashboard...
        </div>
      </div>
    );
  }

  // Renderizar dashboard según el perfil
  const renderDashboard = () => {
    switch (perfil) {
      case "Administrador":
      case "Empleado":
        return <DashboardAdmin />;
      case "Asociado":
        return <DashboardAsociado />;
      case "Vinculado":
        return <DashboardVinculado />;
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-4">
                Perfil no reconocido
              </div>
              <p className="text-gray-600">Por favor, inicie sesión nuevamente</p>
            </div>
          </div>
        );
    }
  };

  return <>{renderDashboard()}</>;
}

Dashboard.layout = Admin;
