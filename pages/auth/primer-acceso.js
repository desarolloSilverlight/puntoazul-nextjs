import React, { useState } from "react";
import { useRouter } from "next/router";
import Auth from "layouts/Auth.js";
import { API_BASE_URL } from "../../utils/config";

export default function PrimerAcceso() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const router = useRouter();

  // Debug: Verificar que la página se está cargando
  React.useEffect(() => {
    console.log("Página primer-acceso cargada correctamente");
  }, []);

  // Verificar email y hacer login automático
  const handlePrimerAcceso = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    console.log("Iniciando primer acceso con email:", email);
    console.log("URL del API:", `${API_BASE_URL}/auth/primer-acceso-login`);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/primer-acceso-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔥 Permitir cookies en la petición igual que login.js
        body: JSON.stringify({ email }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();
      console.log("Respuesta del backend:", data); // Debug para ver la respuesta

      if (response.ok && data.success) {
        // Guardar datos de sesión igual que en login.js
        const userName = data.id; // El backend devuelve "id" como userName
        const perfil = data.perfil;
        const idUsuario = data.idUsuario;
        
        // Guardar en localStorage igual que login.js
        localStorage.setItem("perfil", perfil); 
        localStorage.setItem("username", userName); 
        localStorage.setItem("id", idUsuario);
        
        // También guardar datos completos del usuario por si se necesitan
        localStorage.setItem("usuario", JSON.stringify({
          idUsuario: idUsuario,
          nombre: userName,
          email: email,
          perfil: perfil,
          changePass: data.changePass
        }));

        setMensaje("Acceso autorizado. Redirigiendo...");
        
        // Redirigir al dashboard con query parameters igual que login.js
        setTimeout(() => {
          router.push({
            pathname: "/admin/dashboard",
            query: { username: userName },
          });
        }, 1500);
        
      } else {
        setMensaje(data.message || data.mensaje || "Correo no encontrado o no autorizado para primer acceso.");
      }
    } catch (error) {
      console.error("Error completo:", error);
      setMensaje("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 h-full">
      <div className="flex content-center items-center justify-center h-full">
        <div className="w-full lg:w-4/12 px-4">
          <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0">
            <div className="rounded-t mb-0 px-6 py-6">
              <div className="text-center mb-3">
                <h6 className="text-blueGray-500 text-sm font-bold">
                  Primer Acceso al Sistema
                </h6>
                <p className="text-blueGray-400 text-xs mt-2">
                  Ingrese su correo electrónico para acceder por primera vez
                </p>
              </div>
            </div>
            <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
              <form onSubmit={handlePrimerAcceso}>
                <div className="relative w-full mb-3">
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    placeholder="Ingrese su correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="text-center mt-6">
                  <button
                    className="bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Verificando..." : "Ingresar al Sistema"}
                  </button>
                </div>
              </form>

              {mensaje && (
                <div className={`text-center mt-4 text-sm ${
                  mensaje.includes("autorizado") || mensaje.includes("Redirigiendo") 
                    ? "text-green-600" 
                    : "text-red-600"
                }`}>
                  {mensaje}
                </div>
              )}

              <div className="text-center mt-6">
                <a
                  href="/auth/login"
                  className="text-blueGray-600 text-sm"
                >
                  ¿Ya tienes contraseña? Inicia sesión aquí
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

PrimerAcceso.layout = Auth;