import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Auth from "layouts/Auth";
import { API_BASE_URL } from "../../utils/config";

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const t = typeof router.query.t === 'string' ? router.query.t : '';
    setToken(t || "");
  }, [router.isReady, router.query.t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const pwd = (password || "").trim();
    const pwdConfirm = (confirm || "").trim();
    if (!token) { setError("Enlace inválido o incompleto."); return; }
    if (!pwd) { setError("La contraseña es obligatoria."); return; }
    if (pwd !== pwdConfirm) { setError("Las contraseñas no coinciden."); return; }
    setSubmitting(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // El backend espera { token, newPassword }
        body: JSON.stringify({ token, newPassword: pwd })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || (data && data.ok === false)) {
        throw new Error((data && data.message) || `Error ${resp.status}`);
      }
      setSuccess(true);
    } catch (e) {
      setError(e.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 h-full">
      <div className="flex content-center items-center justify-center h-full">
        <div className="w-full lg:w-4/12 px-4">
          <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0">
            <div className="rounded-t mb-0 px-6 py-6">
              <div className="text-center mb-3">
                <h6 className="text-blueGray-500 text-sm font-bold">Restablecer contraseña</h6>
              </div>
              <div className="flex justify-center items-center">
                <Image src="/Logo_PuntoAzul_Horizontal.png" alt="Logo Punto Azul" width={250} height={125} />
              </div>
              <hr className="mt-6 border-b-1 border-blueGray-300" />
            </div>
            <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              {success ? (
                <div className="space-y-4">
                  <p className="text-green-600 text-sm">Tu contraseña fue cambiada correctamente.</p>
                  <button className="bg-blueGray-800 text-white text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg w-full" onClick={() => router.push('/auth/login')}>
                    Regresar al login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">Nueva contraseña</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full" required />
                  </div>
                  <div className="relative w-full mb-3">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">Confirmar contraseña</label>
                    <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full" required />
                  </div>
                  <div className="text-center mt-6">
                    <button type="submit" disabled={submitting} className="bg-blueGray-800 text-white text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg w-full">
                      {submitting ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ResetPassword.layout = Auth;
