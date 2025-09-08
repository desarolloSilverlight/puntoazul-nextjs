import React, { useState, useEffect } from "react";
import Admin from "layouts/Admin.js";
import { API_BASE_URL } from "../../utils/config";

const plantillaPorDefecto = {
  "linea_base": {
    asunto: "Formulario Línea Base - {NOMBRE}",
    cuerpo:
      "Estimado/a {NOMBRE},\n\nLe compartimos el acceso a la plataforma para diligenciar el Formulario Línea Base.\nLink: {LINK}\nUsuario: {EMAIL}\nContraseña: {PASSWORD}\n\nSaludos cordiales,\nEquipo Punto Azul",
  },
  "literal_b": {
    asunto: "Formulario Literal B - {NOMBRE}",
    cuerpo:
      "Estimado/a {NOMBRE},\n\nLe compartimos el acceso a la plataforma para diligenciar el Formulario Literal B.\nLink: {LINK}\nUsuario: {EMAIL}\nContraseña: {PASSWORD}\n\nSaludos cordiales,\nEquipo Punto Azul",
  },
};

export default function EnviarCorreos() {
  const [tipoFormulario, setTipoFormulario] = useState("linea_base");
  const [usuarios, setUsuarios] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [asunto, setAsunto] = useState(plantillaPorDefecto.linea_base.asunto);
  const [cuerpo, setCuerpo] = useState(plantillaPorDefecto.linea_base.cuerpo);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const platformLink = "https://gestionliterales.puntoazul.com.co/";

  // Convierte saltos de línea en <br> para correos HTML
  const toHtml = (text) => (text || "").replace(/\n/g, "<br/>");

  // Reemplaza variables en plantillas con datos del usuario
  const renderTemplate = (tpl, u) => {
    const password = u?.contraseña ?? u?.contrasena ?? u?.password ?? "";
    const looksHashed = typeof password === "string" && password.startsWith("$2") && password.length >= 55;
    const values = {
      "{NOMBRE}": u?.nombre || "",
      "{EMAIL}": u?.email || "",
      // Si parece hash (bcrypt), mantenemos el placeholder para que el backend lo reemplace por el password plano
      "{PASSWORD}": looksHashed ? "{PASSWORD}" : password,
      "{LINK}": platformLink,
      "{FORMULARIO}": tipoFormulario === "linea_base" ? "Línea Base" : "Literal B",
    };
    return Object.entries(values).reduce((acc, [k, v]) => acc.split(k).join(v), tpl || "");
  };

  // Cargar usuarios según tipo de formulario
  useEffect(() => {
    setLoading(true);
    setSeleccionados([]);
    setAsunto(plantillaPorDefecto[tipoFormulario].asunto);
    setCuerpo(plantillaPorDefecto[tipoFormulario].cuerpo);
    let perfil = tipoFormulario === "linea_base" ? "Vinculado" : "Asociado";
    fetch(`${API_BASE_URL}/users/perfilUser?nombrePerfil=${perfil}`)
      .then(res => res.json())
        .then(data => {
          console.log("Usuarios recibidos en correos.js:", data);
          setUsuarios(data);
          setLoading(false);
        })
      .catch(() => setLoading(false));
  }, [tipoFormulario]);

  // Seleccionar/deseleccionar todos
  const handleSelectTodos = (e) => {
    if (e.target.checked) {
      setSeleccionados(usuarios.map(u => u.idUsuario));
    } else {
      setSeleccionados([]);
    }
  };

  // Seleccionar individual
  const handleSelectUsuario = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Enviar correos
  const handleEnviar = async () => {
    setEnviando(true);
    setMensaje("");
    // Obtener usuarios seleccionados
    const usuariosSeleccionados = usuarios.filter(u => seleccionados.includes(u.idUsuario));
    if (usuariosSeleccionados.length === 0) {
      setMensaje("Debes seleccionar al menos un destinatario.");
      setEnviando(false);
      return;
    }
    // Armar mensajes personalizados
    const mensajes = usuariosSeleccionados.map(u => {
      const asuntoFinal = renderTemplate(asunto, u);
      const cuerpoTexto = renderTemplate(cuerpo, u);
      const cuerpoHtml = toHtml(cuerpoTexto);
      const pass = u?.contraseña ?? u?.contrasena ?? u?.password ?? "";
      const requiereInyeccionPassword = typeof pass === "string" && pass.startsWith("$2") && pass.length >= 55;
      return {
        destinatario: u.email,
        asunto: asuntoFinal,
        cuerpo: cuerpoTexto,
        cuerpoHtml, // para preservar saltos si el backend envía HTML
        idUsuario: u.idUsuario,
        tipoFormulario,
        requiereInyeccionPassword,
      };
    });
    // Enviar al backend
    try {
      const modulo = tipoFormulario === "linea_base" ? "informacion-f" : "informacion-b";
      const urlEnvio = `${API_BASE_URL}/${modulo}/enviarCorreo`;
      console.log("Enviando correos a:", urlEnvio);
      const resp = await fetch(urlEnvio, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes, enviarComoHtml: true, incluirPasswordPlano: true })
      });
      if (resp.ok) {
        setMensaje("Correos enviados correctamente.");
        setSeleccionados([]);
      } else {
        setMensaje("Error al enviar correos.");
      }
    } catch {
      setMensaje("Error de red al enviar correos.");
    }
    setEnviando(false);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Enviar Formulario</h2>
      <div className="mb-4">
        <label className="block font-semibold mb-2">Tipo de formulario:</label>
        <select
          className="border p-2 rounded w-full"
          value={tipoFormulario}
          onChange={e => setTipoFormulario(e.target.value)}
        >
          <option value="linea_base">Línea Base (Vinculados)</option>
          <option value="literal_b">Literal B (Asociados)</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-2">Destinatarios:</label>
        {loading ? (
          <div className="p-2 text-gray-500">Cargando usuarios...</div>
        ) : (
          <div className="border rounded p-2 max-h-64 overflow-y-auto">
            <div className="mb-2">
              <label>
                <input
                  type="checkbox"
                  checked={seleccionados.length === usuarios.length && usuarios.length > 0}
                  onChange={handleSelectTodos}
                /> Seleccionar todos
              </label>
            </div>
            {usuarios.map(u => (
              <div key={u.idUsuario} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(u.idUsuario)}
                  onChange={() => handleSelectUsuario(u.idUsuario)}
                />
                <span className="ml-2 text-sm">{u.nombre} ({u.email})</span>
              </div>
            ))}
            {usuarios.length === 0 && (
              <div className="text-gray-500">No hay usuarios para mostrar.</div>
            )}
          </div>
        )}
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-2">Asunto:</label>
        <input
          className="border p-2 rounded w-full"
          value={asunto}
          onChange={e => setAsunto(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Variables disponibles: {"{NOMBRE}"}, {"{EMAIL}"}</p>
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-2">Cuerpo del correo:</label>
        <textarea
          className="border p-2 rounded w-full min-h-[120px]"
          value={cuerpo}
          onChange={e => setCuerpo(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Variables disponibles: {"{NOMBRE}"}, {"{EMAIL}"}, {"{PASSWORD}"}, {"{LINK}"}, {"{FORMULARIO}"}</p>
      </div>
      <div className="mb-4 border rounded p-3 bg-gray-50">
        <div className="font-semibold mb-1">Vista previa</div>
        {(() => {
          const ejemplo = { nombre: "Nombre Ejemplo", email: "correo@ejemplo.com", contraseña: "123456" };
          const usuarioPreview = usuarios.find(u => seleccionados.includes(u.idUsuario)) || ejemplo;
          return (
            <div className="text-sm">
              <div className="mb-1"><span className="font-semibold">Asunto:</span> {renderTemplate(asunto, usuarioPreview)}</div>
              <div className="whitespace-pre-wrap"><span className="font-semibold">Cuerpo:</span>{"\n"}{renderTemplate(cuerpo, usuarioPreview)}</div>
            </div>
          );
        })()}
      </div>
      {mensaje && (
        <div className={`mb-4 text-sm ${mensaje.includes("correctamente") ? "text-green-600" : "text-red-600"}`}>{mensaje}</div>
      )}
      <button
        className={`bg-lightBlue-600 text-white px-6 py-2 rounded font-semibold ${enviando ? "opacity-50 cursor-not-allowed" : "hover:bg-lightBlue-700"}`}
        onClick={handleEnviar}
        disabled={enviando}
      >
        {enviando ? "Enviando..." : "Enviar"}
      </button>
    </div>
  );
}

EnviarCorreos.layout = Admin;
