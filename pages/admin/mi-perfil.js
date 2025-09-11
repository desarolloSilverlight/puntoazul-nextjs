import React, { useEffect, useState } from "react";
import Admin from "layouts/Admin";
import { API_BASE_URL } from "../../utils/config";

export default function MiPerfil() {
  const [idUsuario, setIdUsuario] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    celular: "",
    identificacion: "",
    perfil: "",
    estado: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Cargar ID y datos del usuario autenticado
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("id");
    if (!id) {
      setError("No se encontró el identificador del usuario en la sesión.");
      setLoading(false);
      return;
    }
    setIdUsuario(id);
    const fetchData = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/users/getUsuario?id=${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const data = await resp.json();
        const { password: _omit, ...rest } = data; // No rellenar password
        setForm(prev => ({ ...prev, ...rest, password: "" }));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!form.email.trim()) return "El correo es obligatorio.";
    if (form.celular && !/^\d{7,15}$/.test(form.celular)) return "El celular debe tener entre 7 y 15 dígitos numéricos.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    const err = validate();
    if (err) { setMensaje(err); return; }
    if (!idUsuario) { setMensaje("No se puede actualizar: falta ID"); return; }
    setSaving(true);
    setError(null);
    try {
      const { password, perfil, estado, ...rest } = form; // perfil/estado se muestran pero no se envían si se desea protegerlos
      // Decisión: permitir modificar solo nombre, email, celular, identificacion y password
      const payload = { ...rest };
      if (form.identificacion) payload.identificacion = form.identificacion;
      if (password && password.trim()) payload.password = password.trim();
      // Si quieres permitir cambiar email o nombre se incluyen ya
      const resp = await fetch(`${API_BASE_URL}/users/${idUsuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      setMensaje("Perfil actualizado correctamente.");
      if (password) setForm(prev => ({ ...prev, password: "" }));
      // Sin recargar: actualizar localStorage básico
      localStorage.setItem("username", form.nombre || "");
      localStorage.setItem("email", form.email || "");
    } catch (e) {
      setMensaje(e.message || "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 md:px-10 mx-auto w-full pt-24">
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
        <div className="rounded-t mb-0 px-4 py-3 border-0 flex items-center justify-between">
          <h3 className="font-semibold text-lg text-blueGray-700">Mi perfil</h3>
          {saving && <span className="text-xs text-blueGray-400 animate-pulse">Guardando...</span>}
        </div>
        <div className="block w-full p-6">
          {loading ? (
            <p className="text-center py-6">Cargando...</p>
          ) : error ? (
            <p className="text-center py-6 text-red-500">{error}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Fila 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold mb-1" htmlFor="nombre">Nombre o razón social</label>
                  <input id="nombre" name="nombre" className="border p-2 rounded" value={form.nombre} onChange={handleChange} required />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold mb-1" htmlFor="email">Correo electrónico</label>
                  <input id="email" name="email" type="email" className="border p-2 rounded" value={form.email} onChange={handleChange} required />
                </div>
              </div>
              {/* Fila 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold mb-1" htmlFor="celular">Celular</label>
                  <input id="celular" name="celular" className="border p-2 rounded" value={form.celular || ''} onChange={handleChange} placeholder="Celular" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold mb-1" htmlFor="perfil">Perfil</label>
                  <input id="perfil" name="perfil" className="border p-2 rounded bg-gray-100 cursor-not-allowed" value={form.perfil} disabled />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold mb-1" htmlFor="estado">Estado</label>
                  <input id="estado" name="estado" className="border p-2 rounded bg-gray-100 cursor-not-allowed" value={form.estado} disabled />
                </div>
              </div>
              {/* Fila 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold mb-1" htmlFor="identificacion">Identificación</label>
                  <input id="identificacion" name="identificacion" className="border p-2 rounded" value={form.identificacion || ''} onChange={handleChange} placeholder="Identificación" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold mb-1" htmlFor="password">Nueva contraseña <span className="font-normal text-blueGray-400">(dejar en blanco si no desea cambiarla)</span></label>
                  <div className="flex items-stretch gap-2">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="border p-2 rounded w-full"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Nueva contraseña"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 text-xs bg-gray-200 rounded hover:bg-gray-300"
                      onClick={() => setShowPassword(s => !s)}
                    >{showPassword ? "Ocultar" : "Ver"}</button>
                    {form.password && (
                      <button
                        type="button"
                        className="px-3 py-2 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => setForm(prev => ({ ...prev, password: "" }))}
                      >Limpiar</button>
                    )}
                  </div>
                </div>
              </div>
              {mensaje && (
                <div className={`text-sm ${mensaje.includes("correctamente") ? "text-green-600" : "text-red-600"}`}>{mensaje}</div>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-2 rounded font-semibold text-white bg-lightBlue-600 hover:bg-lightBlue-700 transition ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
                >Guardar cambios</button>
              </div>
              <div className="text-xs text-blueGray-400 pt-2">
                Nota: El cambio de perfil o estado debe solicitarlo a un administrador.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

MiPerfil.layout = Admin;
