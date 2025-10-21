import React, { useState, useEffect } from "react";
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [empaques, setEmpaques] = useState([]); // Resumen de empaques
  const [plasticos, setPlasticos] = useState([]); // Resumen de plásticos
  const [retornables, setRetornables] = useState(null); // Estado para retornables
  const [distribucion, setDistribucion] = useState(null); // Estado para distribución
  const [empaquesPrimarios, setEmpaquesPrimarios] = useState([]); // Datos primarios separados
  const [empaquesSecundarios, setEmpaquesSecundarios] = useState([]); // Datos secundarios separados

  // Obtener clientes con formulario F pendiente
  const fetchClientesInternal = async () => {
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
  };

  useEffect(() => {
    if (!propsClientes) {
      fetchClientesInternal();
    }
  }, [propsClientes]);

  // Manejar selección de cliente
  const handleSelectCliente = async (cliente) => {
    setSelectedCliente(cliente);

    try {
      // Obtener información completa del cliente incluyendo correoFacturacion
      const informacionResponse = await fetch(`${API_BASE_URL}/informacion-f/getInformacion/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (informacionResponse.ok) {
        const informacionData = await informacionResponse.json();
        // Actualizar selectedCliente con la información completa
        setSelectedCliente(prev => ({
          ...prev,
          correo_facturacion: informacionData.correo_facturacion
        }));
      }

      // Obtener empaques primarios
      const primariosResponse = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesPrimarios/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!primariosResponse.ok) {
        throw new Error(`Error ${primariosResponse.status}: ${primariosResponse.statusText}`);
      }

      const primariosData = await primariosResponse.json();

      // Obtener empaques secundarios
      const secundariosResponse = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesSecundarios/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!secundariosResponse.ok) {
        throw new Error(`Error ${secundariosResponse.status}: ${secundariosResponse.statusText}`);
      }

      const secundariosData = await secundariosResponse.json();

      // Almacenar datos primarios y secundarios por separado
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

      // Obtener resumen de plásticos
      const plasticosResponse = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesPlasticos/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!plasticosResponse.ok) {
        throw new Error(`Error ${plasticosResponse.status}: ${plasticosResponse.statusText}`);
      }

      const plasticosData = await plasticosResponse.json();
      console.log("Resumen de plásticos:", plasticosData); // Verifica los datos de plásticos
      setPlasticos(plasticosData);

      // Obtener retornables
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getEnvasesRetornables/${cliente.idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Utilidad para deserializar doble JSON si es necesario
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

      // Obtener distribución
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

      // Obtener distribución geográfica
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getDistribucionGeografica/${cliente.idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const primerRegistro = data[0];
            // Doble parseo por si viene doblemente serializado
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
    } catch (error) {
      console.error("Error al obtener los datos del cliente:", error);
    }
  };

  // Función para generar plantillas de email según acción
  const generarPlantillaEmail = (accion, nombreCliente, totalBase, totalPlasticos) => {
    const plantillas = {
      "APROBAR": {
        asunto: `Formulario Aprobado - Linea Base Validado`,
        cuerpo: `Estimado/a ${nombreCliente},

Me complace informarte que, tras la validación del Linea Base, confirmamos que la Línea Base de la empresa ${nombreCliente} fue de ${totalBase+totalPlasticos} ton, para los materiales de Papel, Metal, Vidrio y Cartón el total fue de ${totalBase} ton y para los plásticos el total fue de ${totalPlasticos} ton. El formato correspondiente ya ha sido validado y adjunto encontrarás una carta de confirmación de datos que necesitamos que tu empresa firme. (ver adjunto)

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
    
    const plantilla = generarPlantillaEmail("APROBAR", selectedCliente?.nombre || "Cliente", totalesBase.toFixed(5), totalesPlasticos.toFixed(5));
    setEmailSubject(plantilla.asunto);
    setEmailBody(plantilla.cuerpo);
    setShowEmailModal(true);
  };

  // Manejar acción de rechazar - mostrar modal de email
  const handleRechazar = () => {
    const plantilla = generarPlantillaEmail("RECHAZAR", selectedCliente?.nombre || "Cliente", 0, 0);
    setEmailSubject(plantilla.asunto);
    setEmailBody(plantilla.cuerpo);
    setShowEmailModal(true);
  };

  // Función para calcular totales base (papel, metal, vidrio, cartón)
  const calcularTotalesBase = () => {
    const totalesPrimarios = empaquesPrimarios.reduce((acc, producto) => ({
      papel: acc.papel + ((parseFloat(producto.papel || 0) * parseFloat(producto.unidades || 0)) / 1000000),
      metalFerroso: acc.metalFerroso + ((parseFloat(producto.metal_ferrosos || 0) * parseFloat(producto.unidades || 0)) / 1000000),
      metalNoFerroso: acc.metalNoFerroso + ((parseFloat(producto.metal_no_ferrososs || 0) * parseFloat(producto.unidades || 0)) / 1000000),
      carton: acc.carton + ((parseFloat(producto.carton || 0) * parseFloat(producto.unidades || 0)) / 1000000),
      vidrio: acc.vidrio + ((parseFloat(producto.vidrios || 0) * parseFloat(producto.unidades || 0)) / 1000000),
    }), { papel: 0, metalFerroso: 0, metalNoFerroso: 0, carton: 0, vidrio: 0 });

    const totalesSecundarios = empaquesSecundarios.reduce((acc, producto) => ({
      papel: acc.papel + ((parseFloat(producto.papel || 0) * parseFloat(producto.unidades || 0)) / 1000000),
      metalFerroso: acc.metalFerroso + ((parseFloat(producto.metal_ferrosos || 0) * parseFloat(producto.unidades || 0)) / 1000000),
      metalNoFerroso: acc.metalNoFerroso + ((parseFloat(producto.metal_no_ferrososs || 0) * parseFloat(producto.unidades || 0)) / 1000000),
      carton: acc.carton + ((parseFloat(producto.carton || 0) * parseFloat(producto.unidades || 0)) / 1000000),
      vidrio: acc.vidrio + ((parseFloat(producto.vidrios || 0) * parseFloat(producto.unidades || 0)) / 1000000),
    }), { papel: 0, metalFerroso: 0, metalNoFerroso: 0, carton: 0, vidrio: 0 });

    return totalesPrimarios.papel + totalesPrimarios.metalFerroso + totalesPrimarios.metalNoFerroso + totalesPrimarios.carton + totalesPrimarios.vidrio +
           totalesSecundarios.papel + totalesSecundarios.metalFerroso + totalesSecundarios.metalNoFerroso + totalesSecundarios.carton + totalesSecundarios.vidrio;
  };

  // Función para calcular totales de plásticos
  const calcularTotalesPlasticos = () => {
    return plasticos.reduce((total, producto) => {
      const liquidos = JSON.parse(producto.liquidos || "{}");
      const otros = JSON.parse(producto.otros || "{}");
      const construccion = JSON.parse(producto.construccion || "{}");
      const unidades = parseFloat(producto.unidades || 0);

      const totalLiquidos = Object.values(liquidos).reduce((sum, val) => sum + (parseFloat(val || 0) * unidades) / 1000000, 0);
      const totalOtros = Object.values(otros).reduce((sum, val) => sum + (parseFloat(val || 0) * unidades) / 1000000, 0);
      const totalConstruccion = Object.values(construccion).reduce((sum, val) => sum + (parseFloat(val || 0) * unidades) / 1000000, 0);
      
      return total + totalLiquidos + totalOtros + totalConstruccion;
    }, 0);
  };

  // Función para enviar email y actualizar estado
  const handleEnviarEmail = async () => {
    let nuevoEstado, motivo;
    
    // Determinar estado y motivo basado en el asunto del email
    if (emailSubject.includes("Aprobado")) {
      nuevoEstado = "Aprobado";
      motivo = "Aprobado";
    } else if (emailSubject.includes("Rechazado")) {
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

  // Manejar acción de firmar (anterior - mantener como respaldo)
  const handleFirmarAnterior = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/updateEstado/${selectedCliente.idInformacionF}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Aprobado" }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert("El formulario ha sido aprobado.");
      setSelectedCliente(null); // Volver a la lista de clientes
      
      // Usar la función correcta según el contexto
      if (fetchClientes && typeof fetchClientes === 'function') {
        fetchClientes(); // Función del componente padre
      } else {
        fetchClientesInternal(); // Función interna
      }
    } catch (error) {
      console.error("Error al aprobar el formulario:", error);
      alert("Hubo un error al aprobar el formulario.");
    }
  };

  // Manejar acción de rechazar (anterior - mantener como respaldo)
  const handleRechazarAnterior = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/updateEstado/${selectedCliente.idInformacionF}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Rechazado" }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert("El formulario ha sido rechazado.");
      setSelectedCliente(null); // Volver a la lista de clientes
      
      // Usar la función correcta según el contexto
      if (fetchClientes && typeof fetchClientes === 'function') {
        fetchClientes(); // Función del componente padre
      } else {
        fetchClientesInternal(); // Función interna
      }
    } catch (error) {
      console.error("Error al rechazar el formulario:", error);
      alert("Hubo un error al rechazar el formulario.");
    }
  };

  return (
    <div
      className={`relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded ${
        color === "light" ? "bg-white" : "bg-blueGray-700 text-white"
      }`}
    >
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
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.idInformacionF} className="border-t text-center">
                  <td className="p-2">{cliente.nombre}</td>
                  <td className="p-2">{cliente.nit}</td>
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
                      {empaquesPrimarios.map((producto, index) => (
                        <tr key={index} className="text-center">
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
                      ))}
                    </tbody>
                  </table>
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
                      {empaquesSecundarios.map((producto, index) => (
                        <tr key={index} className="text-center">
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
                      ))}
                    </tbody>
                  </table>
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
              {/* Tabla Auxiliar - Productos convertidos a toneladas */}
              <div className="mb-6">
                <h4 className="text-center font-bold mb-2">TABLA AUXILIAR - PRODUCTOS (Toneladas)</h4>
                <table className="w-full table-auto border-separate border-spacing-1 border border-gray-300">
                  <thead>
                    <tr className="bg-purple-100">
                      <th className="px-2 py-1 text-xs font-semibold border border-gray-300">Producto</th>
                      <th colSpan={9} className="px-2 py-1 text-xs font-semibold border border-gray-300">Líquidos (ton)</th>
                      <th colSpan={7} className="px-2 py-1 text-xs font-semibold border border-gray-300">Otros Productos (ton)</th>
                      <th colSpan={7} className="px-2 py-1 text-xs font-semibold border border-gray-300">Construcción (ton)</th>
                      <th colSpan={4} className="px-2 py-1 text-xs font-semibold border border-gray-300">Totales (ton)</th>
                    </tr>
                    <tr className="bg-purple-50">
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
                    {plasticos.map((producto, index) => {
                      const liquidos = JSON.parse(producto.liquidos || "{}");
                      const otros = JSON.parse(producto.otros || "{}");
                      const construccion = JSON.parse(producto.construccion || "{}");
                      const unidades = parseFloat(producto.unidades || 0);

                      // Calcular peso total sumando todos los campos de plásticos
                      const pesoLiquidos = Object.values(liquidos).reduce((sum, val) => sum + parseFloat(val || 0), 0);
                      const pesoOtros = Object.values(otros).reduce((sum, val) => sum + parseFloat(val || 0), 0);
                      const pesoConstruccion = Object.values(construccion).reduce((sum, val) => sum + parseFloat(val || 0), 0);
                      const pesoTotal = pesoLiquidos + pesoOtros + pesoConstruccion;

                      // Debug: mostrar valores en consola
                      console.log(`Producto ${index}:`, {
                        nombre: producto.nombre_producto,
                        pesoTotal: pesoTotal,
                        unidades: unidades,
                        pesoLiquidos: pesoLiquidos,
                        pesoOtros: pesoOtros,
                        pesoConstruccion: pesoConstruccion,
                        liquidos: liquidos,
                        otros: otros,
                        construccion: construccion
                      });

                      // Calcular toneladas para cada subcampo de líquidos
                      const liquidosTon = {
                        petAgua: (parseFloat(liquidos["PET Agua"] || 0) * unidades) / 1000000,
                        petOtros: (parseFloat(liquidos["PET Otros"] || 0) * unidades) / 1000000,
                        pet: (parseFloat(liquidos.PET || 0) * unidades) / 1000000,
                        hdpe: (parseFloat(liquidos.HDPE || 0) * unidades) / 1000000,
                        pvc: (parseFloat(liquidos.PVC || 0) * unidades) / 1000000,
                        ldpe: (parseFloat(liquidos.LDPE || 0) * unidades) / 1000000,
                        pp: (parseFloat(liquidos.PP || 0) * unidades) / 1000000,
                        ps: (parseFloat(liquidos.PS || 0) * unidades) / 1000000,
                        otros: (parseFloat(liquidos.Otros || 0) * unidades) / 1000000
                      };

                      // Calcular toneladas para cada subcampo de otros productos
                      const otrosTon = {
                        pet: (parseFloat(otros.PET || 0) * unidades) / 1000000,
                        hdpe: (parseFloat(otros.HDPE || 0) * unidades) / 1000000,
                        pvc: (parseFloat(otros.PVC || 0) * unidades) / 1000000,
                        ldpe: (parseFloat(otros.LDPE || 0) * unidades) / 1000000,
                        pp: (parseFloat(otros.PP || 0) * unidades) / 1000000,
                        ps: (parseFloat(otros.PS || 0) * unidades) / 1000000,
                        otros: (parseFloat(otros.Otros || 0) * unidades) / 1000000
                      };

                      // Calcular toneladas para cada subcampo de construcción
                      const construccionTon = {
                        pet: (parseFloat(construccion.PET || 0) * unidades) / 1000000,
                        hdpe: (parseFloat(construccion.HDPE || 0) * unidades) / 1000000,
                        pvc: (parseFloat(construccion.PVC || 0) * unidades) / 1000000,
                        ldpe: (parseFloat(construccion.LDPE || 0) * unidades) / 1000000,
                        pp: (parseFloat(construccion.PP || 0) * unidades) / 1000000,
                        ps: (parseFloat(construccion.PS || 0) * unidades) / 1000000,
                        otros: (parseFloat(construccion.Otros || 0) * unidades) / 1000000
                      };

                      // Calcular totales por categoría
                      const totalLiquidos = Object.values(liquidosTon).reduce((sum, val) => sum + val, 0);
                      const totalOtros = Object.values(otrosTon).reduce((sum, val) => sum + val, 0);
                      const totalConstruccion = Object.values(construccionTon).reduce((sum, val) => sum + val, 0);
                      const totalGeneral = totalLiquidos + totalOtros + totalConstruccion;

                      return (
                        <tr key={index} className="text-center">
                          <td className="px-2 py-1 text-xs border border-gray-300">{producto.nombre_producto || `Producto ${index + 1}`}</td>
                          {/* Líquidos - Mostrar 5 decimales visualmente */}
                          <td className="px-1 py-1 text-xs border border-gray-300">{liquidosTon.petAgua.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{liquidosTon.petOtros.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{liquidosTon.pet.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{liquidosTon.hdpe.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{liquidosTon.pvc.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{liquidosTon.ldpe.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{liquidosTon.pp.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{liquidosTon.ps.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{liquidosTon.otros.toFixed(5)}</td>
                          {/* Otros Productos - Mostrar 5 decimales visualmente */}
                          <td className="px-1 py-1 text-xs border border-gray-300">{otrosTon.pet.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{otrosTon.hdpe.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{otrosTon.pvc.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{otrosTon.ldpe.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{otrosTon.pp.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{otrosTon.ps.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{otrosTon.otros.toFixed(5)}</td>
                          {/* Construcción - Mostrar 5 decimales visualmente */}
                          <td className="px-1 py-1 text-xs border border-gray-300">{construccionTon.pet.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{construccionTon.hdpe.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{construccionTon.pvc.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{construccionTon.ldpe.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{construccionTon.pp.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{construccionTon.ps.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{construccionTon.otros.toFixed(5)}</td>
                          {/* Totales */}
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-blue-100 font-semibold">{totalLiquidos.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-green-100 font-semibold">{totalOtros.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-orange-100 font-semibold">{totalConstruccion.toFixed(5)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-yellow-200 font-bold">{totalGeneral.toFixed(5)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tabla Resumen - Sumatoria de todos los productos */}
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
                      // Calcular totales acumulados de todos los productos
                      const totalesAcumulados = {
                        liquidos: {
                          petAgua: 0, petOtros: 0, pet: 0, hdpe: 0, pvc: 0, ldpe: 0, pp: 0, ps: 0, otros: 0
                        },
                        otrosProductos: {
                          pet: 0, hdpe: 0, pvc: 0, ldpe: 0, pp: 0, ps: 0, otros: 0
                        },
                        construccion: {
                          pet: 0, hdpe: 0, pvc: 0, ldpe: 0, pp: 0, ps: 0, otros: 0
                        }
                      };

                      // Acumular totales de todos los productos
                      plasticos.forEach(producto => {
                        const liquidos = JSON.parse(producto.liquidos || "{}");
                        const otros = JSON.parse(producto.otros || "{}");
                        const construccion = JSON.parse(producto.construccion || "{}");
                        const unidades = parseFloat(producto.unidades || 0);

                        // Acumular líquidos - directamente multiplicar por unidades y dividir por 1,000,000
                        totalesAcumulados.liquidos.petAgua += (parseFloat(liquidos["PET Agua"] || 0) * unidades) / 1000000;
                        totalesAcumulados.liquidos.petOtros += (parseFloat(liquidos["PET Otros"] || 0) * unidades) / 1000000;
                        totalesAcumulados.liquidos.pet += (parseFloat(liquidos.PET || 0) * unidades) / 1000000;
                        totalesAcumulados.liquidos.hdpe += (parseFloat(liquidos.HDPE || 0) * unidades) / 1000000;
                        totalesAcumulados.liquidos.pvc += (parseFloat(liquidos.PVC || 0) * unidades) / 1000000;
                        totalesAcumulados.liquidos.ldpe += (parseFloat(liquidos.LDPE || 0) * unidades) / 1000000;
                        totalesAcumulados.liquidos.pp += (parseFloat(liquidos.PP || 0) * unidades) / 1000000;
                        totalesAcumulados.liquidos.ps += (parseFloat(liquidos.PS || 0) * unidades) / 1000000;
                        totalesAcumulados.liquidos.otros += (parseFloat(liquidos.Otros || 0) * unidades) / 1000000;

                        // Acumular otros productos - directamente multiplicar por unidades y dividir por 1,000,000
                        totalesAcumulados.otrosProductos.pet += (parseFloat(otros.PET || 0) * unidades) / 1000000;
                        totalesAcumulados.otrosProductos.hdpe += (parseFloat(otros.HDPE || 0) * unidades) / 1000000;
                        totalesAcumulados.otrosProductos.pvc += (parseFloat(otros.PVC || 0) * unidades) / 1000000;
                        totalesAcumulados.otrosProductos.ldpe += (parseFloat(otros.LDPE || 0) * unidades) / 1000000;
                        totalesAcumulados.otrosProductos.pp += (parseFloat(otros.PP || 0) * unidades) / 1000000;
                        totalesAcumulados.otrosProductos.ps += (parseFloat(otros.PS || 0) * unidades) / 1000000;
                        totalesAcumulados.otrosProductos.otros += (parseFloat(otros.Otros || 0) * unidades) / 1000000;

                        // Acumular construcción - directamente multiplicar por unidades y dividir por 1,000,000
                        totalesAcumulados.construccion.pet += (parseFloat(construccion.PET || 0) * unidades) / 1000000;
                        totalesAcumulados.construccion.hdpe += (parseFloat(construccion.HDPE || 0) * unidades) / 1000000;
                        totalesAcumulados.construccion.pvc += (parseFloat(construccion.PVC || 0) * unidades) / 1000000;
                        totalesAcumulados.construccion.ldpe += (parseFloat(construccion.LDPE || 0) * unidades) / 1000000;
                        totalesAcumulados.construccion.pp += (parseFloat(construccion.PP || 0) * unidades) / 1000000;
                        totalesAcumulados.construccion.ps += (parseFloat(construccion.PS || 0) * unidades) / 1000000;
                        totalesAcumulados.construccion.otros += (parseFloat(construccion.Otros || 0) * unidades) / 1000000;
                      });

                      // Calcular totales por categoría
                      const totalLiquidosGeneral = Object.values(totalesAcumulados.liquidos).reduce((sum, val) => sum + val, 0);
                      const totalOtrosGeneral = Object.values(totalesAcumulados.otrosProductos).reduce((sum, val) => sum + val, 0);
                      const totalConstruccionGeneral = Object.values(totalesAcumulados.construccion).reduce((sum, val) => sum + val, 0);
                      const totalPlasticosGeneral = totalLiquidosGeneral + totalOtrosGeneral + totalConstruccionGeneral;

                      return (
                        <tr className="text-center bg-gray-100 font-bold">
                          <td className="px-2 py-1 text-xs font-bold border border-gray-300">TOTAL</td>
                          {/* Líquidos */}
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.liquidos.petAgua.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.liquidos.petOtros.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.liquidos.pet.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.liquidos.hdpe.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.liquidos.pvc.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.liquidos.ldpe.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.liquidos.pp.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.liquidos.ps.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.liquidos.otros.toFixed(10)}</td>
                          {/* Otros Productos */}
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.otrosProductos.pet.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.otrosProductos.hdpe.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.otrosProductos.pvc.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.otrosProductos.ldpe.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.otrosProductos.pp.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.otrosProductos.ps.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.otrosProductos.otros.toFixed(10)}</td>
                          {/* Construcción */}
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.construccion.pet.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.construccion.hdpe.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.construccion.pvc.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.construccion.ldpe.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.construccion.pp.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.construccion.ps.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300">{totalesAcumulados.construccion.otros.toFixed(10)}</td>
                          {/* Totales */}
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-blue-200 font-bold">{totalLiquidosGeneral.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-green-200 font-bold">{totalOtrosGeneral.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-orange-200 font-bold">{totalConstruccionGeneral.toFixed(10)}</td>
                          <td className="px-1 py-1 text-xs border border-gray-300 bg-red-300 font-bold text-lg">{totalPlasticosGeneral.toFixed(10)}</td>
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