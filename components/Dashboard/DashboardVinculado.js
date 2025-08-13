import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/config";

export default function DashboardVinculado() {
  const [estadoFormulario, setEstadoFormulario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEstadoFormulario = async () => {
      try {
        setLoading(true);
        const idUsuario = localStorage.getItem("id");
        
        if (!idUsuario) {
          setEstadoFormulario("sin_formulario");
          return;
        }

        // Verificar si existe formulario de línea base para este usuario
        const response = await fetch(`${API_BASE_URL}/informacion-f/getByIdUsuario/${idUsuario}`);
        
        if (response.status === 404) {
          // No existe formulario
          setEstadoFormulario("sin_formulario");
        } else if (response.ok) {
          const data = await response.json();
          const estado = data.estado?.toLowerCase() || "guardado";
          setEstadoFormulario(estado);
        } else {
          throw new Error("Error al consultar el formulario de línea base");
        }

      } catch (err) {
        setError(err.message);
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEstadoFormulario();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lightBlue-600 text-lg font-semibold animate-pulse">
          Cargando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  // Configuraciones de mensajes según el estado
  const configuracionesMensajes = {
    sin_formulario: {
      icono: "📊",
      titulo: "¡Bienvenido!",
      mensaje: "Aún no has creado tu formulario de Línea Base para este año. Te ayudamos a comenzar de manera fácil y rápida.",
      color: "blue",
      botonTexto: "Crear mi línea base",
      botonIcono: "fas fa-plus"
    },
    guardado: {
      icono: "💾",
      titulo: "Línea Base en progreso",
      mensaje: "Has guardado tu formulario de línea base pero aún no lo has enviado para revisión. Puedes continuar editándolo cuando quieras.",
      color: "yellow",
      botonTexto: "Continuar editando",
      botonIcono: "fas fa-edit"
    },
    pendiente: {
      icono: "⏳",
      titulo: "Línea Base en revisión",
      mensaje: "Tu formulario de línea base ha sido enviado y está siendo revisado por nuestro equipo. Te notificaremos cuando tengamos una respuesta.",
      color: "orange",
      botonTexto: "Ver mi línea base",
      botonIcono: "fas fa-eye"
    },
    aprobado: {
      icono: "✅",
      titulo: "¡Línea Base aprobada!",
      mensaje: "Felicitaciones, tu formulario de línea base ha sido aprobado. Ya puedes cargar tu pdf firmado.",
      color: "green",
      botonTexto: "Ver línea base aprobada",
      botonIcono: "fas fa-eye"
    },
    rechazado: {
      icono: "❌",
      titulo: "Línea Base requiere correcciones",
      mensaje: "Tu formulario de línea base necesita algunas correcciones. Revisa los comentarios enviados en el correo y realiza los ajustes necesarios.",
      color: "red",
      botonTexto: "Hacer correcciones",
      botonIcono: "fas fa-edit"
    },
    finalizado: {
      icono: "🎉",
      titulo: "¡Proceso completado!",
      mensaje: "Has completado exitosamente el proceso. Tu formulario de línea base está finalizado y archivado.",
      color: "green",
      botonTexto: "Ver línea base final",
      botonIcono: "fas fa-check-circle"
    }
  };

  const config = configuracionesMensajes[estadoFormulario] || configuracionesMensajes.sin_formulario;

  // Mapeo de colores a clases de Tailwind
  const colores = {
    blue: {
      bg: "bg-lightBlue-100",
      border: "border-lightBlue-200",
      text: "text-lightBlue-600",
      button: "bg-lightBlue-600 hover:bg-lightBlue-700",
      accent: "text-lightBlue-400"
    },
    yellow: {
      bg: "bg-orange-200",
      border: "border-orange-200", 
      text: "text-orange-500",
      button: "bg-orange-200 hover:bg-orange-500",
      accent: "text-orange-500"
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800", 
      button: "bg-orange-600 hover:bg-orange-700",
      accent: "text-orange-600"
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      button: "bg-green-600 hover:bg-green-700", 
      accent: "text-green-600"
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      button: "bg-red-600 hover:bg-red-700",
      accent: "text-red-600"
    }
  };

  const colorActual = colores[config.color];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Mensaje principal centrado */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-6">{config.icono}</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{config.titulo}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {config.mensaje}
          </p>
        </div>

        {/* Card con información del formulario */}
        <div className={`${colorActual.bg} ${colorActual.border} border rounded-xl p-8 mb-8`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-xl font-semibold ${colorActual.text}`}>
                Formulario Línea Base - Año 2025
              </h2>
              <p className="text-gray-600 mt-1">
                Reporte de línea base de medicamentos y dispositivos médicos
              </p>
            </div>
            <div className={`${colorActual.accent} text-2xl`}>
              <i className="fas fa-chart-line"></i>
            </div>
          </div>

          {/* Botón de acción principal */}
          <div className="flex justify-center">
            <a
              href="/admin/literalf"
              className={`${colorActual.button} text-white px-8 py-4 rounded-lg font-medium transition-colors duration-200 inline-flex items-center space-x-2 text-lg`}
            >
              <i className={config.botonIcono}></i>
              <span>{config.botonTexto}</span>
            </a>
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información sobre el proceso */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <i className="fas fa-info-circle text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Sobre la línea base
              </h3>
            </div>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <i className="fas fa-check text-green-500 mr-2 mt-0.5"></i>
                <span>Establecimiento de línea base inicial</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-green-500 mr-2 mt-0.5"></i>
                <span>Proceso 100% digital</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-green-500 mr-2 mt-0.5"></i>
                <span>Soporte técnico disponible</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check text-green-500 mr-2 mt-0.5"></i>
                <span>Seguimiento personalizado</span>
              </li>
            </ul>
          </div>

          {/* Soporte y ayuda */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <i className="fas fa-headset text-purple-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                ¿Necesitas ayuda?
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <i className="fas fa-envelope mr-3 text-gray-400"></i>
                <span>soporte@puntoazul.com.co</span>
              </div>
              <div className="flex items-center text-gray-600">
                <i className="fas fa-phone mr-3 text-gray-400"></i>
                <span>+57 123456</span>
              </div>
              <div className="flex items-center text-gray-600">
                <i className="fas fa-clock mr-3 text-gray-400"></i>
                <span>Lunes a viernes, 8:00 AM - 5:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
