import React, { useState, useEffect, useCallback } from "react";
import { Oval } from 'react-loader-spinner';
import Backdrop from '@mui/material/Backdrop';
import PropTypes from "prop-types";
import Modal from "react-modal";
import Informacion from "../Forms/Informacion";
import EmpaquePrimario from "../Forms/EmpaquePrimario";
import EmpaqueSecundario from "../Forms/EmpaqueSecundario";
import EmpaquePlastico from "../Forms/EmpaquePlastico";
import EnvasesRetornables from "../Forms/EnvasesRetornables";
import DistribucionGeografica from "../Forms/DistribucionGeografica";
import { API_BASE_URL } from "../../utils/config";

export default function CardValidarF({ color, clientes: propsClientes, goBack, fetchClientes }) {
  const [clientes, setClientes] = useState(propsClientes || []); // Clientes con formulario F pendiente
  const [selectedCliente, setSelectedCliente] = useState(null); // Cliente seleccionado
  const [activeTab, setActiveTab] = useState("resumen-base"); // Pestaña activa
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Cargando datos...');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailAction, setEmailAction] = useState(""); // Para rastrear si es APROBAR o RECHAZAR
  const [empaques, setEmpaques] = useState([]); // Resumen de empaques
  const [plasticos, setPlasticos] = useState([]); // Resumen de plásticos
  const [retornables, setRetornables] = useState(null); // Estado para retornables
  const [distribucion, setDistribucion] = useState(null); // Estado para distribución
  const [empaquesPrimarios, setEmpaquesPrimarios] = useState([]); // Datos primarios separados
  const [empaquesSecundarios, setEmpaquesSecundarios] = useState([]); // Datos secundarios separados
  // Paginación para tabla auxiliar de productos (plásticos)
  const [plastPagina, setPlastPagina] = useState(1);
  const plastPorPag = 5;
  // Paginación para tablas auxiliares de Primarios y Secundarios
  const [primPagina, setPrimPagina] = useState(1);
  const primPorPag = 5;
  const [secPagina, setSecPagina] = useState(1);
  const secPorPag = 5;

  // Obtener clientes con formulario F pendiente
  const fetchClientesInternal = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/getClientesPendientes`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Clientes obtenidos:", data);
      setClientes(data);
      
      // Si no hay props de clientes, mostrar lista de clientes
      if (!propsClientes) {
        setSelectedCliente(null);
      }
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    } finally {
      setLoading(false);
    }
  }, [propsClientes]);

  useEffect(() => {
    if (!propsClientes) {
      fetchClientesInternal();
    }
  }, [propsClientes, fetchClientesInternal]);

  // Reiniciar paginación de plásticos cuando cambie el listado
  useEffect(() => {
    setPlastPagina(1);
  }, [plasticos]);

  // Reiniciar paginación de primarios/secundarios cuando cambien sus listados
  useEffect(() => {
    setPrimPagina(1);
  }, [empaquesPrimarios]);
  useEffect(() => {
    setSecPagina(1);
  }, [empaquesSecundarios]);

  // Manejar selección de cliente
  const handleSelectCliente = async (cliente) => {
    setSelectedCliente(cliente);
    setLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Cargando información del cliente...');
    try {
      // 1. Obtener información completa del cliente incluyendo correoFacturacion
      setLoadingProgress(10);
      const informacionResponse = await fetch(`${API_BASE_URL}/informacion-f/getInformacion/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (informacionResponse.ok) {
        const informacionData = await informacionResponse.json();
        setSelectedCliente(prev => ({ ...prev, correo_facturacion: informacionData.correo_facturacion }));
      }
      setLoadingProgress(25);
      // 2. Obtener empaques primarios
      const primariosResponse = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesPrimarios/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!primariosResponse.ok) throw new Error(`Error ${primariosResponse.status}: ${primariosResponse.statusText}`);
      const primariosData = await primariosResponse.json();
      setLoadingProgress(40);
      // 3. Obtener empaques secundarios
      const secundariosResponse = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesSecundarios/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!secundariosResponse.ok) throw new Error(`Error ${secundariosResponse.status}: ${secundariosResponse.statusText}`);
      const secundariosData = await secundariosResponse.json();
      setLoadingProgress(55);
      setEmpaquesPrimarios(primariosData);
      setEmpaquesSecundarios(secundariosData);
      // Calcular totales y porcentajes
      const empaquesData = primariosData.map((primario, index) => {
        const secundario = secundariosData[index] || {};
        const totalPrimarios =
          parseFloat(primario.papel || 0) +
          parseFloat(primario.metal_ferrosos || 0) +
          parseFloat(primario.metal_no_ferrososs || 0) +
          parseFloat(primario.carton || 0) +
          parseFloat(primario.vidrios || 0);
        const totalSecundarios =
          parseFloat(secundario.papel || 0) +
          parseFloat(secundario.metal_ferrosos || 0) +
          parseFloat(secundario.metal_no_ferrososs || 0) +
          parseFloat(secundario.carton || 0) +
          parseFloat(secundario.vidrios || 0);
        const total = totalPrimarios + totalSecundarios;
        const porcPrimarios = total > 0 ? ((totalPrimarios / total) * 100).toFixed(2) : 0;
        const porcSecundarios = total > 0 ? ((totalSecundarios / total) * 100).toFixed(2) : 0;
        const totalMetalPrimarios = parseFloat(primario.metal_ferrosos || 0) + parseFloat(primario.metal_no_ferrososs || 0);
        const totalMetalSecundarios = parseFloat(secundario.metal_ferrosos || 0) + parseFloat(secundario.metal_no_ferrososs || 0);
        return {
          razonSocial: primario.empresa || secundario.empresa,
          papelPrimarios: primario.papel || 0,
          metalPrimarios: totalMetalPrimarios || 0,
          cartonPrimarios: primario.carton || 0,
          vidrioPrimarios: primario.vidrios || 0,
          papelSecundarios: secundario.papel || 0,
          metalSecundarios: totalMetalSecundarios || 0,
          cartonSecundarios: secundario.carton || 0,
          vidrioSecundarios: secundario.vidrios || 0,
          total,
          porcPrimarios,
          porcSecundarios,
        };
      });
      setEmpaques(empaquesData);
      setLoadingProgress(65);
      // 4. Obtener resumen de plásticos
      const plasticosResponse = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesPlasticos/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!plasticosResponse.ok) throw new Error(`Error ${plasticosResponse.status}: ${plasticosResponse.statusText}`);
      const plasticosData = await plasticosResponse.json();
      // Mapear igual que EmpaquePlastico.js para asegurar consistencia de claves y parseo
      const plasticosFormateados = plasticosData.map(producto => ({
        ...producto,
        liquidos: typeof producto.liquidos === 'string' ? (()=>{ try { return JSON.parse(producto.liquidos || '{}'); } catch { return {}; } })() : (producto.liquidos || {}),
        otrosProductos: typeof producto.otros === 'string' ? (()=>{ try { return JSON.parse(producto.otros || '{}'); } catch { return {}; } })() : (producto.otros || {}),
        construccion: typeof producto.construccion === 'string' ? (()=>{ try { return JSON.parse(producto.construccion || '{}'); } catch { return {}; } })() : (producto.construccion || {}),
      }));
      setPlasticos(plasticosFormateados);
      setLoadingProgress(75);
      // 5. Obtener retornables
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getEnvasesRetornables/${cliente.idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            function parseDoubleJSON(value) {
              try {
                if (typeof value === "string") {
                  let parsed = JSON.parse(value);
                  if (typeof parsed === "string") {
                    return JSON.parse(parsed);
                  }
                  return parsed;
                }
                return value || {};
              } catch {
                return {};
              }
            }
            const primerRegistro = data[0];
            setRetornables({
              parametros: {
                "EERM": "(1) EERM",
                "EER": "(2) EER",
                "EENC": "(3) EENC",
                "EERI": "(4) EERI",
                "ER": "(5) ER",
                "EENC_EERI": "(EENC +  EERI)",
                "MATERIAL_70": "Material con % mayor al 70% (*)",
                "NINGUN_MATERIAL_70": "Ningún material con % mayor al 70%  (**)",
                "MATERIAL_1": "Material 1",
                "MATERIAL_2": "Material 2",
                "MATERIAL_3": "Material 3",
                "MULTIMATERIAL_N": "Multimaterial n"
              },
              pesoTotal: parseDoubleJSON(primerRegistro.peso),
              papel: parseDoubleJSON(primerRegistro.papel),
              carton: parseDoubleJSON(primerRegistro.carton),
              plasticoRigidos: parseDoubleJSON(primerRegistro.plasticoRig),
              plasticoFlexibles: parseDoubleJSON(primerRegistro.platicoFlex),
              vidrio: parseDoubleJSON(primerRegistro.vidrio),
              metalesFerrosos: parseDoubleJSON(primerRegistro.metal_ferrosos),
              metalesNoFerrosos: parseDoubleJSON(primerRegistro.metal_no_ferrososs),
              multimaterial1: parseDoubleJSON(primerRegistro.multimaterial1),
              multimaterialn: parseDoubleJSON(primerRegistro.multimaterialn),
              descripcion: parseDoubleJSON(primerRegistro.descripcion)
            });
          } else {
            setRetornables(null);
          }
        } else {
          setRetornables(null);
        }
      } catch (error) {
        setRetornables(null);
      }
      setLoadingProgress(85);
      // 6. Obtener distribución
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getDistribucion/${cliente.idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          setDistribucion(data);
        } else {
          setDistribucion(null);
        }
      } catch (error) {
        setDistribucion(null);
      }
      setLoadingProgress(92);
      // 7. Obtener distribución geográfica
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getDistribucionGeografica/${cliente.idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const primerRegistro = data[0];
            let departamentosObj = {};
            try {
              let temp = JSON.parse(primerRegistro.departamentos || "{}") || {};
              if (typeof temp === "string") {
                departamentosObj = JSON.parse(temp);
              } else {
                departamentosObj = temp;
              }
            } catch {
              departamentosObj = {};
            }
            const filas = Object.entries(departamentosObj)
              .filter(([departamento, porcentaje]) => departamento && porcentaje !== undefined && porcentaje !== null && porcentaje !== "")
              .map(([departamento, porcentaje]) => ({
                departamento,
                porcentaje: porcentaje.toString()
              }));
            setDistribucion({
              filas,
              pregunta1: primerRegistro.pregunta1 || "",
              pregunta2: primerRegistro.pregunta2 || "",
              pregunta3: primerRegistro.pregunta3 || "",
              observaciones: primerRegistro.observaciones || ""
            });
          } else {
            setDistribucion(null);
          }
        } else {
          setDistribucion(null);
        }
      } catch (error) {
        setDistribucion(null);
      }
      setLoadingProgress(100);
    } catch (error) {
      console.error("Error al obtener los datos del cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para generar plantillas de email según acción
  const generarPlantillaEmail = (accion, nombreCliente, totalBase, totalPlasticos) => {
    const plantillas = {
      "APROBAR": {
        asunto: `Formulario Aprobado - Linea Base Validado`,
        cuerpo: `Estimado/a ${nombreCliente},

Me complace informarte que, tras la validación del Linea Base, confirmamos que la Línea Base de la empresa ${nombreCliente} fue de ${(Number(totalBase) + Number(totalPlasticos)).toFixed(5)} ton, para los materiales de Papel, Metal, Vidrio y Cartón el total fue de ${Number(totalBase).toFixed(5)} ton y para los plásticos el total fue de ${Number(totalPlasticos).toFixed(5)} ton. El formato correspondiente ya ha sido validado y adjunto encontrarás una carta de confirmación de datos que necesitamos que tu empresa firme. (ver adjunto)

Saludos cordiales,
Equipo de Validación Punto Azul`
      },
      "RECHAZAR": {
        asunto: `Formulario Linea Base Requiere Correcciones`,
        cuerpo: `Estimado/a ${nombreCliente},

Lamentamos informarte que tu formulario del Linea Base ha sido rechazado debido a inconsistencias encontradas durante el proceso de validación.

Por favor, revisa la información enviada y realiza las correcciones necesarias antes de volver a enviar el formulario.

Si tienes alguna duda, no dudes en contactarnos.

Saludos cordiales,
Equipo de Validación Punto Azul`
      }
    };
    
    return plantillas[accion];
  };

  // Manejar acción de firmar - mostrar modal de email
  const handleFirmar = () => {
    // Calcular totales
    const totalesBase = calcularTotalesBase();
    const totalesPlasticos = calcularTotalesPlasticos();

    const plantilla = generarPlantillaEmail("APROBAR", selectedCliente?.nombre || "Cliente", totalesBase, totalesPlasticos);
    setEmailSubject(plantilla.asunto);
    setEmailBody(plantilla.cuerpo);
    setEmailAction("APROBAR"); // Establecer la acción
    setShowEmailModal(true);
  };

  // Manejar acción de rechazar - mostrar modal de email
  const handleRechazar = () => {
    const plantilla = generarPlantillaEmail("RECHAZAR", selectedCliente?.nombre || "Cliente", 0, 0);
    setEmailSubject(plantilla.asunto);
    setEmailBody(plantilla.cuerpo);
    setEmailAction("RECHAZAR"); // Establecer la acción
    setShowEmailModal(true);
  };

  // (helper eliminado: hasAtLeastOneProductF no usado)

  // Helper: convierte valor a número, manejando null/undefined/vacío
  const safeParseFloat = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Función para calcular totales base (papel, metal, vidrio, cartón)
  const calcularTotalesBase = () => {
    const totalesPrimarios = empaquesPrimarios.reduce((acc, producto) => {
      const unidades = safeParseFloat(producto.unidades);
      return {
        papel: acc.papel + ((safeParseFloat(producto.papel) * unidades) / 1000000),
        metalFerroso: acc.metalFerroso + ((safeParseFloat(producto.metal_ferrosos) * unidades) / 1000000),
        metalNoFerroso: acc.metalNoFerroso + ((safeParseFloat(producto.metal_no_ferrososs) * unidades) / 1000000),
        carton: acc.carton + ((safeParseFloat(producto.carton) * unidades) / 1000000),
        vidrio: acc.vidrio + ((safeParseFloat(producto.vidrios) * unidades) / 1000000),
      };
    }, { papel: 0, metalFerroso: 0, metalNoFerroso: 0, carton: 0, vidrio: 0 });

    const totalesSecundarios = empaquesSecundarios.reduce((acc, producto) => {
      const unidades = safeParseFloat(producto.unidades);
      return {
        papel: acc.papel + ((safeParseFloat(producto.papel) * unidades) / 1000000),
        metalFerroso: acc.metalFerroso + ((safeParseFloat(producto.metal_ferrosos) * unidades) / 1000000),
        metalNoFerroso: acc.metalNoFerroso + ((safeParseFloat(producto.metal_no_ferrososs) * unidades) / 1000000),
        carton: acc.carton + ((safeParseFloat(producto.carton) * unidades) / 1000000),
        vidrio: acc.vidrio + ((safeParseFloat(producto.vidrios) * unidades) / 1000000),
      };
    }, { papel: 0, metalFerroso: 0, metalNoFerroso: 0, carton: 0, vidrio: 0 });

    const totalBase = totalesPrimarios.papel + totalesPrimarios.metalFerroso + totalesPrimarios.metalNoFerroso + totalesPrimarios.carton + totalesPrimarios.vidrio +
                      totalesSecundarios.papel + totalesSecundarios.metalFerroso + totalesSecundarios.metalNoFerroso + totalesSecundarios.carton + totalesSecundarios.vidrio;
    
    return isNaN(totalBase) ? 0 : totalBase;
  };

  // Función para calcular totales de plásticos
  const calcularTotalesPlasticos = () => {
    return plasticos.reduce((total, producto) => {
      // Unificar parseo igual que en la tabla resumen
      const liquidos = typeof producto.liquidos === 'string' ? (()=>{ try { return JSON.parse(producto.liquidos || '{}'); } catch { return {}; } })() : (producto.liquidos || {});
      const otros = typeof producto.otrosProductos === 'string' ? (()=>{ try { return JSON.parse(producto.otrosProductos || '{}'); } catch { return {}; } })() : (producto.otrosProductos || {});
      const construccion = typeof producto.construccion === 'string' ? (()=>{ try { return JSON.parse(producto.construccion || '{}'); } catch { return {}; } })() : (producto.construccion || {});
      const unidades = safeParseFloat(producto.unidades);

      const totalLiquidos = Object.values(liquidos).reduce((sum, val) => {
        const valorNumerico = safeParseFloat(val);
        const resultado = (valorNumerico * unidades) / 1000000;
        return sum + (isNaN(resultado) ? 0 : resultado);
      }, 0);

      const totalOtros = Object.values(otros).reduce((sum, val) => {
        const valorNumerico = safeParseFloat(val);
        const resultado = (valorNumerico * unidades) / 1000000;
        return sum + (isNaN(resultado) ? 0 : resultado);
      }, 0);

      const totalConstruccion = Object.values(construccion).reduce((sum, val) => {
        const valorNumerico = safeParseFloat(val);
        const resultado = (valorNumerico * unidades) / 1000000;
        return sum + (isNaN(resultado) ? 0 : resultado);
      }, 0);

      const subtotal = totalLiquidos + totalOtros + totalConstruccion;
      return total + (isNaN(subtotal) ? 0 : subtotal);
    }, 0);
  };

  // Función para enviar email y actualizar estado
  const handleEnviarEmail = async () => {
    let nuevoEstado, motivo;
    
    // Determinar estado y motivo basado en la acción establecida
    if (emailAction === "APROBAR") {
      nuevoEstado = "Aprobado";
      motivo = "Aprobado";
    } else if (emailAction === "RECHAZAR") {
      nuevoEstado = "Rechazado";
      motivo = "Rechazado";
    } else {
      alert("No se pudo determinar la acción del email");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/updateEstado/${selectedCliente.idInformacionF}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          motivo,
          email: {
            destinatario: selectedCliente.correo_facturacion,
            asunto: emailSubject,
            cuerpo: emailBody
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert(`El formulario ha sido ${nuevoEstado.toLowerCase()} y el correo ha sido enviado.`);
      setShowEmailModal(false);
      setSelectedCliente(null); // Volver a la lista de clientes
      
      // Usar la función correcta según el contexto
      if (fetchClientes && typeof fetchClientes === 'function') {
        fetchClientes(); // Función del componente padre
      } else {
        fetchClientesInternal(); // Función interna
      }
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      alert("Hubo un error al procesar la solicitud.");
    }
  };

  // (Eliminadas funciones de respaldo no usadas para evitar warnings de lint)

  return (
    <div
      className={`relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded ${
        color === "light" ? "bg-white" : "bg-blueGray-700 text-white"
      }`}
    >
      {/* Loader global para carga de datos del cliente */}
      <Backdrop open={loading} sx={{ color: '#fff', zIndex: 1300 }}>
        <div className="flex flex-col items-center">
          <Oval color="#1976d2" height={60} width={60} secondaryColor="#90caf9" strokeWidth={5} />
          <span className="mt-4 text-lg font-semibold">{loadingMessage}</span>
          <span className="mt-2 text-base">{`Progreso: ${loadingProgress}%`}</span>
        </div>
      </Backdrop>
      {!selectedCliente ? (
        <>
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <h3 className="text-lg font-semibold flex items-center">Validacion Linea Base</h3>
        </div>
        <div className="block w-full overflow-x-auto">
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Razón Social</th>
                <th className="p-2">NIT</th>
                <th className="p-2">Año Reporte</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.idInformacionF} className="border-t text-center">
                  <td className="p-2">{cliente.nombre}</td>
                  <td className="p-2">{cliente.nit}</td>
                  <td className="p-2">{cliente.anoReporte || cliente.ano_reporte || cliente.ano_reportado || cliente.ano || ''}</td>
                  <td className="p-2">
                    <button
                      className="bg-lightBlue-600 text-white font-bold text-xs px-4 py-2 rounded shadow hover:shadow-md"
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      Validar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <>
          {/* Pestañas */}
          <div className="px-4 py-2">
            <div className="flex flex-wrap gap-1 mb-4 overflow-x-auto">
              <button
                className={`px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg whitespace-nowrap ${activeTab === "resumen-base" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md" : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
                onClick={() => setActiveTab("resumen-base")}
              >
                Resumen Base
              </button>
              <button
                className={`px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg whitespace-nowrap ${activeTab === "resumen-plasticos" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md" : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
                onClick={() => setActiveTab("resumen-plasticos")}
              >
                Resumen Plásticos
              </button>
              <button
                className={`px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg whitespace-nowrap ${activeTab === "informacion" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md" : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
                onClick={() => setActiveTab("informacion")}
              >
                Información
              </button>
              <button
                className={`px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg whitespace-nowrap ${activeTab === "empaque-primario" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md" : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
                onClick={() => setActiveTab("empaque-primario")}
              >
                Emp. Primario
              </button>
              <button
                className={`px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg whitespace-nowrap ${activeTab === "empaque-secundario" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md" : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
                onClick={() => setActiveTab("empaque-secundario")}
              >
                Emp. Secundario
              </button>
              <button
                className={`px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg whitespace-nowrap ${activeTab === "empaque-plastico" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md" : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
                onClick={() => setActiveTab("empaque-plastico")}
              >
                Emp. Plástico
              </button>
              <button
                className={`px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg whitespace-nowrap ${activeTab === "envases-retornables" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md" : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
                onClick={() => setActiveTab("envases-retornables")}
              >
                Envases Retornables
              </button>
              <button
                className={`px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg whitespace-nowrap ${activeTab === "distribucion-geografica" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md" : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
                onClick={() => setActiveTab("distribucion-geografica")}
              >
                Dist. Geográfica
              </button>
            </div>
          </div>

          {/* Contenido de pestañas */}
          {activeTab === "resumen-base" && (
            <div className="w-full overflow-x-auto p-4">
              {/* Contenedor principal con las dos tablas en la misma fila */}
              <div className="flex gap-4 mb-6">
                {/* Tabla Primarios */}
                <div className="flex-1">
                  <h4 className="text-center font-bold mb-2">TABLA PRIMARIOS</h4>
                  <table className="w-full table-auto border-separate border-spacing-1 border border-gray-300">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Producto</th>
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Papel (ton)</th>
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Metal Ferroso (ton)</th>
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Metal No Ferroso (ton)</th>
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Cartón (ton)</th>
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Vidrio (ton)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const total = Array.isArray(empaquesPrimarios) ? empaquesPrimarios.length : 0;
                        const totalPag = Math.max(1, Math.ceil(total / primPorPag));
                        const page = Math.min(primPagina, totalPag);
                        const start = (page - 1) * primPorPag;
                        const end = start + primPorPag;
                        const items = empaquesPrimarios.slice(start, end);
                        return items.map((producto, index) => (
                        <tr key={start + index} className="text-center">
                          <td className="px-2 py-1 text-xs border border-gray-300">{producto.nombre_producto || `Producto ${index + 1}`}</td>
                          <td className="px-2 py-1 text-xs border border-gray-300">
                            {((parseFloat(producto.papel || 0) * parseFloat(producto.unidades || 0)) / 1000000).toFixed(5)}
                          </td>
                          <td className="px-2 py-1 text-xs border border-gray-300">
                            {((parseFloat(producto.metal_ferrosos || 0) * parseFloat(producto.unidades || 0)) / 1000000).toFixed(5)}
                          </td>
                          <td className="px-2 py-1 text-xs border border-gray-300">
                            {((parseFloat(producto.metal_no_ferrososs || 0) * parseFloat(producto.unidades || 0)) / 1000000).toFixed(5)}
                          </td>
                          <td className="px-2 py-1 text-xs border border-gray-300">
                            {((parseFloat(producto.carton || 0) * parseFloat(producto.unidades || 0)) / 1000000).toFixed(5)}
                          </td>
                          <td className="px-2 py-1 text-xs border border-gray-300">
                            {((parseFloat(producto.vidrios || 0) * parseFloat(producto.unidades || 0)) / 1000000).toFixed(5)}
                          </td>
                        </tr>
                      ));
                      })()}
                    </tbody>
                  </table>
                  {/* Paginación Primarios */}
                  {Array.isArray(empaquesPrimarios) && empaquesPrimarios.length > primPorPag && (
                    <div className="mt-3 flex flex-wrap justify-between items-center gap-3">
                      <div className="text-xs text-gray-600">
                        {(() => {
                          const total = empaquesPrimarios.length;
                          const totalPag = Math.max(1, Math.ceil(total / primPorPag));
                          const page = Math.min(primPagina, totalPag);
                          const startDisp = (total === 0) ? 0 : (page - 1) * primPorPag + 1;
                          const endDisp = Math.min(page * primPorPag, total);
                          return `Mostrando ${startDisp} a ${endDisp} de ${total} productos`;
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPrimPagina(p => Math.max(1, p - 1))}
                          disabled={primPagina === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => {
                            const total = empaquesPrimarios.length;
                            const totalPag = Math.max(1, Math.ceil(total / primPorPag));
                            setPrimPagina(p => Math.min(totalPag, p + 1));
                          }}
                          className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          disabled={primPagina >= Math.ceil(empaquesPrimarios.length / primPorPag)}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabla Secundarios */}
                <div className="flex-1">
                  <h4 className="text-center font-bold mb-2">TABLA SECUNDARIOS</h4>
                  <table className="w-full table-auto border-separate border-spacing-1 border border-gray-300">
                    <thead>
                      <tr className="bg-green-100">
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Producto</th>
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Papel (ton)</th>
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Metal Ferroso (ton)</th>
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Metal No Ferroso (ton)</th>
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Cartón (ton)</th>
                        <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Vidrio (ton)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const total = Array.isArray(empaquesSecundarios) ? empaquesSecundarios.length : 0;
                        const totalPag = Math.max(1, Math.ceil(total / secPorPag));
                        const page = Math.min(secPagina, totalPag);
                        const start = (page - 1) * secPorPag;
                        const end = start + secPorPag;
                        const items = empaquesSecundarios.slice(start, end);
                        return items.map((producto, index) => (
                        <tr key={start + index} className="text-center">
                          <td className="px-2 py-1 text-xs border border-gray-300">{producto.nombre_producto || `Producto ${index + 1}`}</td>
                          <td className="px-2 py-1 text-xs border border-gray-300">
                            {((parseFloat(producto.papel || 0) * parseFloat(producto.unidades || 0)) / 1000000).toFixed(5)}
                          </td>
                          <td className="px-2 py-1 text-xs border border-gray-300">
                            {((parseFloat(producto.metal_ferrosos || 0) * parseFloat(producto.unidades || 0)) / 1000000).toFixed(5)}
                          </td>
                          <td className="px-2 py-1 text-xs border border-gray-300">
                            {((parseFloat(producto.metal_no_ferrososs || 0) * parseFloat(producto.unidades || 0)) / 1000000).toFixed(5)}
                          </td>
                          <td className="px-2 py-1 text-xs border border-gray-300">
                            {((parseFloat(producto.carton || 0) * parseFloat(producto.unidades || 0)) / 1000000).toFixed(5)}
                          </td>
                          <td className="px-2 py-1 text-xs border border-gray-300">
                            {((parseFloat(producto.vidrios || 0) * parseFloat(producto.unidades || 0)) / 1000000).toFixed(5)}
                          </td>
                        </tr>
                      ));
                      })()}
                    </tbody>
                  </table>
                  {/* Paginación Secundarios */}
                  {Array.isArray(empaquesSecundarios) && empaquesSecundarios.length > secPorPag && (
                    <div className="mt-3 flex flex-wrap justify-between items-center gap-3">
                      <div className="text-xs text-gray-600">
                        {(() => {
                          const total = empaquesSecundarios.length;
                          const totalPag = Math.max(1, Math.ceil(total / secPorPag));
                          const page = Math.min(secPagina, totalPag);
                          const startDisp = (total === 0) ? 0 : (page - 1) * secPorPag + 1;
                          const endDisp = Math.min(page * secPorPag, total);
                          return `Mostrando ${startDisp} a ${endDisp} de ${total} productos`;
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSecPagina(p => Math.max(1, p - 1))}
                          disabled={secPagina === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => {
                            const total = empaquesSecundarios.length;
                            const totalPag = Math.max(1, Math.ceil(total / secPorPag));
                            setSecPagina(p => Math.min(totalPag, p + 1));
                          }}
                          className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          disabled={secPagina >= Math.ceil(empaquesSecundarios.length / secPorPag)}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabla Resumen */}
              <div className="mt-6">
                <h4 className="text-center font-bold mb-2">TABLA RESUMEN</h4>
                <table className="w-full table-auto border-separate border-spacing-1 border border-gray-300">
                  <thead>
                    <tr className="bg-yellow-100">
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Resumen</th>
                      <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Papel</th>
                      <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Metal Ferroso</th>
                      <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Metal No Ferroso</th>
                      <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Cartón</th>
                      <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Vidrio</th>
                      <th colSpan={2} className="px-2 py-1 text-xs font-semibold border border-gray-300">Total</th>
                    </tr>
                    <tr className="bg-yellow-50">
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300"></th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Ton</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Calcular totales primarios
                      const totalesPrimarios = empaquesPrimarios.reduce((acc, producto) => ({
                        papel: acc.papel + ((parseFloat(producto.papel || 0) * parseFloat(producto.unidades || 0)) / 1000000),
                        metalFerroso: acc.metalFerroso + ((parseFloat(producto.metal_ferrosos || 0) * parseFloat(producto.unidades || 0)) / 1000000),
                        metalNoFerroso: acc.metalNoFerroso + ((parseFloat(producto.metal_no_ferrososs || 0) * parseFloat(producto.unidades || 0)) / 1000000),
                        carton: acc.carton + ((parseFloat(producto.carton || 0) * parseFloat(producto.unidades || 0)) / 1000000),
                        vidrio: acc.vidrio + ((parseFloat(producto.vidrios || 0) * parseFloat(producto.unidades || 0)) / 1000000),
                      }), { papel: 0, metalFerroso: 0, metalNoFerroso: 0, carton: 0, vidrio: 0 });

                      // Calcular totales secundarios
                      const totalesSecundarios = empaquesSecundarios.reduce((acc, producto) => ({
                        papel: acc.papel + ((parseFloat(producto.papel || 0) * parseFloat(producto.unidades || 0)) / 1000000),
                        metalFerroso: acc.metalFerroso + ((parseFloat(producto.metal_ferrosos || 0) * parseFloat(producto.unidades || 0)) / 1000000),
                        metalNoFerroso: acc.metalNoFerroso + ((parseFloat(producto.metal_no_ferrososs || 0) * parseFloat(producto.unidades || 0)) / 1000000),
                        carton: acc.carton + ((parseFloat(producto.carton || 0) * parseFloat(producto.unidades || 0)) / 1000000),
                        vidrio: acc.vidrio + ((parseFloat(producto.vidrios || 0) * parseFloat(producto.unidades || 0)) / 1000000),
                      }), { papel: 0, metalFerroso: 0, metalNoFerroso: 0, carton: 0, vidrio: 0 });

                      // Calcular totales generales
                      const totalesGenerales = {
                        papel: totalesPrimarios.papel + totalesSecundarios.papel,
                        metalFerroso: totalesPrimarios.metalFerroso + totalesSecundarios.metalFerroso,
                        metalNoFerroso: totalesPrimarios.metalNoFerroso + totalesSecundarios.metalNoFerroso,
                        carton: totalesPrimarios.carton + totalesSecundarios.carton,
                        vidrio: totalesPrimarios.vidrio + totalesSecundarios.vidrio,
                      };

                      const totalPrimarios = totalesPrimarios.papel + totalesPrimarios.metalFerroso + totalesPrimarios.metalNoFerroso + totalesPrimarios.carton + totalesPrimarios.vidrio;
                      const totalSecundarios = totalesSecundarios.papel + totalesSecundarios.metalFerroso + totalesSecundarios.metalNoFerroso + totalesSecundarios.carton + totalesSecundarios.vidrio;
                      const totalGeneral = totalPrimarios + totalSecundarios;

                      return (
                        <>
                          {/* Fila Primarios */}
                          <tr className="text-center bg-blue-50">
                            <td className="px-2 py-1 text-xs font-semibold border border-gray-300">Primarios</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesPrimarios.papel.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.papel > 0 ? ((totalesPrimarios.papel / totalesGenerales.papel) * 100).toFixed(2) : 0}%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesPrimarios.metalFerroso.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.metalFerroso > 0 ? ((totalesPrimarios.metalFerroso / totalesGenerales.metalFerroso) * 100).toFixed(2) : 0}%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesPrimarios.metalNoFerroso.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.metalNoFerroso > 0 ? ((totalesPrimarios.metalNoFerroso / totalesGenerales.metalNoFerroso) * 100).toFixed(2) : 0}%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesPrimarios.carton.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.carton > 0 ? ((totalesPrimarios.carton / totalesGenerales.carton) * 100).toFixed(2) : 0}%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesPrimarios.vidrio.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.vidrio > 0 ? ((totalesPrimarios.vidrio / totalesGenerales.vidrio) * 100).toFixed(2) : 0}%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalPrimarios.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalGeneral > 0 ? ((totalPrimarios / totalGeneral) * 100).toFixed(2) : 0}%</td>
                          </tr>
                          {/* Fila Secundarios */}
                          <tr className="text-center bg-green-50">
                            <td className="px-2 py-1 text-xs font-semibold border border-gray-300">Secundarios</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesSecundarios.papel.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.papel > 0 ? ((totalesSecundarios.papel / totalesGenerales.papel) * 100).toFixed(2) : 0}%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesSecundarios.metalFerroso.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.metalFerroso > 0 ? ((totalesSecundarios.metalFerroso / totalesGenerales.metalFerroso) * 100).toFixed(2) : 0}%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesSecundarios.metalNoFerroso.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.metalNoFerroso > 0 ? ((totalesSecundarios.metalNoFerroso / totalesGenerales.metalNoFerroso) * 100).toFixed(2) : 0}%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesSecundarios.carton.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.carton > 0 ? ((totalesSecundarios.carton / totalesGenerales.carton) * 100).toFixed(2) : 0}%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesSecundarios.vidrio.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.vidrio > 0 ? ((totalesSecundarios.vidrio / totalesGenerales.vidrio) * 100).toFixed(2) : 0}%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalSecundarios.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalGeneral > 0 ? ((totalSecundarios / totalGeneral) * 100).toFixed(2) : 0}%</td>
                          </tr>
                          {/* Fila Total */}
                          <tr className="text-center bg-yellow-200 font-bold">
                            <td className="px-2 py-1 text-xs font-bold border border-gray-300">Total</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.papel.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.metalFerroso.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.metalNoFerroso.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.carton.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalesGenerales.vidrio.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{totalGeneral.toFixed(5)}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">100%</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "resumen-plasticos" && (
            <div className="w-full overflow-x-auto p-4">
              {/* Tabla Auxiliar - Productos en gramos igual a EmpaquePlastico.js */}
              <div className="mb-6">
                <h4 className="text-center font-bold mb-2">TABLA AUXILIAR - PRODUCTOS (Gramos)</h4>
                <table className="w-full table-auto border-separate border-spacing-1 border border-gray-300">
                  <thead>
                    <tr className="bg-purple-100">
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">No.</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Empresa Titular</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Nombre Producto</th>
                      <th colSpan={9} className="px-2 py-1 text-xs font-semibold border border-gray-300">Líquidos (g)</th>
                      <th colSpan={7} className="px-2 py-1 text-xs font-semibold border border-gray-300">Otros Productos Plásticos (g)</th>
                      <th colSpan={7} className="px-2 py-1 text-xs font-semibold border border-gray-300">Plásticos de Construcción (g)</th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Unidades</th>
                    </tr>
                    <tr className="bg-purple-50">
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300"></th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300"></th>
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300"></th>
                      {/* Líquidos */}
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET Agua</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET Otros</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">HDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PVC</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">LDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PP</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PS</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Otros</th>
                      {/* Otros Productos */}
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">HDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PVC</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">LDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PP</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PS</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Otros</th>
                      {/* Construcción */}
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">HDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PVC</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">LDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PP</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PS</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Otros</th>
                      {/* Unidades */}
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const liquidosKeys = ["PET Agua","PET Otros","PET","HDPE","PVC","LDPE","PP","PS","Otros"];
                      const otrosKeys = ["PET","HDPE","PVC","LDPE","PP","PS","Otros"];
                      const toNum = (v) => {
                        if (v === null || v === undefined || v === '') return 0;
                        const n = parseFloat(v.toString().replace(',', '.'));
                        return isNaN(n) ? 0 : n;
                      };
                      const totalProductos = Array.isArray(plasticos) ? plasticos.length : 0;
                      const totalPaginas = Math.max(1, Math.ceil(totalProductos / plastPorPag));
                      const pagina = Math.min(plastPagina, totalPaginas);
                      const start = (pagina - 1) * plastPorPag;
                      const end = start + plastPorPag;
                      const paginaProductos = plasticos.slice(start, end);
                      return paginaProductos.map((producto, index) => {
                        const liquidos = typeof producto.liquidos === 'string' ? (()=>{ try { return JSON.parse(producto.liquidos || '{}'); } catch { return {}; } })() : (producto.liquidos || {});
                        const otros = typeof producto.otrosProductos === 'string' ? (()=>{ try { return JSON.parse(producto.otrosProductos || '{}'); } catch { return {}; } })() : (producto.otrosProductos || {});
                        const construccion = typeof producto.construccion === 'string' ? (()=>{ try { return JSON.parse(producto.construccion || '{}'); } catch { return {}; } })() : (producto.construccion || {});
                        const unidades = toNum(producto.unidades);
                        return (
                          <tr key={start + index} className="text-center">
                            <td className="px-2 py-1 text-xs border border-gray-300">{start + index + 1}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{producto.empresaTitular || producto.empresa || ''}</td>
                            <td className="px-2 py-1 text-xs border border-gray-300">{producto.nombreProducto || producto.nombre_producto || `Producto ${index + 1}`}</td>
                            {/* Líquidos */}
                            {liquidosKeys.map(k => (
                              <td key={`liq-${k}`} className="px-1 py-1 text-xs border border-gray-300">{(toNum(liquidos[k]) ).toFixed(2)}</td>
                            ))}
                            {/* Otros Productos */}
                            {otrosKeys.map(k => (
                              <td key={`otros-${k}`} className="px-1 py-1 text-xs border border-gray-300">{(toNum(otros[k]) ).toFixed(2)}</td>
                            ))}
                            {/* Construcción */}
                            {otrosKeys.map(k => (
                              <td key={`cons-${k}`} className="px-1 py-1 text-xs border border-gray-300">{(toNum(construccion[k]) ).toFixed(2)}</td>
                            ))}
                            {/* Unidades */}
                            <td className="px-1 py-1 text-xs border border-gray-300">{unidades}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
                {/* Controles de paginación */}
                {Array.isArray(plasticos) && plasticos.length > plastPorPag && (
                  <div className="mt-3 flex flex-wrap justify-between items-center gap-3">
                    <div className="text-xs text-gray-600">
                      {(() => {
                        const total = plasticos.length;
                        const totalPag = Math.max(1, Math.ceil(total / plastPorPag));
                        const page = Math.min(plastPagina, totalPag);
                        const startDisp = (total === 0) ? 0 : (page - 1) * plastPorPag + 1;
                        const endDisp = Math.min(page * plastPorPag, total);
                        return `Mostrando ${startDisp} a ${endDisp} de ${total} productos`;
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPlastPagina(p => Math.max(1, p - 1))}
                        disabled={plastPagina === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => {
                          const total = plasticos.length;
                          const totalPag = Math.max(1, Math.ceil(total / plastPorPag));
                          setPlastPagina(p => Math.min(totalPag, p + 1));
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        disabled={plastPagina >= Math.ceil(plasticos.length / plastPorPag)}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla Resumen - Sumatoria de todos los productos (en toneladas, igual backend) */}
              <div className="mt-6">
                <h4 className="text-center font-bold mb-2">TABLA RESUMEN - SUMATORIA TOTAL</h4>
                <table className="w-full table-auto border-separate border-spacing-1 border border-gray-300">
                  <thead>
                    <tr className="bg-indigo-100">
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Categoría</th>
                      <th colSpan={9} className="px-2 py-1 text-xs font-semibold border border-gray-300">Líquidos (ton)</th>
                      <th colSpan={7} className="px-2 py-1 text-xs font-semibold border border-gray-300">Otros Productos (ton)</th>
                      <th colSpan={7} className="px-2 py-1 text-xs font-semibold border border-gray-300">Construcción (ton)</th>
                      <th colSpan={4} className="px-2 py-1 text-xs font-semibold border border-gray-300">Totales (ton)</th>
                    </tr>
                    <tr className="bg-indigo-50">
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300"></th>
                      {/* Líquidos */}
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET Agua</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET Otros</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">HDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PVC</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">LDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PP</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PS</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Otros</th>
                      {/* Otros Productos */}
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">HDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PVC</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">LDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PP</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PS</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Otros</th>
                      {/* Construcción */}
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PET</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">HDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PVC</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">LDPE</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PP</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">PS</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Otros</th>
                      {/* Totales */}
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Total Líquidos</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Total Otros</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Total Construcción</th>
                      <th className="px-1 py-1 text-xs font-semibold border border-gray-300">Total General</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Sumar igual que el backend: (valor * unidades) / 1,000,000
                      const liquidosKeys = ["PET Agua","PET Otros","PET","HDPE","PVC","LDPE","PP","PS","Otros"];
                      const otrosKeys = ["PET","HDPE","PVC","LDPE","PP","PS","Otros"];
                      const toNum = (v) => {
                        if (v === null || v === undefined || v === '') return 0;
                        const n = parseFloat(v.toString().replace(',', '.'));
                        return isNaN(n) ? 0 : n;
                      };
                      // Inicializar acumuladores
                      const sumLiquidos = Object.fromEntries(liquidosKeys.map(k => [k, 0]));
                      const sumOtros = Object.fromEntries(otrosKeys.map(k => [k, 0]));
                      const sumConstruccion = Object.fromEntries(otrosKeys.map(k => [k, 0]));
                      // Sumar por producto
                      plasticos.forEach(producto => {
                        const liquidos = typeof producto.liquidos === 'string' ? (()=>{ try { return JSON.parse(producto.liquidos || '{}'); } catch { return {}; } })() : (producto.liquidos || {});
                        const otros = typeof producto.otrosProductos === 'string' ? (()=>{ try { return JSON.parse(producto.otrosProductos || '{}'); } catch { return {}; } })() : (producto.otrosProductos || {});
                        const construccion = typeof producto.construccion === 'string' ? (()=>{ try { return JSON.parse(producto.construccion || '{}'); } catch { return {}; } })() : (producto.construccion || {});
                        const unidades = toNum(producto.unidades);
                        liquidosKeys.forEach(k => { sumLiquidos[k] += (toNum(liquidos[k]) * unidades) / 1000000; });
                        otrosKeys.forEach(k => { sumOtros[k] += (toNum(otros[k]) * unidades) / 1000000; });
                        otrosKeys.forEach(k => { sumConstruccion[k] += (toNum(construccion[k]) * unidades) / 1000000; });
                      });
                      const totalLiquidos = Object.values(sumLiquidos).reduce((a, b) => a + b, 0);
                      const totalOtros = Object.values(sumOtros).reduce((a, b) => a + b, 0);
                      const totalConstruccion = Object.values(sumConstruccion).reduce((a, b) => a + b, 0);
                      const totalGeneral = totalLiquidos + totalOtros + totalConstruccion;
                      return (
                        <tr className="text-center bg-gray-100 font-bold">
                          <td className="px-2 py-1 text-xs font-bold border border-gray-300">TOTAL</td>
                          {/* Líquidos */}
                          {liquidosKeys.map(k => (
                            <td key={`t-liq-${k}`} className="px-1 py-1 text-xs border border-gray-300">{sumLiquidos[k].toFixed(10)}</td>
                          ))}
                          {/* Otros Productos */}
                          {otrosKeys.map(k => (
                            <td key={`t-otros-${k}`} className="px-1 py-1 text-xs border border-gray-300">{sumOtros[k].toFixed(10)}</td>
                          ))}
                          {/* Construcción */}
                          {otrosKeys.map(k => (
                            <td key={`t-cons-${k}`} className="px-1 py-1 text-xs border border-gray-300">{sumConstruccion[k].toFixed(10)}</td>
                          ))}
                          {/* Totales */}
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-blue-200 font-bold">{totalLiquidos.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-green-200 font-bold">{totalOtros.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-orange-200 font-bold">{totalConstruccion.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-red-300 font-bold">{totalGeneral.toFixed(10)}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "informacion" && (
            <div className="p-4">
              <Informacion color="light" readonly={true} idInformacionF={selectedCliente?.idInformacionF} />
            </div>
          )}
          {activeTab === "empaque-primario" && (
            <div className="p-4">
              <EmpaquePrimario color="light" readonly={true} idInformacionF={selectedCliente?.idInformacionF} />
            </div>
          )}
          {activeTab === "empaque-secundario" && (
            <div className="p-4">
              <EmpaqueSecundario color="light" readonly={true} idInformacionF={selectedCliente?.idInformacionF} />
            </div>
          )}
          {activeTab === "empaque-plastico" && (
            <div className="p-4">
              <EmpaquePlastico color="light" readonly={true} idInformacionF={selectedCliente?.idInformacionF} />
            </div>
          )}
          {activeTab === "envases-retornables" && (
            <div className="p-4">
              <EnvasesRetornables color="light" readonly={true} idInformacionF={selectedCliente?.idInformacionF} />
            </div>
          )}
          {activeTab === "distribucion-geografica" && (
            <div className="p-4">
              <DistribucionGeografica color="light" readonly={true} idInformacionF={selectedCliente?.idInformacionF} />
            </div>
          )}

          <div className=" flex gap-2 p-4">
            <button className="bg-green text-white mr-3 px-4 py-2 rounded" onClick={handleFirmar}>
              Firmar
            </button>
            <button className="bg-orange-500 text-white mr-3 px-4 py-2 rounded" onClick={handleRechazar}>
              Rechazar
            </button>
            <button className="bg-blueGray-600 text-white px-4 py-2 rounded" onClick={() => setSelectedCliente(null)}>
              Atrás
            </button>
          </div>
        </>
      )}

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
              value={selectedCliente?.correo_facturacion || ""} 
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