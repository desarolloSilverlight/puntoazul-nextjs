import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/config";

export default function DashboardAsociado() {
  const [formularioActual, setFormularioActual] = useState({
    estado: "",
    progreso: 0,
    seccionesCompletas: [],
    seccionesPendientes: []
  });
  
  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    productosReportados: 0,
    toneladasReportadas: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del usuario asociado
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const idUsuario = localStorage.getItem("id");
        
        if (!idUsuario) {
          setError("No se encontró ID de usuario");
          return;
        }

        // Obtener estado actual del formulario Literal B
        const formularioResponse = await fetch(`${API_BASE_URL}/informacion-b/getByIdUsuario/${idUsuario}`);
        
        let estadoActual = "Sin Iniciar";
        let progreso = 0;
        let seccionesCompletas = [];
        let seccionesPendientes = ["Información Básica", "Productos"];

        if (formularioResponse.ok) {
          const formularioData = await formularioResponse.json();
          estadoActual = formularioData.estado || "Iniciado";
          
          // Calcular progreso basado en las secciones completadas
          if (formularioData.nombre && formularioData.nit) {
            seccionesCompletas.push("Información Básica");
            progreso += 50;
          }
          
          // Verificar si tiene productos
          try {
            const productosResponse = await fetch(`${API_BASE_URL}/productos-b/getByIdInformacionB/${formularioData.idInformacionB}`);
            if (productosResponse.ok) {
              const productosData = await productosResponse.json();
              if (Array.isArray(productosData) && productosData.length > 0) {
                seccionesCompletas.push("Productos");
                progreso += 50;
                setEstadisticas(prev => ({
                  ...prev,
                  productosReportados: productosData.length,
                  toneladasReportadas: productosData.reduce((total, producto) => {
                    return total + (parseFloat(producto.totalPesoProducto) || 0);
                  }, 0)
                }));
              }
            }
          } catch (productosError) {
            console.log("No se pudieron cargar productos:", productosError);
          }
          
          seccionesPendientes = ["Información Básica", "Productos"].filter(
            seccion => !seccionesCompletas.includes(seccion)
          );
        }

        setFormularioActual({
          estado: estadoActual,
          progreso,
          seccionesCompletas,
          seccionesPendientes
        });

        // Simular historial (puedes crear una API específica para esto)
        setHistorial([
          { year: 2024, estado: estadoActual, fechaEntrega: estadoActual === "Aprobado" ? "2024-02-10" : null },
          { year: 2023, estado: "Aprobado", fechaEntrega: "2023-02-12" },
          { year: 2022, estado: "Aprobado", fechaEntrega: "2022-02-15" }
        ]);

      } catch (err) {
        setError(err.message);
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lightBlue-600 text-lg font-semibold animate-pulse">
          Cargando tu dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-lg">
          Error al cargar el dashboard: {error}
        </div>
      </div>
    );
  }

  // Configuración de colores según el estado
  const estadoConfig = {
    "Sin Iniciar": { color: "bg-gray-500", textColor: "text-gray-700", bgLight: "bg-gray-50" },
    "Iniciado": { color: "bg-blue-500", textColor: "text-blue-700", bgLight: "bg-blue-50" },
    "Guardado": { color: "bg-yellow-500", textColor: "text-yellow-700", bgLight: "bg-yellow-50" },
    "Pendiente": { color: "bg-orange-500", textColor: "text-orange-700", bgLight: "bg-orange-50" },
    "Aprobado": { color: "bg-green-500", textColor: "text-green-700", bgLight: "bg-green-50" },
    "Rechazado": { color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50" }
  };

  const config = estadoConfig[formularioActual.estado] || estadoConfig["Sin Iniciar"];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Card principal */}
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Mi Dashboard</h1>
          <p className="text-gray-600 text-lg">Estado de mi Formulario Literal B - Reporte Anual</p>
        </div>

        <div className="p-8">
          {/* Estado Principal del Formulario */}
          <div className={`${config.bgLight} border-l-4 ${config.color} rounded-lg p-6 mb-8`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Mi Formulario Literal B 2024</h2>
              <div className={`${config.color} text-white px-4 py-2 rounded-full text-sm font-semibold`}>
                {formularioActual.estado}
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">Progreso del formulario</span>
                <span className="text-gray-700 font-bold">{formularioActual.progreso}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`${config.color} h-4 rounded-full transition-all duration-500`}
                  style={{ width: `${formularioActual.progreso}%` }}
                ></div>
              </div>
            </div>

            {/* Estado de secciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">✅ Secciones Completadas</h4>
                {formularioActual.seccionesCompletas.length > 0 ? (
                  <ul className="space-y-2">
                    {formularioActual.seccionesCompletas.map((seccion, index) => (
                      <li key={index} className="flex items-center text-green-700">
                        <i className="fas fa-check-circle mr-2"></i>
                        {seccion}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">Ninguna sección completada aún</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">🔄 Secciones Pendientes</h4>
                {formularioActual.seccionesPendientes.length > 0 ? (
                  <ul className="space-y-2">
                    {formularioActual.seccionesPendientes.map((seccion, index) => (
                      <li key={index} className="flex items-center text-orange-600">
                        <i className="fas fa-clock mr-2"></i>
                        {seccion}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-600 font-medium">¡Todas las secciones completadas!</p>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-4">
              {formularioActual.estado !== "Aprobado" && (
                <a
                  href="/admin/literalb"
                  className="bg-lightBlue-600 text-white px-6 py-3 rounded-lg hover:bg-lightBlue-700 transition-colors duration-200 font-medium"
                >
                  <i className="fas fa-edit mr-2"></i>
                  {formularioActual.estado === "Sin Iniciar" ? "Iniciar Formulario" : "Continuar Formulario"}
                </a>
              )}
              
              {formularioActual.estado === "Aprobado" && (
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium">
                  <i className="fas fa-download mr-2"></i>
                  Descargar Certificado
                </button>
              )}
            </div>
          </div>

          {/* Grid de información adicional */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Historial de Reportes */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Historial de Reportes</h3>
              <div className="space-y-4">
                {historial.map((reporte) => (
                  <div key={reporte.year} className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-800">{reporte.year}</div>
                      {reporte.fechaEntrega && (
                        <div className="text-sm text-gray-500">Entregado: {reporte.fechaEntrega}</div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      reporte.estado === "Aprobado" ? "bg-green-100 text-green-800" :
                      reporte.estado === "Pendiente" ? "bg-orange-100 text-orange-800" :
                      reporte.estado === "Guardado" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {reporte.estado}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mis Estadísticas */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Mis Estadísticas 2024</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <i className="fas fa-pills text-blue-600 text-xl"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Productos Reportados</div>
                      <div className="text-sm text-gray-500">Medicamentos registrados</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {estadisticas.productosReportados}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <i className="fas fa-weight text-green-600 text-xl"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Toneladas Reportadas</div>
                      <div className="text-sm text-gray-500">Peso total de productos</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {estadisticas.toneladasReportadas.toFixed(1)} Ton
                  </div>
                </div>

                {/* Mensaje motivacional */}
                <div className="bg-lightBlue-50 border border-lightBlue-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start space-x-3">
                    <i className="fas fa-info-circle text-lightBlue-600 mt-0.5"></i>
                    <div>
                      <div className="font-medium text-lightBlue-800">¡Gracias por tu compromiso!</div>
                      <div className="text-sm text-lightBlue-600 mt-1">
                        Tu reporte contribuye al cumplimiento de la Resolución 371 de 2009 y al cuidado del medio ambiente.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
