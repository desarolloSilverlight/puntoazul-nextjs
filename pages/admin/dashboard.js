import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { API_BASE_URL } from "../../utils/config";

// layout for page
import Admin from "layouts/Admin.js";

// Componentes del dashboard
import DashboardAdmin from "components/Dashboard/DashboardAdmin.js";
import DashboardAsociado from "components/Dashboard/DashboardAsociado.js";
import DashboardVinculado from "components/Dashboard/DashboardVinculado.js";

export default function Dashboard() {
  const [perfil, setPerfil] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showChangePass, setShowChangePass] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const router = useRouter();

  // Obtener el perfil desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPerfil = localStorage.getItem("perfil");
      setPerfil(storedPerfil);
      setLoading(false);
    }
  }, []);

  // Cargar usuario para validar si requiere cambio de contraseña (changePass)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("id");
    if (!id) {
      setLoadingUser(false);
      // Si no hay sesión, redirigir a login
      router.replace("/auth/login");
      return;
    }
    const fetchUser = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/users/getUsuario?id=${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const data = await resp.json();
        // Aceptar 1 o "1" como verdadero
        if (data && (data.changePass === 1 || data.changePass === "1")) {
          setShowChangePass(true);
        }
      } catch (e) {
        // Si falla la carga, permitir continuar sin bloquear
        console.warn("No se pudo verificar changePass:", e?.message || e);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleSaveNewPassword = async () => {
    setPassError("");
    if (!newPass) {
      setPassError("La nueva contraseña es obligatoria.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("Las contraseñas no coinciden.");
      return;
    }
    const id = typeof window !== "undefined" ? localStorage.getItem("id") : null;
    if (!id) {
      setPassError("Sesión no válida. Inicie sesión nuevamente.");
      return;
    }
    setSavingPass(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: newPass, changePass: 0 }),
      });
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      setShowChangePass(false);
      setNewPass("");
      setConfirmPass("");
    } catch (e) {
      setPassError(e?.message || "Error al actualizar la contraseña.");
    } finally {
      setSavingPass(false);
    }
  };

  if (loading || loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lightBlue-600 text-lg font-semibold animate-pulse">
          Cargando dashboard...
        </div>
      </div>
    );
  }

  // Si requiere cambio de contraseña, mostrar modal bloqueante y no renderizar dashboard ni redirecciones
  if (showChangePass) {
    return (
      <div className="relative min-h-screen">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40" />
        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2 text-blueGray-700">Cambio de contraseña requerido</h2>
            <p className="text-sm text-blueGray-500 mb-4">
              Por seguridad, debes actualizar tu contraseña antes de continuar.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  className="border rounded w-full p-2"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Confirmar contraseña</label>
                <input
                  type="password"
                  className="border rounded w-full p-2"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {passError && <div className="text-red-600 text-sm">{passError}</div>}
              <button
                onClick={handleSaveNewPassword}
                disabled={savingPass}
                className={`w-full mt-2 px-4 py-2 rounded text-white bg-lightBlue-600 hover:bg-lightBlue-700 ${savingPass ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {savingPass ? "Guardando..." : "Guardar contraseña"}
              </button>
            </div>
          </div>
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
      case "AdministradorB":
        return <DashboardAdmin tipo="B" />;
      case "AdministradorF":
        return <DashboardAdmin tipo="F" />;
      case "ValidadorB":
        // Redirigir a Validar Literal B
        if (typeof window !== "undefined") router.replace("/admin/validarb");
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lightBlue-600 text-lg font-semibold">
              Redirigiendo a Validación Literal B...
            </div>
          </div>
        );
      case "ValidadorF":
        // Redirigir a Validar Línea Base
        if (typeof window !== "undefined") router.replace("/admin/validarf");
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lightBlue-600 text-lg font-semibold">
              Redirigiendo a Validación Línea Base...
            </div>
          </div>
        );
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
