import React, { useState, useEffect } from "react";
import Modal from "react-modal";
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

  if (typeof window !== "undefined") {
    Modal.setAppElement("#__next");
  }

  // 🔥 Cargar animación personalizada solo en cliente
  useEffect(() => {
    if (typeof document !== "undefined") {
      const style = document.createElement("style");
      /*style.innerHTML = `
      @keyframes crazy-jump {
        0% { transform: translate(0, 0) rotate(0deg); }
        10% { transform: translate(-150px, -100px) rotate(-15deg); }
        25% { transform: translate(200px, 120px) rotate(10deg); }
        40% { transform: translate(-180px, 150px) rotate(20deg); }
        60% { transform: translate(150px, -130px) rotate(-25deg); }
        80% { transform: translate(-120px, 80px) rotate(15deg); }
        100% { transform: translate(0, 0) rotate(0deg); }
      }

      .animate-crazy-jump {
        animation: crazy-jump 5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
      }
      `;
      document.head.appendChild(style);*/
    }
  }, []);

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
        if (data && (data.changePass === 1 || data.changePass === "1")) {
          setShowChangePass(true);
        }
      } catch (e) {
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

  // 🚨 Modal bloqueante de cambio de contraseña
  if (showChangePass) {
    return (
      <Modal
        isOpen={showChangePass}
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEsc={false}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
          },
          content: {
            inset: "50% auto auto 50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "420px",
            width: "90%",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          },
        }}
      >
        <div className="animate-crazy-jump">
          <h2 className="text-xl font-bold mb-2 text-blueGray-700 text-center">
            Cambio de contraseña requerido
          </h2>
          <p className="text-sm text-blueGray-500 mb-4 text-center">
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
              className={`w-full mt-2 px-4 py-2 rounded text-white bg-lightBlue-600 hover:bg-lightBlue-700 ${
                savingPass ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {savingPass ? "Guardando..." : "Guardar contraseña"}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Renderizar dashboard según perfil
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
        if (typeof window !== "undefined") router.replace("/admin/validarb");
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-lightBlue-600 text-lg font-semibold">
              Redirigiendo a Validación Literal B...
            </div>
          </div>
        );
      case "ValidadorF":
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
