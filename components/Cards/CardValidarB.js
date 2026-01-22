import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import InformacionB from "../Forms/InformacionB";
import ProductosB from "../Forms/ProductosB";
import { API_BASE_URL } from "../../utils/config";

export default function CardValidarB({ productos: propsProductos, goBack, fetchUsuarios }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("resumen");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  // Acción interna del email (APROBAR | RECHAZAR_FONDO | RECHAZAR_FORMA)
  const [emailAction, setEmailAction] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [productos, setProductos] = useState(propsProductos || []);
  const [grupoFormula, setGrupoFormula] = useState("Calculando...");
  const [informacionB, setInformacionB] = useState(null);

  // Función para obtener usuarios pendientes de validación
  const fetchUsuariosInternal = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-b/getValidarB`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Usuarios pendientes de validación:", data);
      console.log("Estructura del primer usuario:", data[0]);
      setUsuarios(data);
      
      // Si no hay props de productos, mostrar lista de usuarios
      if (!propsProductos) {
        setProductos([]);
        setSelectedUsuario(null);
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener productos de un usuario específico
  const handleUsuarioClick = async (usuario) => {
    console.log("Usuario seleccionado:", usuario);
    console.log("ID a usar para productos:", usuario.informacionB_idInformacionB);
    console.log("ID a usar para información:", usuario.informacionB_idInformacionB);
    console.log("Año reporte del usuario:", usuario.informacionB_anoReporte);
    setLoading(true);
    try {
      // Obtener productos - enviar año para que el backend busque históricos dinámicamente
      const anoReporte = usuario.informacionB_anoReporte || new Date().getFullYear();
      const responseProductos = await fetch(`${API_BASE_URL}/informacion-b/getProdValidarB/${usuario.informacionB_idInformacionB}?anoReporte=${anoReporte}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!responseProductos.ok) {
        console.error(`Error en la respuesta de productos: ${responseProductos.status} - ${responseProductos.statusText}`);
        throw new Error(`Error ${responseProductos.status}: ${responseProductos.statusText}`);
      }

      const productosData = await responseProductos.json();
      console.log("Productos obtenidos:", productosData);

      // Obtener información completa de informacionB
      const responseInformacion = await fetch(`${API_BASE_URL}/informacion-b/getInformacion/${usuario.informacionB_idInformacionB}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!responseInformacion.ok) {
        console.error(`Error en la respuesta de información: ${responseInformacion.status} - ${responseInformacion.statusText}`);
        throw new Error(`Error ${responseInformacion.status}: ${responseInformacion.statusText}`);
      }

      const informacionData = await responseInformacion.json();
      console.log("Información B obtenida:", informacionData);

      setProductos(productosData);
      setInformacionB(informacionData);
      setSelectedUsuario(usuario);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      alert(`Error al obtener datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calcula los totales sumando todos los productos (solo si hay productos)
  const resumen = productos && productos.length > 0 ? productos.reduce(
    (acc, producto) => ({
      pesoEmpaqueComercialRX: (acc.pesoEmpaqueComercialRX || 0) + (Number(producto.pesoEmpaqueComercialRX) || 0),
      pesoTotalComercialRX: (acc.pesoTotalComercialRX || 0) + (Number(producto.pesoTotalComercialRX) || 0),
      pesoEmpaqueComercialOTC: (acc.pesoEmpaqueComercialOTC || 0) + (Number(producto.pesoEmpaqueComercialOTC) || 0),
      pesoTotalComercialOTC: (acc.pesoTotalComercialOTC || 0) + (Number(producto.pesoTotalComercialOTC) || 0),
      pesoEmpaqueInstitucional: (acc.pesoEmpaqueInstitucional || 0) + (Number(producto.pesoEmpaqueInstitucional) || 0),
      pesoTotalInstitucional: (acc.pesoTotalInstitucional || 0) + (Number(producto.pesoTotalInstitucional) || 0),
      pesoEmpaqueIntrahospitalario: (acc.pesoEmpaqueIntrahospitalario || 0) + (Number(producto.pesoEmpaqueIntrahospitalario) || 0),
      pesoTotalIntrahospitalario: (acc.pesoTotalIntrahospitalario || 0) + (Number(producto.pesoTotalIntrahospitalario) || 0),
      pesoEmpaqueMuestrasMedicas: (acc.pesoEmpaqueMuestrasMedicas || 0) + (Number(producto.pesoEmpaqueMuestrasMedicas) || 0),
      pesoTotalMuestrasMedicas: (acc.pesoTotalMuestrasMedicas || 0) + (Number(producto.pesoTotalMuestrasMedicas) || 0),
      totalPesoEmpaques: (acc.totalPesoEmpaques || 0) + (Number(producto.totalPesoEmpaques) || 0),
      totalPesoProducto: (acc.totalPesoProducto || 0) + (Number(producto.totalPesoProducto) || 0),
    }),
    {}
  ) : {};

  // Calcula el campo especial de la fórmula
  const totalFormula = productos && productos.length > 0 ? (
    ((Number(resumen.pesoTotalComercialRX) || 0) +
    (Number(resumen.pesoTotalComercialOTC) || 0) +
    ((Number(resumen.pesoTotalInstitucional) || 0) / 2) +
    (Number(resumen.pesoTotalMuestrasMedicas) || 0))
  ).toFixed(2) : "0.00";

  // Busca el histórico correspondiente a cada año basándose en el anoReporte de informacionB
  const anoReporteActual = informacionB?.anoReporte ? parseInt(informacionB.anoReporte) : null;
  const year1 = anoReporteActual ? anoReporteActual - 1 : null;
  const year2 = anoReporteActual ? anoReporteActual - 2 : null;
  
  // Debug: Ver qué contiene el histórico
  console.log("=== DEBUG HISTÓRICO ===");
  console.log("Año actual (anoReporte):", anoReporteActual);
  console.log("Year1 (año-1):", year1);
  console.log("Year2 (año-2):", year2);
  console.log("Array histórico completo:", productos && productos.length > 0 ? productos[0]?.historico : "No hay productos");
  
  // Buscar por campo 'anoReporte' que contiene el año de los datos reportados
  const historicoYear1 = productos && productos.length > 0 && year1 ? 
    productos[0]?.historico?.find(h => {
      const hAnoReporte = h.anoReporte?.toString();
      const buscado = year1.toString();
      console.log(`Comparando histórico anoReporte="${hAnoReporte}" con buscado="${buscado}" -> match: ${hAnoReporte === buscado}`);
      return hAnoReporte === buscado;
    }) : null;
    
  const historicoYear2 = productos && productos.length > 0 && year2 ? 
    productos[0]?.historico?.find(h => h.anoReporte?.toString() === year2.toString()) : null;
  
  console.log("historicoYear1 encontrado:", historicoYear1);
  console.log("historicoYear2 encontrado:", historicoYear2);
  console.log("=== FIN DEBUG HISTÓRICO ===");

  // Fetch del parámetro y cálculo del grupo según el rango
  useEffect(() => {
    const fetchParametro = async () => {
      try {
        // Obtener todos los parámetros y buscar "Rango Toneladas Literal B"
        const response = await fetch(`${API_BASE_URL}/parametros`);
        if (!response.ok) throw new Error("No se pudo obtener los parámetros");
        const parametros = await response.json();
        const param = parametros.find(p => p.nombre === 'Rango Toneladas Literal B');
        
        if (!param) {
          console.error("No se encontró el parámetro 'Rango Toneladas Literal B'");
          setGrupoFormula("Sin grupo");
          return;
        }
        
        const json = JSON.parse(param.valor);
        const rangos = json.data || [];
        
        console.log("=== DEBUG GRUPO ===");
        console.log("Total Formula (KG):", totalFormula);
        console.log("Parámetro completo:", param);
        console.log("Rangos encontrados:", rangos);
        
        // Usar totalFormula directamente (en KG) sin conversión
        const valorFormula = Number(totalFormula);
        console.log("Valor a comparar (KG):", valorFormula);
        
        // Procesar rangos y buscar el correcto
        const rangosProcesados = rangos.map(r => ({
          grupo: (r.grupo ?? r.Grupo ?? '').toString(),
          min: parseFloat(r.rango_ini ?? r.rangoini ?? r.RangoIni ?? 0),
          max: parseFloat(r.rango_fin ?? r.rangofin ?? r.RangoFin ?? 0),
          original: r
        }));
        
        console.log("Rangos procesados:", rangosProcesados);
        
        // Buscar el rango que contiene el valor
        const rangoEncontrado = rangosProcesados.find(r => {
          const estaEnRango = valorFormula >= r.min && valorFormula <= r.max;
          console.log(`Grupo ${r.grupo}: min=${r.min}, max=${r.max}, esta en rango=${estaEnRango}`);
          return estaEnRango;
        });
        
        if (rangoEncontrado) {
          setGrupoFormula(`Grupo ${rangoEncontrado.grupo}`);
          console.log(`✓ Grupo encontrado: Grupo ${rangoEncontrado.grupo} para ${valorFormula} KG`);
        } else {
          console.warn(`✗ No se encontró grupo para ${valorFormula} KG`);
          setGrupoFormula("Sin grupo");
        }
        console.log("=== FIN DEBUG GRUPO ===");
      } catch (e) {
        console.error("Error al calcular el grupo:", e);
        setGrupoFormula("Sin grupo");
      }
    };
    if (totalFormula && !isNaN(totalFormula) && productos && productos.length > 0) fetchParametro();
  }, [totalFormula, productos]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (!propsProductos) {
      fetchUsuariosInternal();
    }
  }, [propsProductos]);

  // Determina la tendencia basada en los grupos de los años
  let tendencia = "SE MANTIENE";
  if (grupoFormula !== "Sin grupo" && historicoYear1?.grupo) {
    const grupoActual = Number((grupoFormula.match(/\d+/) || [])[0]);
    const grupoAnterior = Number((historicoYear1.grupo.match(/\d+/) || [])[0]);
    if (!isNaN(grupoActual) && !isNaN(grupoAnterior)) {
      if (grupoActual > grupoAnterior) {
        tendencia = "SUBE GRUPO";
      } else if (grupoActual < grupoAnterior) {
        tendencia = "BAJA GRUPO";
      }
    }
  }

  // Si no hay props de productos y no se ha seleccionado usuario, mostrar lista
  if (!propsProductos && !selectedUsuario) {
    return (
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full px-4 max-w-full flex-grow flex-1">
              <h3 className="font-semibold text-lg text-blueGray-700">
                Usuarios Pendientes de Validación
              </h3>
            </div>
          </div>
        </div>
        <div className="block w-full overflow-x-auto">
          {loading ? (
            <div className="p-4 text-center">Cargando...</div>
          ) : usuarios.length === 0 ? (
            <div className="p-4 text-center">No hay usuarios pendientes de validación.</div>
          ) : (
            <table className="items-center w-full bg-transparent border-collapse">
              <thead>
                <tr>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                    Nombre
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                    Correo
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                    Año Reporte
                  </th>
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                    Cantidad Productos
                  </th>
                  
                  <th className="px-6 align-middle border border-solid py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario, index) => (
                  <tr key={index}>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {usuario.informacionB_nombre}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      {usuario.informacionB_correoFacturacion}
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {usuario.informacionB_anoReporte || 'N/A'}
                      </span>
                    </td>
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                        {usuario.productosCount}
                      </span>
                    </td>
                    
                    <td className="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                      <button
                        className="bg-lightBlue-500 text-white active:bg-lightBlue-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                        onClick={() => handleUsuarioClick(usuario)}
                      >
                        Validar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  if (!productos || productos.length === 0) {
    return (
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
        <div className="p-4 text-center">
          {selectedUsuario && (
            <button
              className="bg-blueGray-500 text-white px-4 py-2 rounded mb-4"
              onClick={() => {
                setSelectedUsuario(null);
                setProductos([]);
                setInformacionB(null);
              }}
            >
              ← Volver a la lista
            </button>
          )}
          No hay datos disponibles para validar.
        </div>
      </div>
    );
  }

  // Función para generar plantillas de email según acción y tendencia
  const generarPlantillaEmail = (accion, tendencia, nombreCliente) => {
    const plantillas = {
      "APROBAR": {
        "SE MANTIENE": {
          asunto: `APROBADO - Formulario Validado`,
          cuerpo: `Estimado/a ${nombreCliente},

Agradecemos el envío oportuno del Literal B, su compromiso nos ayuda a continuar cumpliendo al 100% con la Resolución 371 de 2009.

Le confirmamos que realizando todas las validaciones evidenciamos que el formato está diligenciado de forma CORRECTA, y pueden proceder con la respectiva firma del Representante Legal.

Finalmente, nos permitimos recordarle que la información reportada en el Literal B firmado, no podrá ser modificada. Esta será enviada en el Informe Anual de la autoridad el día 17 de febrero de 2025 y utilizada para la definición de la cuota de sostenimiento.

Agradecemos de antemano su atención y quedamos atentos a su respuesta.

Cordialmente, Punto Azul`
        },
        "SUBE GRUPO": {
          asunto: `APROBADO - Formulario Validado`,
          cuerpo: `Estimado/a ${nombreCliente},

Un gusto saludarle,

Agradecemos el envío oportuno del Literal B, su compromiso nos ayuda a continuar cumpliendo al 100% con la Resolución 371 de 2009. 

Realizando todas las validaciones evidenciamos que se percibe un cambio en comparación con las cantidades reportadas el año anterior, razón por la cual solicitamos su confirmación sobre la información allí registrada.

Finalmente, nos permitimos recordarles que la información reportada en el Literal B firmado, no podrá ser modificada. Esta será enviada en el Informe Anual de la autoridad el día 17 de febrero de 2025 y utilizada para la definición de la cuota de sostenimiento. 

Agradecemos de antemano su atención y quedamos atentos a su respuesta.

Cordialmente, Punto Azul`
        },
        "BAJA GRUPO": {
          asunto: `APROBADO - Formulario Validado`,
          cuerpo: `Estimado/a ${nombreCliente},

Un gusto saludarle,

Agradecemos el envío oportuno del Literal B, su compromiso nos ayuda a continuar cumpliendo al 100% con la Resolución 371 de 2009.
 
Realizando todas las validaciones evidenciamos que se percibe un cambio significativo en comparación con las cantidades reportadas el año anterior, razón por la cual solicitamos su confirmación sobre la información allí registrada.

Es importante recordar que la información reportada por ustedes es validada por la Autoridad Nacional de Licencias Ambientales- ANLA en función a su responsabilidad de ser garante del cumplimiento normativo ambiental de las empresas. Asimismo deseamos informar que de acuerdo a las comunicaciones con la Autoridad nos han indicado se está realizando el cruce de información con las entidades que se encargan de vigilancia y control de las normas sanitarias como el Invima.  Por eso es de nuestro interés invitarlos a validar de manera integral la información para mitigar algún posible riesgo de acuerdo a los establecido en el marco sancionatorio ambiental.

Finalmente, es importante  tener en cuenta que la información reportada en el Literal B firmado, no podrá ser modificada. Esta será enviada en el Informe Anual de la autoridad el día 17 de febrero de 2025 y utilizada para la definición de la cuota de sostenimiento. 

Agradecemos de antemano su atención y quedamos atentos a su respuesta.

Cordialmente, 

Punto Azul`
        }
      },
      "RECHAZAR_FONDO": {
        "SE MANTIENE": {
          asunto: `Literal B requiere correcciones.`,
          cuerpo: `Estimado/a ${nombreCliente},

Su formulario del Literal B ha sido RECHAZADO por errores de fondo que requieren corrección.

RESULTADO DE LA VALIDACIÓN:
- Estado: RECHAZADO POR ERRORES DE FONDO
- Tendencia calculada: SE MANTIENE
- Se requieren correcciones en el contenido de la información

ACCIONES REQUERIDAS:
- Revise y corrija los errores de fondo señalados
- Verifique la exactitud de los datos proporcionados
- Vuelva a enviar el formulario una vez realizadas las correcciones

Por favor, contacte a nuestro equipo si necesita asistencia adicional.

Saludos cordiales,
Equipo de Validación Punto Azul`
        },
        "SUBE GRUPO": {
          asunto: `Literal B requiere correcciones.`,
          cuerpo: `Estimado/a ${nombreCliente},

Un gusto saludarle,

Agradecemos el envío oportuno del Literal B, su compromiso nos ayuda a continuar cumpliendo al 100% con la Resolución 371 de 2009.
 
Realizando todas las validaciones evidenciamos que se percibe un cambio en comparación con las cantidades reportadas el año anterior, razón por la cual solicitamos su confirmación sobre la información allí registrada.

Adicionalmente encontramos novedades que requieren ajustes relevantes en el formato diligenciado (Remitirse al listado de errores de fondo- Colocar  en paréntesis  de forma continua).

Finalmente, nos permitimos recordarles que la información reportada en el Literal B firmado, no podrá ser modificada. Esta será enviada en el Informe Anual de la autoridad el día 17 de febrero de 2025 y utilizada para la definición de la cuota de sostenimiento. 

Agradecemos de antemano su atención y quedamos atentos a su respuesta.

Cordialmente, Punto Azul`
        },
        "BAJA GRUPO": {
          asunto: `Literal B requiere correcciones.`,
          cuerpo: `Estimado/a ${nombreCliente},

Un gusto saludarle,

Agradecemos el envío oportuno del Literal B, su compromiso nos ayuda a continuar cumpliendo al 100% con la Resolución 371 de 2009. 

Realizando todas las validaciones evidenciamos que se percibe un cambio significativo en comparación con las cantidades reportadas el año anterior, razón por la cual solicitamos su confirmación sobre la información allí registrada.

Es importante recordar que la información reportada por ustedes es validada por la Autoridad Nacional de Licencias Ambientales- ANLA en función a su responsabilidad de ser garante del cumplimiento normativo ambiental de las empresas. Asimismo deseamos informar que de acuerdo a las comunicaciones con la Autoridad nos han indicado se está realizando el cruce de información con las entidades que se encargan de vigilancia y control de las normas sanitarias como el Invima.  Por eso es de nuestro interés invitarlos a validar de manera integral la información para mitigar algún posible riesgo de acuerdo a los establecido en el marco sancionatorio ambiental.

Adicionalmente encontramos novedades que requieren ajustes relevantes en el formato diligenciado:

-
-
-

Finalmente, es importante  tener en cuenta que la información reportada en el Literal B firmado, no podrá ser modificada. Esta será enviada en el Informe Anual de la autoridad el día 17 de febrero de 2025 y utilizada para la definición de la cuota de sostenimiento. 

Agradecemos de antemano su atención y quedamos atentos a su respuesta.

Cordialmente, Punto Azul`
        }
      },
      "RECHAZAR_FORMA": {
        "SE MANTIENE": {
          asunto: `Literal B requiere correcciones.`,
          cuerpo: `Estimado/a ${nombreCliente},

Su formulario del Literal B ha sido RECHAZADO por errores de forma que requieren corrección.

RESULTADO DE LA VALIDACIÓN:
- Estado: RECHAZADO POR ERRORES DE FORMA
- Tendencia calculada: SE MANTIENE
- Se requieren correcciones en el formato y presentación

ACCIONES REQUERIDAS:
- Revise el formato y la presentación de los datos
- Corrija errores de formato, estructura o completitud
- Asegúrese de que todos los campos estén correctamente diligenciados
- Vuelva a enviar el formulario una vez realizadas las correcciones

Por favor, contacte a nuestro equipo si necesita asistencia adicional.

Saludos cordiales,
Equipo de Validación Punto Azul`
        },
        "SUBE GRUPO": {
          asunto: `Literal B requiere correcciones.`,
          cuerpo: `Estimado/a ${nombreCliente},

Un gusto saludarle,

Agradecemos el envío oportuno del Literal B, su compromiso nos ayuda a continuar cumpliendo al 100% con la Resolución 371 de 2009. 

Realizando todas las validaciones evidenciamos que se percibe un cambio en comparación con las cantidades reportadas el año anterior, razón por la cual solicitamos su confirmación sobre la información allí registrada.

Adicionalmente encontramos unas novedades que requieren ajustes menores en el formato diligenciado ( Remitirse al listado de errores de forma- Colocar  en paréntesis  de forma continua).

-
-
-
-

Finalmente, nos permitimos recordarles que la información reportada en el Literal B firmado, no podrá ser modificada. Esta será enviada en el Informe Anual de la autoridad el día 17 de febrero de 2025 y utilizada para la definición de la cuota de sostenimiento. 

Agradecemos de antemano su atención y quedamos atentos a su respuesta.

Cordialmente, 
Punto Azul`
        },
        "BAJA GRUPO": {
          asunto: `Literal B requiere correcciones.`,
          cuerpo: `Estimado/a ${nombreCliente},

Un gusto saludarle,

Agradecemos el envío oportuno del Literal B, su compromiso nos ayuda a continuar cumpliendo al 100% con la Resolución 371 de 2009. 

Realizando todas las validaciones evidenciamos que se percibe un cambio significativo en comparación con las cantidades reportadas el año anterior, razón por la cual solicitamos su confirmación sobre la información allí registrada.

Es importante recordar que la información reportada por ustedes es validada por la Autoridad Nacional de Licencias Ambientales- ANLA en función a su responsabilidad de ser garante del cumplimiento normativo ambiental de las empresas. Asimismo deseamos informar que de acuerdo a las comunicaciones con la Autoridad nos han indicado se está realizando el cruce de información con las entidades que se encargan de vigilancia y control de las normas sanitarias como el Invima.  Por eso es de nuestro interés invitarlos a validar de manera integral la información para mitigar algún posible riesgo de acuerdo a los establecido en el marco sancionatorio ambiental.

Adicionalmente encontramos novedades que requieren ajustes relevantes en el formato diligenciado:

-
-
-

Finalmente, es importante  tener en cuenta que la información reportada en el Literal B firmado, no podrá ser modificada. Esta será enviada en el Informe Anual de la autoridad el día 17 de febrero de 2025 y utilizada para la definición de la cuota de sostenimiento. 

Agradecemos de antemano su atención y quedamos atentos a su respuesta.

Cordialmente, 
Punto Azul`
        }
      }
    };

    return plantillas[accion]?.[tendencia] || {
      asunto: `Vista previa - ${tendencia}`,
      cuerpo: `Estimado/a ${nombreCliente},\n\nEsta es una vista previa del correo.\n\nTendencia: ${tendencia}\n\nSaludos cordiales,\nEquipo Punto Azul`
    };
  };

  // Función para manejar la acción de aprobar
  const handleAprobar = () => {
    const informacionB = productos[0].idInformacionB;
    const plantilla = generarPlantillaEmail("APROBAR", tendencia, informacionB.nombre || "Cliente");
    setEmailSubject(plantilla.asunto);
    setEmailBody(plantilla.cuerpo);
    setEmailAction("APROBAR");
    setShowEmailModal(true);
  };

  // Función para manejar la acción de rechazar por fondo
  const handleRechazarFondo = () => {
    const informacionB = productos[0].idInformacionB;
    const plantilla = generarPlantillaEmail("RECHAZAR_FONDO", tendencia, informacionB.nombre || "Cliente");
    setEmailSubject(plantilla.asunto);
    setEmailBody(plantilla.cuerpo);
    setEmailAction("RECHAZAR_FONDO");
    setShowEmailModal(true);
  };

  // Función para manejar la acción de rechazar por forma
  const handleRechazarForma = () => {
    const informacionB = productos[0].idInformacionB;
    const plantilla = generarPlantillaEmail("RECHAZAR_FORMA", tendencia, informacionB.nombre || "Cliente");
    setEmailSubject(plantilla.asunto);
    setEmailBody(plantilla.cuerpo);
    setEmailAction("RECHAZAR_FORMA");
    setShowEmailModal(true);
  };

  // Función para ver el email
  const handleVerEmail = () => {
    const informacionB = productos[0].idInformacionB;
    const plantilla = generarPlantillaEmail("VISTA_PREVIA", tendencia, informacionB.nombre || "Cliente");
    setEmailSubject(`Vista previa - ${tendencia}`);
    setEmailBody(`Estimado/a ${informacionB.nombre || "Cliente"},

Esta es una vista previa del correo que se enviará.

Tendencia: ${tendencia}

Saludos cordiales,
Equipo Punto Azul`);
    setShowEmailModal(true);
  };

  // Función para enviar el correo
  const handleEnviarEmail = async () => {
    console.log(productos[0])
    const idInformacionB = productos[0].idInformacionB.idInformacionB;
    const correoDestino = productos[0].idInformacionB.correoFacturacion;
    let nuevoEstado, motivo;
    
    // Determinar estado y motivo basado en la acción interna y no en el asunto
    if (!emailAction) {
      alert("No se pudo determinar la acción del email (acción interna vacía)");
      return;
    }

    if (emailAction === "APROBAR") {
      nuevoEstado = "Aprobado";
      motivo = "Aprobado";
    } else if (emailAction === "RECHAZAR_FONDO") {
      nuevoEstado = "Rechazado";
      // Mantener detalle específico aunque el asunto sea genérico
      motivo = "Errores de Fondo";
    } else if (emailAction === "RECHAZAR_FORMA") {
      nuevoEstado = "Rechazado";
      motivo = "Errores de Forma";
    } else {
      // Cualquier otro caso de rechazo se trata como genérico
      nuevoEstado = "Rechazado";
      motivo = "Rechazado";
    }

    try {
      const response = await fetch(`${API_BASE_URL}/informacion-b/updateEstado/${idInformacionB}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          tendencia,
          motivo,
          email: {
            destinatario: correoDestino,
            asunto: emailSubject,
            cuerpo: emailBody
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert(`El estado se ha actualizado a ${nuevoEstado} y el correo ha sido enviado.`);
      setShowEmailModal(false);
      
      // Usar la función proporcionada como prop o la función interna
      if (fetchUsuarios) {
        fetchUsuarios();
      } else {
        fetchUsuariosInternal();
      }
      
      // Si hay función goBack, usarla, sino volver a la lista
      if (goBack) {
        goBack();
      } else {
        setSelectedUsuario(null);
        setProductos([]);
        setInformacionB(null);
      }
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      alert("Hubo un error al actualizar el estado.");
    }
  };

  // Función para renderizar el contenido según la pestaña activa
  const renderTabContent = () => {
    // Usar el idInformacionB del usuario seleccionado, no del producto
    const idInformacionB = selectedUsuario?.informacionB_idInformacionB || productos[0]?.idInformacionB?.idInformacionB;
    
    switch (activeTab) {
      case "resumen":
        return renderResumenTable();
      case "informacion":
        return <InformacionB color="light" readonly={true} idInformacionB={idInformacionB} />;
      case "productos":
        return <ProductosB color="light" readonly={true} idInformacionB={idInformacionB} />;
      default:
        return renderResumenTable();
    }
  };

  // Función para renderizar la tabla de resumen
  const renderResumenTable = () => (
    <div className="w-full overflow-x-auto p-4">
      <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Item</th>
            <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Razón Social</th>
            <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">NIT</th>
            <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Origen de capital MULTINACIONAL / NACIONAL</th>
            <th colSpan={10} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Distribución y comercialización AÑO {anoReporteActual || 'N/A'}</th>
            <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">TOTAL DE PESO DE EMPAQUES, ENVASES Y ENVOLTURAS</th>
            <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">TOTAL DE PESO DEL PRODUCTO ({anoReporteActual || 'N/A'})</th>
            <th colSpan={3} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Comparativo Peso Facturación</th>
            <th colSpan={3} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Grupo</th>
            <th colSpan={1} rowSpan={4} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Conformidad según literal</th>
            <th colSpan={1} rowSpan={4} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Tendencia de comportamiento</th>
          </tr>
          <tr className="bg-gray-200">
            <th colSpan={4} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Comercial</th>
            <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Institucional</th>
            <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Intrahospitalario</th>
            <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Muestras médicas</th>
          </tr>
          <tr className="bg-gray-200">
            <th colSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">RX</th>
            <th colSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">OTC</th>
            <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total Peso Facturación {anoReporteActual || 'N/A'} (KG)</th>
            <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total Peso Facturación {year1 || 'N/A'} (KG)</th>
            <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total Peso Facturación {year2 || 'N/A'} (KG)</th>
            <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{year2 || 'N/A'}</th>
            <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{year1 || 'N/A'}</th>
            <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{anoReporteActual || 'N/A'}</th>
          </tr>
          <tr className="bg-gray-200">
            <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
            <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
            <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
            <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
            <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
            <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
            <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
            <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
            <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
            <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t text-center font-bold bg-blue-50">
            <td className="p-2">RESUMEN</td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-fit" type="text" value={productos[0]?.idInformacionB?.nombre || ""} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-fit" type="text" value={productos[0]?.idInformacionB?.nit || ""} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-fit" type="text" value={productos[0]?.idInformacionB?.origen || ""} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.pesoEmpaqueComercialRX?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.pesoTotalComercialRX?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.pesoEmpaqueComercialOTC?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.pesoTotalComercialOTC?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.pesoEmpaqueInstitucional?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.pesoTotalInstitucional?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.pesoEmpaqueIntrahospitalario?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.pesoTotalIntrahospitalario?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.pesoEmpaqueMuestrasMedicas?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.pesoTotalMuestrasMedicas?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.totalPesoEmpaques?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={resumen.totalPesoProducto?.toFixed(2) || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={totalFormula} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={historicoYear1?.totalPesoFacturacion || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-full" type="number" value={historicoYear2?.totalPesoFacturacion || 0} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-fit" type="text" value={historicoYear2?.grupo || "No info"} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-fit" type="text" value={historicoYear1?.grupo || "No info"} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-fit" type="text" value={grupoFormula} readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-fit" type="text" value="CONFORME" readOnly />
            </td>
            <td className="min-w-[100px] p-1 border border-gray-300">
              <input className="border p-1 w-fit" type="text" value={tendencia} readOnly />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex flex-wrap items-center justify-between">
          <div className="relative px-4 max-w-full flex-grow flex-1">
            <h3 className="font-semibold text-lg text-blueGray-700">
              Validar Información Literal B - {productos[0]?.idInformacionB?.nombre || "Cliente"}
            </h3>
          </div>
          {/* Mostrar botón de volver solo en modo autónomo */}
          {!propsProductos && selectedUsuario && (
            <div className="px-4">
              <button
                className="bg-blueGray-500 text-white px-4 py-2 rounded font-medium"
                onClick={() => {
                  setSelectedUsuario(null);
                  setProductos([]);
                }}
              >
                ← Volver a la lista
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sistema de pestañas */}
      <div className="px-4">
        <nav className="flex space-x-1 mb-4">
          <button
            onClick={() => setActiveTab("resumen")}
            className={`px-4 py-2 rounded-t-lg font-medium border-b-2 ${
              activeTab === "resumen"
                ? "bg-blueGray-100 text-blueGray-800 border-blue-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab("informacion")}
            className={`px-4 py-2 rounded-t-lg font-medium border-b-2 ${
              activeTab === "informacion"
                ? "bg-blueGray-100 text-blueGray-800 border-blue-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
            }`}
          >
            Información Empresa
          </button>
          <button
            onClick={() => setActiveTab("productos")}
            className={`px-4 py-2 rounded-t-lg font-medium border-b-2 ${
              activeTab === "productos"
                ? "bg-blueGray-100 text-blueGray-800 border-blue-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
            }`}
          >
            Productos
          </button>
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      <div className="flex-1">
        {loading ? (
          <div className="p-4 text-center">Cargando...</div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Botones de acción */}
      <div className="px-4 py-4 bg-gray-50 border-t">
        <div className="flex gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button 
              className="bg-green hover:bg-green text-white px-4 py-2 rounded font-medium border border-green-600"
              onClick={handleAprobar}
            >
              Aprobar
            </button>
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium border border-red-600"
              onClick={handleRechazarFondo}
            >
              Rechazar Fondo
            </button>
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium border border-red-600"
              onClick={handleRechazarForma}
            >
              Rechazar Forma
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              className="bg-blueGray-800 hover:bg-blueGray-600 text-white px-4 py-2 rounded font-medium border border-gray-300"
              onClick={() => {
                if (goBack) {
                  goBack();
                } else {
                  setSelectedUsuario(null);
                  setProductos([]);
                  setInformacionB(null);
                }
              }}
            >
              Atrás
            </button>
          </div>
        </div>
      </div>

      {/* Modal de preview de email */}
      <Modal
        isOpen={showEmailModal}
        onRequestClose={() => setShowEmailModal(false)}
        contentLabel="Preview Email"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '95%',
            maxWidth: '600px',
            maxHeight: '90%',
            padding: '0',
            border: 'none',
            borderRadius: '8px',
            overflow: 'hidden'
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000
          }
        }}
      >
        <div className="email-modal p-4 sm:p-6 max-h-full overflow-y-auto">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Preview del Email</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para:
            </label>
            <input 
              type="email" 
              value={productos[0]?.idInformacionB?.correoFacturacion || ""} 
              readOnly
              className="w-full p-2 border border-gray-300 rounded bg-gray-50"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asunto:
            </label>
            <input 
              type="text" 
              value={emailSubject} 
              readOnly
              className="w-full p-2 border border-gray-300 rounded bg-gray-50"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje:
            </label>
            <textarea 
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={6}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <button 
              className="bg-blueGray-800 hover:bg-blueGray-600 text-white px-4 py-2 rounded text-sm font-medium order-2 sm:order-1"
              onClick={() => setShowEmailModal(false)}
            >
              Cerrar
            </button>
            <button 
              className="bg-green hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium order-1 sm:order-2"
              onClick={handleEnviarEmail}
            >
              Enviar Email
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

CardValidarB.propTypes = {
  productos: PropTypes.array,
  goBack: PropTypes.func,
  fetchUsuarios: PropTypes.func,
};
