import React, { useEffect, useState } from "react";

// components
import AdminNavbar from "components/Navbars/AdminNavbar.js";
import Sidebar from "components/Sidebar/Sidebar.js";
import HeaderStats from "components/Headers/HeaderStats.js";
import HeaderStatsB from "components/Headers/HeaderStatsB.js";
import HeaderStatsF from "components/Headers/HeaderStatsF.js";
import FooterAdmin from "components/Footers/FooterAdmin.js";

export default function Admin({ children, username }) {
  const [perfil, setPerfil] = useState("");

  // Obtener el perfil desde localStorage
  useEffect(() => {
    const storedPerfil = localStorage.getItem("perfil");
    setPerfil(storedPerfil);
  }, []);

  // Renderizar el componente HeaderStats según el perfil
  const renderHeaderStats = () => {
    const p = (perfil || "").toLowerCase();
    if (p.includes("administrador") || p === "empleado" || p === "administradorb" || p === "administradorf" || p === "validadorf" || p === "validadorb" ) {
      // Administrador, AdministradorB, AdministradorF y Empleado usan header de administrador
      return <HeaderStats />;
    } else if (p.includes("asociado")) {
      return <HeaderStatsB />;
    } else if (p.includes("vinculado")) {
      return <HeaderStatsF />;
    } else {
      return null; // Si no hay perfil válido, no renderizar nada
    }
  };

  return (
    <>
      <Sidebar />
      <div className="relative md:ml-64 bg-blueGray-100">
        <AdminNavbar username={username} />
        {/* Header */}
        {renderHeaderStats()}
        <div className="px-4 md:px-10 mx-auto w-full-m-24 ">
          {children}
          <FooterAdmin />
        </div>
      </div>
    </>
  );
}