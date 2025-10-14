import React, { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Modal from "react-modal";
import { API_BASE_URL } from "../../utils/config";
import { Eye, EyeOff } from "lucide-react";
// layout for page

import Auth from "layouts/Auth.js";
export default function Login() {
  // Necesario para accesibilidad con react-modal
  if (typeof window !== "undefined") {
    Modal.setAppElement("#__next");
  }
  const [username, setIdentificacion] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Reiniciar error
  
    try {
      // Realizar la solicitud de inicio de sesión
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔥 Permitir cookies en la petición
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginResponse.json();
      console.log(loginData);

      if (!loginResponse.ok) {
        throw new Error(loginData.message || "Error al iniciar sesión");
      }
      const userName = loginData.id;
      const perfil = loginData.perfil;
      const idUsuario = loginData.idUsuario;
      localStorage.setItem("perfil", perfil); 
      localStorage.setItem("username", userName); 
      localStorage.setItem("id", idUsuario); 
      router.push({
        pathname: "/admin/dashboard",
        query: { username: userName },
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotErr("");
    setForgotMsg("");
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotErr("Ingrese un correo válido.");
      return;
    }
    setForgotSending(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: forgotEmail })
      });
      // Intentar leer JSON si existe
      let data = null;
      try { data = await resp.json(); } catch {}
      if (!resp.ok) {
        throw new Error((data && data.message) || `Error ${resp.status}`);
      }
      // Si el backend devuelve el token para que el FE envíe el correo, lo usamos
      if (data && data.token) {
        const resetUrl = `${window.location.origin}/auth/reset-password?t=${encodeURIComponent(data.token)}`;
        const asunto = "Restablecer contraseña de tu cuenta Punto Azul";
        const cuerpo = `Hola,\n\nRecibimos una solicitud para restablecer tu contraseña. Usa el siguiente enlace para crear una nueva. Este enlace vence en 60 minutos.\n\n${resetUrl}\n\nSi no solicitaste este cambio, ignora este mensaje.\n\nPunto Azul`;
        try {
          await fetch(`${API_BASE_URL}/informacion-b/enviarCorreo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mensajes: [{
                destinatario: forgotEmail,
                asunto,
                cuerpo,
                cuerpoHtml: cuerpo.replace(/\n/g, "<br/>") ,
                tipoFormulario: "reset_password"
              }],
              enviarComoHtml: true,
              incluirPasswordPlano: false
            })
          });
        } catch (e) {
          // No bloquear por fallo de envío desde FE (puede que el backend ya lo haya enviado)
          console.warn("Fallo al enviar correo de reset desde FE:", e?.message || e);
        }
      }
      setForgotMsg("Si existe un usuario activo con ese correo, se envió un enlace para restablecer la contraseña.");
    } catch (e) {
      setForgotErr(e.message || "No se pudo procesar la solicitud.");
    } finally {
      setForgotSending(false);
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
                  Bienvenido
                </h6>
              </div>
              <div className="flex justify-center items-center">
                <Image
                  src="/Logo_PuntoAzul_Horizontal.png"
                  alt="Logo Punto Azul"
                  width={250}
                  height={125}
                />
              </div>
              <hr className="mt-6 border-b-1 border-blueGray-300" />
            </div>
            <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <form onSubmit={handleLogin}>
                <div className="relative w-full mb-3">
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                    Correo Electronico
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setIdentificacion(e.target.value)}
                    className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    required
                  />
                </div>

                <div className="w-full">
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                    Contraseña
                  </label>

                  <div className="relative w-full flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingrese su contraseña"
                      className="w-full bg-white border border-gray-300 rounded-lg py-2.5 pl-4 pr-10 text-sm text-blueGray-600 placeholder-blueGray-300 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 flex items-center justify-center translate-y-[1px] text-gray-500 hover:text-gray-700 focus:outline-none"
                      style={{ top: '22%', right: '10px' }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="text-right -mt-2 mb-4">
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(""); setForgotErr(""); setForgotMsg(""); }}
                    className="text-sm text-lightBlue-600 hover:text-lightBlue-700 underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <div className="text-center mt-6">
                  <button
                    type="submit"
                    className="bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none w-full ease-linear transition-all duration-150"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Olvidé mi contraseña (react-modal) */}
      <Modal
        isOpen={showForgot}
        onRequestClose={() => { if (!forgotSending) setShowForgot(false); }}
        className="mx-auto my-32 bg-white p-5 rounded-lg shadow-lg max-w-xl z-40 max-h-460-px overflow-y-auto outline-none"
        overlayClassName=""
        contentLabel="Recupera tu contraseña"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="text-lg font-semibold text-blueGray-700 mb-2">Recupera tu contraseña</h2>
        <p className="text-sm text-blueGray-500 mb-4">Ingresa tu correo electrónico para enviar un enlace de recuperación.</p>
        {forgotMsg ? (
          <div className="space-y-4">
            <div className="text-green-600 text-sm">{forgotMsg}</div>
            <div className="flex justify-end">
              <button className="px-4 py-2 rounded bg-lightBlue-600 text-white" onClick={() => setShowForgot(false)}>Cerrar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="border p-2 rounded w-full"
              required
            />
            {forgotErr && <div className="text-red-600 text-sm">{forgotErr}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowForgot(false)} disabled={forgotSending}>Cancelar</button>
              <button type="submit" className={`px-4 py-2 rounded text-white ${forgotSending ? 'bg-lightBlue-400' : 'bg-lightBlue-600 hover:bg-lightBlue-700'}`} disabled={forgotSending}>
                {forgotSending ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
Login.layout = Auth;