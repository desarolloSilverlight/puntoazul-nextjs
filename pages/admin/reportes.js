import React, { useState, useEffect } from "react";
import Admin from "layouts/Admin.js";
import { API_BASE_URL } from "../../utils/config";
import { Bar, Pie, Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function Reportes() {
  const [literal, setLiteral] = useState("");
  const [reporte, setReporte] = useState("");
  const [cliente, setCliente] = useState("");
  const [ano, setAno] = useState(""); // Nuevo estado para año
  const [clientes, setClientes] = useState([]);
  const [anosDisponibles, setAnosDisponibles] = useState([]); // Nuevo estado para años
  const [tablaDatos, setTablaDatos] = useState([]);
  const [datosReporte, setDatosReporte] = useState(null); // Para almacenar respuesta del backend
  
  // Estados para paginación y búsqueda de la tabla
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);
  const [busquedaTabla, setBusquedaTabla] = useState("");
  
  // Estados para el reporte de rangos
  const [datosRangos, setDatosRangos] = useState(null);
  const [cargandoRangos, setCargandoRangos] = useState(false);
  // Estados para el reporte de facturación
  const [datosFacturacion, setDatosFacturacion] = useState(null);
  const [cargandoFacturacion, setCargandoFacturacion] = useState(false);

  // useEffect para cargar datos de rangos cuando sea necesario
  useEffect(() => {
    const cargarDatosRangos = async () => {
      if (datosReporte && literal === "linea_base" && reporte === "rangos" && ano) {
        setCargandoRangos(true);
        const datos = await procesarDatosRangosToneladas();
        setDatosRangos(datos);
        setCargandoRangos(false);
      } else {
        setDatosRangos(null);
      }
    };

    cargarDatosRangos();
  }, [datosReporte, literal, reporte, ano]);

  // useEffect para cargar datos de facturación cuando sea necesario
  useEffect(() => {
    const cargarFacturacion = async () => {
      if (!datosReporte || !ano || reporte !== 'facturacion') {
        setDatosFacturacion(null);
        return;
      }
      setCargandoFacturacion(true);
      try {
        if (literal === 'linea_base') {
          const datos = await procesarFacturacionLineaBase();
          setDatosFacturacion(datos);
        } else if (literal === 'literal_b') {
          const datos = await procesarFacturacionLiteralB();
          setDatosFacturacion(datos);
        } else {
          setDatosFacturacion(null);
        }
      } catch (e) {
        console.error('Error al procesar facturación:', e);
        setDatosFacturacion(null);
      } finally {
        setCargandoFacturacion(false);
      }
    };
    cargarFacturacion();
  }, [datosReporte, literal, reporte, ano]);

  // Maneja el cambio del selector de Literal y carga los clientes
  const handleLiteralChange = async (e) => {
    const value = e.target.value;
    setLiteral(value);
    setCliente(""); // Limpiar selección de cliente al cambiar literal
    setReporte(""); // Limpiar selección de reporte
    setAno(""); // Limpiar selección de año
    setTablaDatos([]); // Limpiar tabla si cambia literal
    setDatosReporte(null); // Limpiar datos de reporte
    setAnosDisponibles([]); // Limpiar años disponibles

    if (!value) {
      setClientes([]);
      return;
    }

    const perfil = value === "linea_base" ? "Vinculado" : "Asociado";
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/perfilUser?nombrePerfil=${perfil}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Clientes recibidos:", data);
        setClientes(data);
      } else {
        setClientes([]);
      }
    } catch {
      setClientes([]);
    }
  };

  // Maneja el cambio del selector de Reporte y carga los años disponibles
  const handleReporteChange = async (e) => {
    const value = e.target.value;
    setReporte(value);
    setAno(""); // Limpiar selección de año
    setTablaDatos([]); // Limpiar tabla
    setDatosReporte(null); // Limpiar datos de reporte

    // Si es toneladas o rangos de línea base, limpiar cliente ya que no se usa
  if (literal === "linea_base" && (value === "toneladas" || value === "rangos" || value === "facturacion")) {
      setCliente(""); // Limpiar cliente para toneladas y rangos
    }

  // Si es grupo, peso o facturacion de literal B, limpiar cliente ya que no se usa
  if (literal === "literal_b" && (value === "grupo" || value === "peso" || value === "facturacion")) {
      setCliente(""); // Limpiar cliente para grupo y peso
    }

    // Cargar años disponibles para reportes que los requieren
  if ((literal === "linea_base" && (value === "toneladas" || value === "rangos" || value === "facturacion")) ||
    (literal === "literal_b" && (value === "grupo" || value === "peso" || value === "facturacion"))) {
      try {
        const endpoint = literal === "linea_base" 
          ? `${API_BASE_URL}/informacion-f/getAnosReporte`
          : `${API_BASE_URL}/informacion-b/getAnosReporte`;
          
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          console.log("Años disponibles recibidos:", data);
          setAnosDisponibles(data.data || data);
        } else {
          console.error("Error al obtener años:", response.statusText);
          setAnosDisponibles([]);
        }
      } catch (error) {
        console.error("Error al cargar años:", error);
        setAnosDisponibles([]);
      }
    } else {
      setAnosDisponibles([]);
    }
  };

  // Evento del botón Buscar
  const handleBuscar = async () => {
    // Validar campos requeridos según el tipo de reporte
    if (!literal || !reporte) {
      alert("Por favor selecciona Literal y Reporte");
      return;
    }
    
    // Validar año para reportes que lo requieren
  if (((literal === "linea_base" && (reporte === "toneladas" || reporte === "rangos" || reporte === "facturacion")) ||
     (literal === "literal_b" && (reporte === "grupo" || reporte === "peso" || reporte === "facturacion"))) && !ano) {
      alert("Por favor selecciona el Año para este reporte");
      return;
    }

    try {
        // Preparar datos para enviar
        const datosEnvio = {
          literal,
          reporte: (reporte === "rangos" || (literal === 'linea_base' && reporte === 'facturacion')) ? "toneladas" : reporte, // Para rangos y facturación LB, solicitar toneladas
        };

        // Determinar endpoint según el literal
        let endpoint;
        if (literal === "linea_base") {
          endpoint = `${API_BASE_URL}/informacion-f/reportes`;
          
          // Para toneladas, rangos y facturación, no enviar cliente (todos los clientes)
          if (reporte === "toneladas" || reporte === "rangos" || reporte === "facturacion") {
            datosEnvio.cliente = null; // Explícitamente null para todos los clientes
            datosEnvio.ano = parseInt(ano);
          } else {
            // Para otros reportes, usar el cliente seleccionado
            datosEnvio.cliente = cliente || null;
          }
        } else if (literal === "literal_b") {
          // Para grupo y peso, usar endpoint específico
          if (reporte === "grupo" || reporte === "peso" || reporte === "facturacion") {
            endpoint = `${API_BASE_URL}/informacion-b/reporteGrupoPeso`;
            datosEnvio.cliente = null; // Todos los clientes
            datosEnvio.ano = parseInt(ano);
          } else if (reporte === "estado") {
            endpoint = `${API_BASE_URL}/informacion-b/reporteEstado`;
            datosEnvio.cliente = cliente || null;
          }
        }

        console.log("Datos enviados al backend:", datosEnvio);
        console.log("Endpoint utilizado:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosEnvio),
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log("=== Datos recibidos del backend ===", data);
        
        // Verificar si los datos vienen en una propiedad específica
        let datosParaTabla = data;
        if (data && data.data && Array.isArray(data.data)) {
          datosParaTabla = data.data;
        } else if (data && data.empresas && Array.isArray(data.empresas)) {
          datosParaTabla = data.empresas;
        } else if (data && data.result && Array.isArray(data.result)) {
          datosParaTabla = data.result;
        }
        
        setDatosReporte(datosParaTabla);
        setTablaDatos(datosParaTabla);
        
        // Debug temporal: mostrar valores únicos de grupo para reportes de grupo
        if (literal === "literal_b" && reporte === "grupo" && Array.isArray(datosParaTabla)) {
          const gruposUnicos = [...new Set(datosParaTabla.map(empresa => {
            const grupo = empresa.grupo;
            console.log(`Empresa: ${empresa.nombre} - Grupo: "${grupo}" (tipo: ${typeof grupo})`);
            return grupo;
          }))];
          console.log("=== VALORES ÚNICOS DE GRUPO ENCONTRADOS ===", gruposUnicos);
        }
        
        // Reset pagination when new data arrives
        setPaginaActual(1);
        setBusquedaTabla("");
      } else {
        console.error("Error en la respuesta:", response.statusText);
        alert("Error al obtener los datos del reporte");
      }
    } catch (error) {
      console.error("Error al realizar la consulta:", error);
      alert("Error de conexión al obtener el reporte");
    }
  };

  // Genera 10 datos de ejemplo para la tabla
  const generarDatosEjemplo = () => {
    return Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      campo1: `Dato ${i + 1} - ${literal}`,
      campo2: `Reporte: ${reporte}`,
      campo3: `Cliente: ${cliente}`,
    }));
  };

  // Procesa los datos de toneladas para comparación
  const procesarDatosToneladas = () => {
    if (!datosReporte || !Array.isArray(datosReporte) || datosReporte.length === 0) {
      return null;
    }

    const empresasComparacion = [];
    const anosDisponiblesOrdenados = [...anosDisponibles].sort((a, b) => a - b);
    
    datosReporte.forEach((empresa, index) => {
      const datosEmpresa = {
        nombre: empresa.nombre || 'N/A',
        nit: empresa.nit || 'N/A',
        ciudad: empresa.ciudad || 'N/A',
        toneladas: {}
      };

      // Extraer toneladas_reportadas para cada año disponible desde la propiedad 'anos'
      anosDisponiblesOrdenados.forEach(year => {
        const yearStr = year.toString();
        
        if (empresa.anos && empresa.anos[yearStr] && empresa.anos[yearStr].toneladas_reportadas !== undefined && empresa.anos[yearStr].toneladas_reportadas !== null) {
          // Convertir string con coma a punto decimal y luego a float
          let valor = empresa.anos[yearStr].toneladas_reportadas;
          if (typeof valor === 'string') {
            valor = valor.replace(',', '.').trim();
          }
          
          const numeroConvertido = parseFloat(valor);
          // Usar isNaN para verificar si la conversión fue exitosa, en lugar de usar ||
          datosEmpresa.toneladas[yearStr] = isNaN(numeroConvertido) ? 0 : numeroConvertido;
          
          // Debug temporal para verificar la conversión - SOLO SI HAY PROBLEMA
          if (empresa.anos[yearStr].toneladas_reportadas !== "0" && empresa.anos[yearStr].toneladas_reportadas !== 0) {
            console.log(`🔍 ${empresa.nombre} - Año ${yearStr}: "${empresa.anos[yearStr].toneladas_reportadas}" -> ${datosEmpresa.toneladas[yearStr]}`);
          }
        } else {
          datosEmpresa.toneladas[yearStr] = 0;
        }
      });

      empresasComparacion.push(datosEmpresa);
    });

    return { empresasComparacion, anosDisponiblesOrdenados };
  };

  // Calcula el cambio porcentual entre años
  const calcularCambioPorcentual = (valorAnterior, valorActual) => {
    if (valorAnterior === 0) {
      return valorActual > 0 ? 100 : 0;
    }
    return ((valorActual - valorAnterior) / valorAnterior) * 100;
  };

  // Filtrar y paginar datos de la tabla
  const filtrarYPaginarDatos = (empresasComparacion) => {
    // Filtrar por búsqueda
    const datosFiltrados = empresasComparacion.filter(empresa =>
      empresa.nombre.toLowerCase().includes(busquedaTabla.toLowerCase()) ||
      empresa.nit.includes(busquedaTabla) ||
      (empresa.grupo && empresa.grupo.toLowerCase().includes(busquedaTabla.toLowerCase()))
    );

    // Calcular paginación
    const totalPaginas = Math.ceil(datosFiltrados.length / filasPorPagina);
    const indiceInicio = (paginaActual - 1) * filasPorPagina;
    const indiceFin = indiceInicio + filasPorPagina;
    const datosPaginados = datosFiltrados.slice(indiceInicio, indiceFin);

    return {
      datos: datosPaginados,
      totalResultados: datosFiltrados.length,
      totalPaginas: totalPaginas
    };
  };

  // Filtrar y paginar datos de estado (incluye correo en la búsqueda)
  const filtrarYPaginarDatosEstado = (empresas) => {
    // Filtrar por búsqueda
    const datosFiltrados = empresas.filter(empresa =>
      empresa.nombre?.toLowerCase().includes(busquedaTabla.toLowerCase()) ||
      empresa.nit?.includes(busquedaTabla) ||
      (empresa.correo_facturacion || empresa.correoFacturacion || '')?.toLowerCase().includes(busquedaTabla.toLowerCase()) ||
      empresa.estado?.toLowerCase().includes(busquedaTabla.toLowerCase())
    );

    // Calcular paginación
    const totalPaginas = Math.ceil(datosFiltrados.length / filasPorPagina);
    const indiceInicio = (paginaActual - 1) * filasPorPagina;
    const indiceFin = indiceInicio + filasPorPagina;
    const datosPaginados = datosFiltrados.slice(indiceInicio, indiceFin);

    return {
      datos: datosPaginados,
      totalResultados: datosFiltrados.length,
      totalPaginas: totalPaginas
    };
  };

  // Función para exportar reporte a Excel
  const exportarAExcel = async () => {
    if (!datosReporte || !Array.isArray(datosReporte) || datosReporte.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    try {
      // Mostrar mensaje de procesamiento
      const processingAlert = "Generando archivo Excel con gráficas, por favor espere...";
      console.log(processingAlert);

      // Crear un nuevo libro de trabajo con ExcelJS
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema Punto Azul';
      workbook.created = new Date();
      
      // Determinar el nombre del archivo
      const tipoLiteral = literal === 'linea_base' ? 'Linea_Base' : 'Literal_B';
      const nombreArchivo = `Reporte_${tipoLiteral}_${reporte}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Preparar datos según el tipo de reporte
      let datosParaExcel = [];
      let encabezados = [];

  if (reporte === 'toneladas' && literal === 'linea_base') {
        // Reporte de toneladas - comparación por años
        const datosProcesados = procesarDatosToneladas();
        if (datosProcesados) {
          const { empresasComparacion, anosDisponiblesOrdenados } = datosProcesados;
          
          encabezados = ['Empresa', 'NIT', 'Ciudad'];
          anosDisponiblesOrdenados.forEach(year => {
            encabezados.push(`Toneladas ${year}`);
          });
          if (anosDisponiblesOrdenados.length >= 2) {
            encabezados.push('% Cambio');
          }

          datosParaExcel = empresasComparacion.map(empresa => {
            const fila = [empresa.nombre, empresa.nit, empresa.ciudad];
            
            anosDisponiblesOrdenados.forEach(year => {
              fila.push(empresa.toneladas[year.toString()]);
            });

            if (anosDisponiblesOrdenados.length >= 2) {
              const anoAnterior = anosDisponiblesOrdenados[0].toString();
              const anoActual = anosDisponiblesOrdenados[1].toString();
              const valorAnterior = empresa.toneladas[anoAnterior];
              const valorActual = empresa.toneladas[anoActual];
              const cambio = calcularCambioPorcentual(valorAnterior, valorActual);
              fila.push(`${cambio.toFixed(1)}%`);
            }

            return fila;
          });
        }
      } else if (reporte === 'rangos' && literal === 'linea_base') {
        // Reporte de rangos
        if (datosRangos) {
          encabezados = ['Rango (Toneladas)', 'N° Empresas', 'Porcentaje'];
          datosParaExcel = datosRangos.map(item => [
            item.rango,
            item.numeroEmpresas,
            `${item.porcentaje}%`
          ]);
        }
      } else if (reporte === 'grupo' && literal === 'literal_b') {
        // Reporte de grupos
        encabezados = ['Empresa', 'NIT', 'Año', 'Grupo'];
        datosParaExcel = datosReporte.map(empresa => [
          empresa.nombre || 'N/A',
          empresa.nit || 'N/A',
          empresa.ano || ano,
          empresa.grupo || 'Sin grupo'
        ]);
      } else if (reporte === 'peso' && literal === 'literal_b') {
        // Reporte de peso
        encabezados = ['Empresa', 'NIT', 'Año', 'Peso Facturación (Kg)'];
        datosParaExcel = datosReporte.map(empresa => [
          empresa.nombre || 'N/A',
          empresa.nit || 'N/A',
          empresa.ano || ano,
          parseFloat(empresa.totalPesoFacturacion || 0).toFixed(2)
        ]);
      } else if (reporte === 'facturacion' && literal === 'literal_b') {
        // Reporte de facturación por Grupo - Literal B
        encabezados = ['Grupo', 'Empresas', 'Toneladas', 'Valor Unitario', 'Facturación Total'];
        if (Array.isArray(datosFacturacion)) {
          datosParaExcel = datosFacturacion.map(item => [
            item.grupo,
            item.empresas,
            Number(item.toneladas || 0),
            Number(item.valor || 0),
            Number(item.facturacion || 0)
          ]);
          // Agregar fila TOTAL
          const totalEmp = datosFacturacion.reduce((a,b)=>a+(b.empresas||0),0);
          const totalTon = datosFacturacion.reduce((a,b)=>a+(b.toneladas||0),0);
          const totalFac = datosFacturacion.reduce((a,b)=>a+(b.facturacion||0),0);
          datosParaExcel.push(['TOTAL', totalEmp, totalTon, '-', totalFac]);
        }
      } else if (reporte === 'facturacion' && literal === 'linea_base') {
        // Reporte de facturación por Rango - Línea Base
        encabezados = ['Rango', 'Empresas', 'Toneladas', 'Valor Unitario', 'Facturación Total'];
        if (Array.isArray(datosFacturacion)) {
          datosParaExcel = datosFacturacion.map(item => [
            item.rango,
            item.empresas,
            Number(item.toneladas || 0),
            Number(item.valor || 0),
            Number(item.facturacion || 0)
          ]);
          // Agregar fila TOTAL
          const totalEmp = datosFacturacion.reduce((a,b)=>a+(b.empresas||0),0);
          const totalTon = datosFacturacion.reduce((a,b)=>a+(b.toneladas||0),0);
          const totalFac = datosFacturacion.reduce((a,b)=>a+(b.facturacion||0),0);
          datosParaExcel.push(['TOTAL', totalEmp, totalTon, '-', totalFac]);
        }
      } else if (reporte === 'estado') {
        // Reporte de estado (línea base o literal B)
        encabezados = ['Empresa', 'NIT', 'Correo Facturación', 'Estado'];
        datosParaExcel = datosReporte.map(empresa => [
          empresa.nombre || 'N/A',
          empresa.nit || 'N/A',
          empresa.correo_facturacion || empresa.correoFacturacion || 'N/A',
          empresa.estado || 'Sin estado'
        ]);
      }

      // Crear hoja de datos
      const hojaDatos = workbook.addWorksheet('Datos');
      
      // Agregar encabezados con estilo
      const headerRow = hojaDatos.addRow(encabezados);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' }
      };

      // Agregar datos
      datosParaExcel.forEach(fila => {
        hojaDatos.addRow(fila);
      });

      // Ajustar ancho de columnas
      hojaDatos.columns.forEach(column => {
        column.width = 20;
      });

      // Capturar gráfica como imagen
      let imagenCapturada = false;
      
      // Buscar gráficas en diferentes contenedores
      const chartSelectors = [
        '#chart-container',
        '#dynamic-chart-container', 
        '.chart-container'
      ];
      
      for (const selector of chartSelectors) {
        const chartContainer = document.querySelector(selector);
        if (chartContainer && chartContainer.querySelector('canvas')) {
          try {
            // Esperar un momento para que la gráfica se renderice completamente
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const canvas = await html2canvas(chartContainer, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              useCORS: true,
              allowTaint: true
            });
            
            // Convertir canvas a blob
            const imageBlob = await new Promise(resolve => {
              canvas.toBlob(resolve, 'image/png', 1.0);
            });
            
            if (imageBlob) {
              // Crear hoja para la gráfica
              const hojaGrafica = workbook.addWorksheet('Gráfica');
              
              // Convertir blob a array buffer
              const arrayBuffer = await imageBlob.arrayBuffer();
              
              // Agregar imagen al workbook
              const imageId = workbook.addImage({
                buffer: arrayBuffer,
                extension: 'png',
              });
              
              // Insertar imagen en la hoja
              hojaGrafica.addImage(imageId, {
                tl: { col: 1, row: 2 },
                ext: { width: 600, height: 400 }
              });
              
              // Agregar título a la gráfica
              hojaGrafica.getCell('B1').value = `Gráfica - ${tipoLiteral} - ${reporte}`;
              hojaGrafica.getCell('B1').font = { bold: true, size: 16 };
              
              imagenCapturada = true;
              console.log('Gráfica capturada y agregada exitosamente');
              break;
            }
          } catch (error) {
            console.warn(`Error capturando gráfica con selector ${selector}:`, error);
          }
        }
      }

      // Crear hoja de resumen (usando el código anterior de resumen)
      const hojaResumen = workbook.addWorksheet('Resumen');
      
      // Agregar información de resumen...
      const resumenData = [
        ['REPORTE GENERADO'],
        ['Fecha:', new Date().toLocaleString('es-CO')],
        ['Literal:', literal === 'linea_base' ? 'Línea Base' : 'Literal B'],
        ['Tipo de Reporte:', reporte],
        ['Año:', ano || 'N/A'],
        ['Cliente:', cliente || 'Todos los clientes'],
        ['Total de Registros:', datosParaExcel.length],
        ['Gráfica incluida:', imagenCapturada ? 'Sí' : 'No'],
        [],
        ['DESCRIPCIÓN:'],
        [literal === 'linea_base' ? 'Reporte de Línea Base' : 'Reporte de Literal B'],
        [`Tipo: ${reporte}`]
      ];

      resumenData.forEach((row, index) => {
        const excelRow = hojaResumen.addRow(row);
        if (index === 0) {
          excelRow.font = { bold: true, size: 14 };
        }
      });

      // Generar y descargar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, nombreArchivo);

      // Mostrar mensaje de éxito
      alert(`Reporte exportado exitosamente como: ${nombreArchivo}${imagenCapturada ? ' (con gráfica incluida)' : ' (sin gráfica)'}`);
      
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al generar el archivo Excel. Por favor intente nuevamente.');
    }
  };

  // Función para generar gráficos específicos para cada tipo de reporte
  const generateChart = () => {
    // Facturación por Grupo - Literal B
    if (literal === 'literal_b' && reporte === 'facturacion' && Array.isArray(datosFacturacion)) {
      if (!datosFacturacion.length) return null;
      const labels = datosFacturacion.map(i => i.grupo);
      const dataVals = datosFacturacion.map(i => Number(i.facturacion || 0));
      const data = {
        labels,
        datasets: [{
          label: 'Facturación Total',
          data: dataVals,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }]
      };
      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Facturación por Grupo - Año {ano}
          </h3>
          <Bar data={data} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.parsed.y || 0;
                    return `Facturación: ${value.toFixed(2)}`;
                  }
                }
              }
            },
            scales: { y: { beginAtZero: true } }
          }} />
        </div>
      );
    }

    // Facturación por Rango - Línea Base
    if (literal === 'linea_base' && reporte === 'facturacion' && Array.isArray(datosFacturacion)) {
      if (!datosFacturacion.length) return null;
      const labels = datosFacturacion.map(i => i.rango);
      const dataVals = datosFacturacion.map(i => Number(i.facturacion || 0));
      const data = {
        labels,
        datasets: [{
          label: 'Facturación Total',
          data: dataVals,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }]
      };
      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Facturación por Rango - Año {ano}
          </h3>
          <Bar data={data} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.parsed.y || 0;
                    return `Facturación: ${value.toFixed(2)}`;
                  }
                }
              }
            },
            scales: { y: { beginAtZero: true } }
          }} />
        </div>
      );
    }
    // Chart para reportes de línea base - tipo de producto
    if (literal === 'linea_base' && reporte === 'tipo_producto' && datosReporte) {
      const productos = datosReporte.reduce((acc, empresa) => {
        if (empresa.productos && Array.isArray(empresa.productos)) {
          empresa.productos.forEach(producto => {
            const tipo = producto.tipoProducto || 'Sin categoría';
            acc[tipo] = (acc[tipo] || 0) + 1;
          });
        }
        return acc;
      }, {});

      const data = {
        labels: Object.keys(productos),
        datasets: [{
          label: 'Número de Productos',
          data: Object.values(productos),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        }]
      };

      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Distribución por Tipo de Producto
          </h3>
          <div className="max-w-md mx-auto">
            <Pie data={data} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${label}: ${value} productos (${percentage}%)`;
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      );
    }

    // Chart para reportes de peso de línea base
    if (literal === 'linea_base' && reporte === 'peso' && datosReporte) {
      const pesoTotal = datosReporte.reduce((total, empresa) => {
        return total + (parseFloat(empresa.totalPesoFacturacion) || 0);
      }, 0);

      // Definir rangos de peso
      const rangos = [
        { nombre: '0-10 Kg', min: 0, max: 10 },
        { nombre: '11-50 Kg', min: 11, max: 50 },
        { nombre: '51-100 Kg', min: 51, max: 100 },
        { nombre: '101-500 Kg', min: 101, max: 500 },
        { nombre: '501-1000 Kg', min: 501, max: 1000 },
        { nombre: 'Más de 1000 Kg', min: 1001, max: Infinity }
      ];

      const datosPorRango = rangos.map(rango => {
        const count = datosReporte.filter(empresa => {
          const peso = parseFloat(empresa.totalPesoFacturacion) || 0;
          return peso >= rango.min && peso <= rango.max;
        }).length;

        return {
          rango: rango.nombre,
          count: count
        };
      });

      const data = {
        labels: datosPorRango.map(item => item.rango),
        datasets: [{
          label: 'Número de Empresas',
          data: datosPorRango.map(item => item.count),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }]
      };

      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Distribución por Rangos de Peso
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-700 text-center">
              <strong>Peso Total Facturado:</strong> {pesoTotal.toFixed(2)} Kg
            </p>
          </div>
          <Bar data={data} options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.parsed.y || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${value} empresas (${percentage}%)`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }} />
        </div>
      );
    }

    // Chart para reporte de grupo de Literal B
    if (literal === 'literal_b' && reporte === 'grupo' && datosReporte) {
      const grupos = datosReporte.reduce((acc, empresa) => {
        const grupo = empresa.grupo || 'Sin grupo';
        acc[grupo] = (acc[grupo] || 0) + 1;
        return acc;
      }, {});

      const data = {
        labels: Object.keys(grupos),
        datasets: [{
          label: 'Número de Empresas',
          data: Object.values(grupos),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
          ],
          borderWidth: 1,
        }]
      };

      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Distribución por Grupos - Año {ano}
          </h3>
          <Bar data={data} options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.parsed.y || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${value} empresas (${percentage}%)`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }} />
        </div>
      );
    }

    // Chart para reporte de peso de Literal B
    if (literal === 'literal_b' && reporte === 'peso' && datosReporte) {
      const pesoTotal = datosReporte.reduce((total, empresa) => {
        return total + (parseFloat(empresa.totalPesoFacturacion) || 0);
      }, 0);

      // Crear rangos dinámicos basados en los datos
      const pesos = datosReporte
        .map(empresa => parseFloat(empresa.totalPesoFacturacion) || 0)
        .filter(peso => peso > 0)
        .sort((a, b) => a - b);

      if (pesos.length === 0) {
        return (
          <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold mb-4">
              Distribución por Peso - Año {ano}
            </h3>
            <p className="text-gray-600">No hay datos de peso disponibles</p>
          </div>
        );
      }

      // Definir rangos basados en cuartiles
      const q1 = pesos[Math.floor(pesos.length * 0.25)];
      const q2 = pesos[Math.floor(pesos.length * 0.5)];
      const q3 = pesos[Math.floor(pesos.length * 0.75)];
      const max = pesos[pesos.length - 1];

      const rangos = [
        { nombre: `0 - ${q1.toFixed(0)} Kg`, min: 0, max: q1, color: 'rgba(255, 99, 132, 0.6)' },
        { nombre: `${(q1 + 0.01).toFixed(0)} - ${q2.toFixed(0)} Kg`, min: q1 + 0.01, max: q2, color: 'rgba(54, 162, 235, 0.6)' },
        { nombre: `${(q2 + 0.01).toFixed(0)} - ${q3.toFixed(0)} Kg`, min: q2 + 0.01, max: q3, color: 'rgba(255, 205, 86, 0.6)' },
        { nombre: `${(q3 + 0.01).toFixed(0)} - ${max.toFixed(0)} Kg`, min: q3 + 0.01, max: max, color: 'rgba(75, 192, 192, 0.6)' }
      ];

      const datosPorRango = rangos.map(rango => {
        const empresas = datosReporte.filter(empresa => {
          const peso = parseFloat(empresa.totalPesoFacturacion) || 0;
          return peso >= rango.min && peso <= rango.max;
        });

        const pesoRango = empresas.reduce((total, empresa) => {
          return total + (parseFloat(empresa.totalPesoFacturacion) || 0);
        }, 0);

        return {
          rango: rango.nombre,
          count: empresas.length,
          peso: pesoRango,
          color: rango.color
        };
      });

      const data = {
        labels: datosPorRango.map(item => item.rango),
        datasets: [{
          label: 'Peso (Kg)',
          data: datosPorRango.map(item => item.peso),
          backgroundColor: datosPorRango.map(item => item.color),
          borderColor: datosPorRango.map(item => item.color.replace('0.6', '1')),
          borderWidth: 1,
        }]
      };

      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Distribución por Peso - Año {ano}
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-700 text-center">
              <strong>Peso Total Facturado:</strong> {pesoTotal.toFixed(2)} Kg
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <Pie data={data} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      const rangeData = datosPorRango[context.dataIndex];
                      return [
                        `${label}`,
                        `${value.toFixed(2)} Kg (${percentage}%)`,
                        `${rangeData.count} empresas`
                      ];
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      );
    }

    // Chart para reporte de estado (tanto línea base como Literal B)
    if (reporte === 'estado' && datosReporte) {
      const estados = datosReporte.reduce((acc, empresa) => {
        const estado = empresa.estado || 'Sin estado';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {});

      const data = {
        labels: Object.keys(estados),
        datasets: [{
          label: 'Número de Empresas',
          data: Object.values(estados),
          backgroundColor: Object.keys(estados).map(estado => {
            const estadoLower = estado.toLowerCase();
            if (estadoLower.includes('finalizado') || estadoLower.includes('aprobado')) return 'rgba(34, 197, 94, 0.6)';
            if (estadoLower.includes('firmado')) return 'rgba(34, 197, 94, 0.6)';
            if (estadoLower.includes('guardado')) return 'rgba(59, 130, 246, 0.6)';
            if (estadoLower.includes('pendiente')) return 'rgba(245, 158, 11, 0.6)';
            if (estadoLower.includes('rechazado')) return 'rgba(239, 68, 68, 0.6)';
            if (estadoLower.includes('iniciado')) return 'rgba(156, 163, 175, 0.6)';
            return 'rgba(107, 114, 128, 0.6)';
          }),
          borderColor: Object.keys(estados).map(estado => {
            const estadoLower = estado.toLowerCase();
            if (estadoLower.includes('finalizado') || estadoLower.includes('aprobado')) return 'rgba(34, 197, 94, 1)';
            if (estadoLower.includes('firmado')) return 'rgba(34, 197, 94, 1)';
            if (estadoLower.includes('guardado')) return 'rgba(59, 130, 246, 1)';
            if (estadoLower.includes('pendiente')) return 'rgba(245, 158, 11, 1)';
            if (estadoLower.includes('rechazado')) return 'rgba(239, 68, 68, 1)';
            if (estadoLower.includes('iniciado')) return 'rgba(156, 163, 175, 1)';
            return 'rgba(107, 114, 128, 1)';
          }),
          borderWidth: 1,
        }]
      };

      const title = literal === 'literal_b' 
        ? `Estados de Literal B${cliente ? ` - ${cliente}` : ''}`
        : `Estados de Línea Base${cliente ? ` - ${cliente}` : ''}`;

      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-center">
            {title}
          </h3>
          <div className="max-w-md mx-auto">
            <Pie data={data} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.parsed || 0;
                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      return `${label}: ${value} empresas (${percentage}%)`;
                    }
                  }
                }
              }
            }} />
          </div>
        </div>
      );
    }

    return null;
  };

  // Resetear paginación cuando cambia la búsqueda
  const handleBusquedaChange = (e) => {
    setBusquedaTabla(e.target.value);
    setPaginaActual(1);
  };

  // Función para obtener el parámetro de rangos desde el backend
  const obtenerParametroRangos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/parametros`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (response.ok) {
        const parametros = await response.json();
        const parametroRangos = parametros.find(p => p.nombre === "Rango Toneladas Linea Base");
        
        if (parametroRangos) {
          try {
            const datosRangos = JSON.parse(parametroRangos.valor);
            console.log("Parámetro de rangos obtenido:", datosRangos);
            return datosRangos.data || []; // Retorna el array de datos
          } catch (error) {
            console.error("Error al parsear parámetro de rangos:", error);
            return [];
          }
        }
      }
      return [];
    } catch (error) {
      console.error("Error al obtener parámetro de rangos:", error);
      return [];
    }
  };

  // Parámetros de facturación: Línea Base (sin grupo)
  const obtenerParametroFacturacionLB = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/parametros`, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
      if (!response.ok) return [];
      const parametros = await response.json();
      const param = parametros.find(p => p.nombre === 'Rango Toneladas Linea Base');
      if (!param) return [];
      const json = JSON.parse(param.valor);
      const data = json.data || [];
      return data.map(r => ({
        min: parseFloat(r.rangoini ?? r.rango_ini ?? r.RangoIni),
        max: parseFloat(r.rangofin ?? r.rango_fin ?? r.RangoFin),
        valor: parseFloat(r.valor ?? r.Valor ?? 0),
        label: `${r.rangoini ?? r.rango_ini ?? r.RangoIni} - ${r.rangofin ?? r.rango_fin ?? r.RangoFin}`
      })).filter(x => !isNaN(x.min) && !isNaN(x.max));
    } catch (e) {
      console.error('Error al obtener parámetro facturación LB:', e);
      return [];
    }
  };

  // Parámetros de facturación: Literal B (por grupo)
  const obtenerParametroFacturacionB = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/parametros`, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
      if (!response.ok) return [];
      const parametros = await response.json();
      const param = parametros.find(p => p.nombre === 'Rango Toneladas Literal B');
      if (!param) return [];
      const json = JSON.parse(param.valor);
      const data = json.data || [];
      return data.map(r => ({
        grupo: (r.grupo ?? r.Grupo ?? '').toString(),
        min: parseFloat(r.rango_ini ?? r.rangoini ?? r.RangoIni),
        max: parseFloat(r.rango_fin ?? r.rangofin ?? r.RangoFin),
        valor: parseFloat(r.valor ?? r.Valor ?? 0)
      })).filter(x => x.grupo && !isNaN(x.min) && !isNaN(x.max));
    } catch (e) {
      console.error('Error al obtener parámetro facturación B:', e);
      return [];
    }
  };

  // Procesar facturación para Línea Base
  const procesarFacturacionLineaBase = async () => {
    if (!datosReporte || !Array.isArray(datosReporte)) return [];
    const rangos = await obtenerParametroFacturacionLB();
    if (!rangos.length) return [];
    const anoStr = ano.toString();
    const empresas = datosReporte.map(e => {
      let t = e.anos?.[anoStr]?.toneladas_reportadas ?? 0;
      if (typeof t === 'string') { t = parseFloat(t.replace(',', '.')) || 0; } else { t = parseFloat(t) || 0; }
      return { nombre: e.nombre, nit: e.nit, toneladas: t };
    });
    const resultado = rangos.map(r => ({ rango: r.label, min: r.min, max: r.max, empresas: 0, toneladas: 0, valor: r.valor, facturacion: 0 }));
    empresas.forEach(emp => {
      const r = resultado.find(x => emp.toneladas >= x.min && emp.toneladas <= x.max);
      if (!r) return;
      r.empresas += 1;
      r.toneladas += emp.toneladas;
      r.facturacion += emp.toneladas * (r.valor || 0);
    });
    return resultado;
  };

  // Procesar facturación para Literal B
  const procesarFacturacionLiteralB = async () => {
    if (!datosReporte || !Array.isArray(datosReporte)) return [];
    const parametros = await obtenerParametroFacturacionB();
    if (!parametros.length) return [];
    const grupos = {};
    datosReporte.forEach(e => {
      const grupo = e.grupo || 'Sin grupo';
      const t = parseFloat(e.totalPesoFacturacion ?? 0) || 0;
      const key = grupo.toString();
      if (!grupos[key]) grupos[key] = { grupo: key, empresas: 0, toneladas: 0 };
      grupos[key].empresas += 1;
      grupos[key].toneladas += t;
    });
    const resultado = Object.values(grupos).map(g => {
      const candidatos = parametros.filter(p => p.grupo === g.grupo);
      let valor = 0;
      if (candidatos.length) {
        const match = candidatos.find(p => g.toneladas >= p.min && g.toneladas <= p.max);
        valor = match ? (match.valor || 0) : (candidatos[0].valor || 0);
      }
      const facturacion = g.toneladas * valor;
      return { grupo: g.grupo, empresas: g.empresas, toneladas: parseFloat(g.toneladas.toFixed(2)), valor, facturacion: parseFloat(facturacion.toFixed(2)) };
    });
    return resultado;
  };

  // Función para procesar datos de rangos de toneladas
  const procesarDatosRangosToneladas = async () => {
    if (!datosReporte || !Array.isArray(datosReporte) || datosReporte.length === 0) {
      return null;
    }

    console.log("=== PROCESANDO RANGOS DE TONELADAS ===");
    console.log("Año seleccionado para clasificación:", ano);
    
    // Obtener configuración de rangos desde parámetros
    const rangosConfig = await obtenerParametroRangos();
    if (!rangosConfig || rangosConfig.length === 0) {
      console.error("No se encontró configuración de rangos");
      alert("No se encontró la configuración de 'Rango Toneladas Linea Base' en parámetros");
      return null;
    }

    console.log("Configuración de rangos:", rangosConfig);

    // Extraer toneladas del año seleccionado para cada empresa
    const empresasConToneladas = [];
    let empresasSinDatos = 0;

    datosReporte.forEach((empresa, index) => {
      const anoStr = ano.toString();
      
      if (empresa.anos && empresa.anos[anoStr]) {
        let toneladas = empresa.anos[anoStr].toneladas_reportadas;
        
        // Manejar valores null, undefined o string con comas
        if (toneladas === null || toneladas === undefined) {
          toneladas = 0;
        } else if (typeof toneladas === 'string') {
          toneladas = toneladas.replace(',', '.');
          toneladas = parseFloat(toneladas) || 0;
        } else {
          toneladas = parseFloat(toneladas) || 0;
        }

        empresasConToneladas.push({
          nombre: empresa.nombre,
          nit: empresa.nit,
          ciudad: empresa.ciudad,
          toneladas: toneladas
        });

        if (index < 5) { // Log de las primeras 5 empresas
          console.log(`Empresa ${index + 1}: ${empresa.nombre} - ${toneladas} toneladas`);
        }
      } else {
        empresasSinDatos++;
      }
    });

    console.log(`Total empresas procesadas: ${empresasConToneladas.length}`);
    console.log(`Empresas sin datos para el año ${ano}: ${empresasSinDatos}`);

    // Clasificar empresas en rangos
    const clasificacionRangos = rangosConfig.map(rango => {
      // Estructura específica: RangoIni y RangoFin
      const rangoMin = parseFloat(rango.RangoIni);
      const rangoMax = parseFloat(rango.RangoFin);
      const etiquetaRango = `${rango.RangoIni} - ${rango.RangoFin}`;

      // Contar empresas en este rango
      const empresasEnRango = empresasConToneladas.filter(empresa => {
        return empresa.toneladas >= rangoMin && empresa.toneladas <= rangoMax;
      });

      console.log(`Rango ${etiquetaRango}: ${empresasEnRango.length} empresas`);

      return {
        rango: etiquetaRango,
        min: rangoMin,
        max: rangoMax,
        numeroEmpresas: empresasEnRango.length,
        empresas: empresasEnRango // Para debugging
      };
    });

    // Calcular porcentajes
    const totalEmpresas = empresasConToneladas.length;
    const resultado = clasificacionRangos.map(item => ({
      ...item,
      porcentaje: totalEmpresas > 0 ? ((item.numeroEmpresas / totalEmpresas) * 100).toFixed(1) : 0
    }));

    // Agregar fila de total
    resultado.push({
      rango: "TOTAL",
      numeroEmpresas: totalEmpresas,
      porcentaje: "100.0",
      isTotal: true
    });

    console.log("Clasificación final:", resultado);
    return resultado;
  };

  // Genera datos de ejemplo para los gráficos
  const getChartData = () => {
    if (!datosReporte || !datosReporte.length) return null;
    
    // Solo manejar reportes específicos aquí, otros son manejados por generateChart()
  if (literal === 'literal_b' && (reporte === 'grupo' || reporte === 'peso' || reporte === 'estado' || reporte === 'facturacion')) {
      return null; // Estos son manejados por generateChart()
    }
    
  if (literal === 'linea_base' && (reporte === 'estado' || reporte === 'facturacion')) {
      return null; // También manejado por generateChart()
    }
    
    switch (reporte) {
      case 'rangos':
        // Gráficos específicos para rangos de toneladas
        if (!datosRangos || datosRangos.length === 0) return null;
        
        // Filtrar la fila TOTAL para los gráficos
        const datosSinTotal = datosRangos.filter(item => !item.isTotal);
        
        return {
          type: 'dual',
          charts: [
            {
              type: 'bar',
              title: 'Número de Empresas por Rango',
              data: {
                labels: datosSinTotal.map(item => item.rango),
                datasets: [{
                  label: 'N° Empresas',
                  data: datosSinTotal.map(item => item.numeroEmpresas),
                  backgroundColor: '#3b82f6',
                  borderColor: '#1d4ed8',
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Distribución de Empresas por Rango de Toneladas'
                  },
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  },
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45
                    }
                  }
                }
              }
            },
            {
              type: 'line',
              title: 'Porcentaje por Rango',
              data: {
                labels: datosSinTotal.map(item => item.rango),
                datasets: [{
                  label: 'Porcentaje (%)',
                  data: datosSinTotal.map(item => parseFloat(item.porcentaje)),
                  borderColor: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  pointBackgroundColor: '#ef4444',
                  pointBorderColor: '#dc2626',
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  fill: true,
                  tension: 0.4
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Porcentaje de Empresas por Rango de Toneladas'
                  },
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: Math.max(...datosSinTotal.map(item => parseFloat(item.porcentaje))) * 1.2,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  },
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45
                    }
                  }
                }
              }
            }
          ]
        };
      case 'toneladas':
        const datosProcesados = procesarDatosToneladas();
        if (!datosProcesados) return null;

        const { empresasComparacion, anosDisponiblesOrdenados } = datosProcesados;
        
        // Contar empresas que aumentaron, disminuyeron o mantuvieron
        let aumentaron = 0, disminuyeron = 0, mantuvieron = 0;
        
        if (anosDisponiblesOrdenados.length >= 2) {
          const anoAnterior = anosDisponiblesOrdenados[0].toString();
          const anoActual = anosDisponiblesOrdenados[1].toString();
          
          empresasComparacion.forEach(empresa => {
            const valorAnterior = empresa.toneladas[anoAnterior];
            const valorActual = empresa.toneladas[anoActual];
            
            if (valorActual > valorAnterior) aumentaron++;
            else if (valorActual < valorAnterior) disminuyeron++;
            else mantuvieron++;
          });
        }

        return {
          type: 'pie',
          data: {
            labels: ['Aumentaron', 'Disminuyeron', 'Se Mantuvieron'],
            datasets: [{
              label: 'Empresas',
              data: [aumentaron, disminuyeron, mantuvieron],
              backgroundColor: ['#22c55e', '#ef4444', '#fbbf24']
            }]
          },
          options: { 
            responsive: true,
            plugins: { 
              title: {
                display: true,
                text: `Comparación de Toneladas Reportadas`
              },
              legend: {
                position: 'bottom'
              }
            }
          }
        };
      case 'estado':
        // Los reportes de estado son manejados por generateChart(), no por getChartData()
        return null;
      default:
        return null;
    }
  };

  const opcionesReporte =
    literal === "literal_b"
      ? [
          { value: "grupo", label: "Grupo" },
          { value: "peso", label: "Peso" },
          { value: "facturacion", label: "Facturación" },
          { value: "estado", label: "Estado" },
        ]
      : literal === "linea_base"
      ? [
          { value: "toneladas", label: "Toneladas" }, 
          { value: "rangos", label: "Rango Toneladas" },
          { value: "facturacion", label: "Facturación" },
          { value: "estado", label: "Estado" },
        ]
      : [];

  return (
    <>
      <div className="flex flex-wrap justify-center mt-8">
        <div className="w-full max-w-2xl bg-white rounded shadow-lg p-6">
          <h2 className="text-blueGray-700 text-xl font-semibold mb-6">Reportes</h2>
          <div className={`grid gap-4 p-2 ${
            ((literal === "linea_base" && (reporte === "toneladas" || reporte === "rangos" || reporte === "facturacion")) ||
             (literal === "literal_b" && (reporte === "grupo" || reporte === "peso" || reporte === "facturacion")))
              ? "grid-cols-4" // Sin cliente: Literal, Reporte, Año, Botón
              : "grid-cols-5" // Con cliente: Literal, Reporte, Cliente, Año (opcional), Botón
          }`}>
            {/* Selector Literal */}
            <div className="p-2">
              <label className="block text-xs font-semibold mb-1">Seleccione Literal</label>
              <select
                className="w-full border border-gray-300 rounded p-2"
                value={literal}
                onChange={handleLiteralChange}
              >
                <option value="">Seleccione...</option>
                <option value="linea_base">Línea Base</option>
                <option value="literal_b">Literal B</option>
              </select>
            </div>
            {/* Selector Reporte */}
            <div className="p-2">
              <label className="block text-xs font-semibold mb-1">Seleccione Reporte</label>
              <select
                className="w-full border border-gray-300 rounded p-2"
                value={reporte}
                onChange={handleReporteChange}
                disabled={!literal}
              >
                <option value="">Seleccione...</option>
                {opcionesReporte.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Selector Cliente - Solo visible si NO es toneladas/rangos de línea base o grupo/peso de literal B */}
      {!(((literal === "linea_base" && (reporte === "toneladas" || reporte === "rangos" || reporte === "facturacion")) ||
        (literal === "literal_b" && (reporte === "grupo" || reporte === "peso" || reporte === "facturacion")))) && (
              <div className="p-2">
                <label className="block text-xs font-semibold mb-1">Seleccione Cliente</label>
                <select
                  className="w-full border border-gray-300 rounded p-2"
                  value={cliente}
                  onChange={e => setCliente(e.target.value)}
                  disabled={!clientes.length}
                >
                  <option value="">Todos los clientes</option>
                  {clientes.map((c) => (
                    <option key={c.idUsuario || c.usuario_idUsuario} value={c.identificacion || c.usuario_nit}>
                      {c.nombre || c.usuario_nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Selector Año (para reportes que requieren año) */}
            {((literal === "linea_base" && (reporte === "toneladas" || reporte === "rangos" || reporte === "facturacion")) ||
              (literal === "literal_b" && (reporte === "grupo" || reporte === "peso" || reporte === "facturacion"))) && (
              <div className="p-2">
                <label className="block text-xs font-semibold mb-1">Seleccione Año</label>
                <select
                  className="w-full border border-gray-300 rounded p-2"
                  value={ano}
                  onChange={e => setAno(e.target.value)}
                  disabled={!anosDisponibles.length}
                >
                  <option value="">Seleccione año...</option>
                  {anosDisponibles.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Botón Buscar */}
            <div className="flex justify-between items-center">
              <button
                className="bg-blueGray-600 h-12 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none  ease-linear transition-all duration-150"
                onClick={handleBuscar}
                disabled={!literal || !reporte || (((literal === "linea_base" && (reporte === "toneladas" || reporte === "rangos" || reporte === "facturacion")) || (literal === "literal_b" && (reporte === "grupo" || reporte === "peso" || reporte === "facturacion"))) && !ano)}
                title={
                  ((literal === "linea_base" && (reporte === "toneladas" || reporte === "rangos" || reporte === "facturacion")) ||
                   (literal === "literal_b" && (reporte === "grupo" || reporte === "peso" || reporte === "facturacion")))
                    ? "Para estos reportes solo se requiere año"
                    : "Complete todos los campos requeridos"
                }
              >
                Buscar
              </button>
              
              {/* Botón Exportar Excel */}
              {datosReporte && Array.isArray(datosReporte) && datosReporte.length > 0 && (
                <button
                  className="bg-green h-12 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
                  onClick={exportarAExcel}
                  title="Exportar reporte a Excel"
                >
                  📊 Exportar Excel
                </button>
              )}
            </div>
          </div>
          
          {/* Tabla de datos del reporte */}
          {datosReporte && Array.isArray(datosReporte) && datosReporte.length > 0 && (
            <>
            {reporte === 'toneladas' && literal === 'linea_base' ? (
              // Tabla especializada para comparación de toneladas
              (() => {
                const datosProcesados = procesarDatosToneladas();
                
                if (!datosProcesados) {
                  return <div className="mt-8 p-4 bg-red-100 text-red-700 rounded">
                    No se pudieron procesar los datos de toneladas
                  </div>;
                }
                
                const { empresasComparacion, anosDisponiblesOrdenados } = datosProcesados;
                const { datos, totalResultados, totalPaginas } = filtrarYPaginarDatos(empresasComparacion);
                
                return (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      Comparación de Toneladas Reportadas
                    </h3>
                    
                    {/* Controles de la tabla */}
                    <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Mostrar:</label>
                        <select
                          value={filasPorPagina}
                          onChange={(e) => {setFilasPorPagina(Number(e.target.value)); setPaginaActual(1);}}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="text-sm">resultados</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Buscar:</label>
                        <input
                          type="text"
                          value={busquedaTabla}
                          onChange={handleBusquedaChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm"
                          placeholder="Empresa, NIT o Ciudad..."
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100 text-center">
                            <th className="px-4 py-2 border">Empresa</th>
                            <th className="px-4 py-2 border">NIT</th>
                            <th className="px-4 py-2 border">Ciudad</th>
                            {anosDisponiblesOrdenados.map(year => (
                              <th key={year} className="px-4 py-2 border">
                                Toneladas {year}
                              </th>
                            ))}
                            {anosDisponiblesOrdenados.length >= 2 && (
                              <th className="px-4 py-2 border">% Cambio</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {datos.map((empresa, index) => {
                            let cambio = null;
                            let colorCambio = '';
                            let iconoCambio = '';
                            
                            if (anosDisponiblesOrdenados.length >= 2) {
                              const anoAnterior = anosDisponiblesOrdenados[0].toString();
                              const anoActual = anosDisponiblesOrdenados[1].toString();
                              const valorAnterior = empresa.toneladas[anoAnterior];
                              const valorActual = empresa.toneladas[anoActual];
                              
                              cambio = calcularCambioPorcentual(valorAnterior, valorActual);
                              
                              if (cambio > 0) {
                                colorCambio = 'bg-emerald-50 text-emerald-500 border border-emerald-200';
                                iconoCambio = 'fas fa-caret-up'; // Flecha simple arriba
                              } else if (cambio < 0) {
                                colorCambio = 'bg-red-50 text-red-500 border border-red-200';
                                iconoCambio = 'fas fa-caret-down'; // Flecha simple abajo
                              } else {
                                colorCambio = 'bg-amber-50 text-amber-500 border border-amber-200';
                                iconoCambio = 'fas fa-minus'; // Sin cambio
                              }
                            }
                            
                            return (
                              <tr key={index} className="text-center hover:bg-gray-50">
                                <td className="px-4 py-2 border font-medium">
                                  {empresa.nombre}
                                </td>
                                <td className="px-4 py-2 border">{empresa.nit}</td>
                                <td className="px-4 py-2 border">{empresa.ciudad}</td>
                                {anosDisponiblesOrdenados.map(year => (
                                  <td key={year} className="px-4 py-2 border">
                                    {empresa.toneladas[year.toString()].toFixed(2)}
                                  </td>
                                ))}
                                {cambio !== null && (
                                  <td className="px-4 py-2 border">
                                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm ${colorCambio}`}>
                                      <i 
                                        className={`${iconoCambio} text-base`}
                                        title={cambio > 0 ? 'Aumentó' : cambio < 0 ? 'Disminuyó' : 'Se mantuvo igual'}
                                      ></i>
                                      <span className="font-mono">
                                        {cambio > 0 ? '+' : ''}{cambio.toFixed(1)}%
                                      </span>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Información de paginación y controles */}
                    <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {datos.length === 0 ? 0 : ((paginaActual - 1) * filasPorPagina) + 1} a{' '}
                        {Math.min(paginaActual * filasPorPagina, totalResultados)} de {totalResultados} resultados
                      </div>
                      
                      {/* Controles de paginación */}
                      {totalPaginas > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                            disabled={paginaActual === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Anterior
                          </button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                              let pageNum;
                              if (totalPaginas <= 5) {
                                pageNum = i + 1;
                              } else {
                                const start = Math.max(1, paginaActual - 2);
                                const end = Math.min(totalPaginas, start + 4);
                                pageNum = start + i;
                                if (pageNum > end) return null;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setPaginaActual(pageNum)}
                                  className={`px-3 py-1 border text-sm rounded ${
                                    paginaActual === pageNum
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : reporte === 'rangos' && literal === 'linea_base' ? (
              // Tabla especializada para rangos de toneladas
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 text-center">
                  Clasificación por Rangos de Toneladas - Año {ano}
                </h3>
                
                {cargandoRangos ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Procesando clasificación de rangos...</p>
                  </div>
                ) : !datosRangos ? (
                  <div className="text-center py-8 text-red-600">
                    <p>Error al procesar los datos de rangos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Rango (Toneladas)</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">N° Empresas</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Porcentaje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datosRangos.map((item, index) => (
                          <tr 
                            key={index} 
                            className={`${item.isTotal ? 'bg-yellow-100 font-bold' : 'hover:bg-gray-50'}`}
                          >
                            <td className="border border-gray-300 px-4 py-3">
                              {item.rango}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              {item.numeroEmpresas}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              {item.porcentaje}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : reporte === 'estado' && literal === 'linea_base' ? (
              (() => {
                const { datos, totalResultados, totalPaginas } = filtrarYPaginarDatosEstado(datosReporte);
                
                // Calcular porcentaje de empresas finalizadas
                const empresasFinalizadas = datosReporte.filter(empresa => 
                  empresa.estado?.toLowerCase().includes('finalizado')
                ).length;
                const totalEmpresas = datosReporte.length;
                const porcentajeFinalizado = totalEmpresas > 0 ? ((empresasFinalizadas / totalEmpresas) * 100).toFixed(1) : 0;
                
                return (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-6 text-center">
                      Estado de Línea Base
                    </h3>
                    
                    {/* Progress Bar de Empresas Finalizadas */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progreso de Finalización
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {empresasFinalizadas} de {totalEmpresas} empresas ({porcentajeFinalizado}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${porcentajeFinalizado}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Controles de la tabla */}
                    <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Mostrar:</label>
                        <select
                          value={filasPorPagina}
                          onChange={(e) => {setFilasPorPagina(Number(e.target.value)); setPaginaActual(1);}}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="text-sm">resultados</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Buscar:</label>
                        <input
                          type="text"
                          value={busquedaTabla}
                          onChange={handleBusquedaChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm"
                          placeholder="Empresa, NIT, Correo o Estado..."
                        />
                      </div>
                    </div>
                
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-blue-100">
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Empresa</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">NIT</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Correo Facturación</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datos.map((empresa, index) => {
                            // Función para obtener el color del estado
                            const getEstadoColor = (estado) => {
                              if (!estado) return 'bg-gray-100 text-gray-600';
                              const estadoLower = estado.toLowerCase();
                              if (estadoLower.includes('finalizado')) return 'bg-green-100 text-green-800';
                              if (estadoLower.includes('firmado')) return 'bg-green-100 text-green-800';
                              if (estadoLower.includes('guardado')) return 'bg-blue-100 text-blue-800';
                              if (estadoLower.includes('pendiente')) return 'bg-yellow-100 text-yellow-800';
                              if (estadoLower.includes('aprobado')) return 'bg-emerald-100 text-emerald-800';
                              if (estadoLower.includes('rechazado')) return 'bg-red-100 text-red-800';
                              return 'bg-gray-100 text-gray-600';
                            };

                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-3 font-medium">
                                  {empresa.nombre || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {empresa.nit || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {empresa.correo_facturacion || empresa.correoFacturacion || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(empresa.estado)}`}>
                                    {empresa.estado || 'Sin estado'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Información de paginación y controles */}
                    <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {datos.length === 0 ? 0 : ((paginaActual - 1) * filasPorPagina) + 1} a{' '}
                        {Math.min(paginaActual * filasPorPagina, totalResultados)} de {totalResultados} resultados
                        {busquedaTabla && ` (filtrado de ${totalEmpresas} total)`}
                      </div>
                      
                      {/* Controles de paginación */}
                      {totalPaginas > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                            disabled={paginaActual === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Anterior
                          </button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                              let pageNum;
                              if (totalPaginas <= 5) {
                                pageNum = i + 1;
                              } else {
                                const start = Math.max(1, paginaActual - 2);
                                const end = Math.min(totalPaginas, start + 4);
                                pageNum = start + i;
                                if (pageNum > end) return null;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setPaginaActual(pageNum)}
                                  className={`px-3 py-1 border text-sm rounded ${
                                    paginaActual === pageNum
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : reporte === 'grupo' && literal === 'literal_b' ? (
              // Tabla especializada para reporte de grupos de Literal B
              (() => {
                const { datos, totalResultados, totalPaginas } = filtrarYPaginarDatos(datosReporte);
                
                return (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      Reporte por Grupos - Literal B - Año {ano}
                    </h3>
                    
                    {/* Controles de la tabla */}
                    <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Mostrar:</label>
                        <select
                          value={filasPorPagina}
                          onChange={(e) => {setFilasPorPagina(Number(e.target.value)); setPaginaActual(1);}}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="text-sm">resultados</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Buscar:</label>
                        <input
                          type="text"
                          value={busquedaTabla}
                          onChange={handleBusquedaChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm"
                          placeholder="Empresa, NIT o Grupo..."
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-blue-100">
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Empresa</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">NIT</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Año</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Grupo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datos.map((empresa, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-3 font-medium">
                                {empresa.nombre || 'N/A'}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                {empresa.nit || 'N/A'}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                {empresa.ano || ano}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                  {empresa.grupo || 'Sin grupo'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Información de paginación y controles */}
                    <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {datos.length === 0 ? 0 : ((paginaActual - 1) * filasPorPagina) + 1} a{' '}
                        {Math.min(paginaActual * filasPorPagina, totalResultados)} de {totalResultados} resultados
                      </div>
                      
                      {/* Controles de paginación */}
                      {totalPaginas > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                            disabled={paginaActual === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Anterior
                          </button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                              let pageNum;
                              if (totalPaginas <= 5) {
                                pageNum = i + 1;
                              } else {
                                const start = Math.max(1, paginaActual - 2);
                                const end = Math.min(totalPaginas, start + 4);
                                pageNum = start + i;
                                if (pageNum > end) return null;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setPaginaActual(pageNum)}
                                  className={`px-3 py-1 border text-sm rounded ${
                                    paginaActual === pageNum
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : reporte === 'peso' && literal === 'literal_b' ? (
              // Tabla especializada para reporte de peso de Literal B
              (() => {
                const { datos, totalResultados, totalPaginas } = filtrarYPaginarDatos(datosReporte);
                
                return (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      Reporte por Peso - Literal B - Año {ano}
                    </h3>
                    
                    {/* Controles de la tabla */}
                    <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Mostrar:</label>
                        <select
                          value={filasPorPagina}
                          onChange={(e) => {setFilasPorPagina(Number(e.target.value)); setPaginaActual(1);}}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="text-sm">resultados</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Buscar:</label>
                        <input
                          type="text"
                          value={busquedaTabla}
                          onChange={handleBusquedaChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm"
                          placeholder="Empresa o NIT..."
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-blue-100">
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Empresa</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">NIT</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Año</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Peso Facturación (Kg)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datos.map((empresa, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-3 font-medium">
                                {empresa.nombre || 'N/A'}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                {empresa.nit || 'N/A'}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                {empresa.ano || ano}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                  parseFloat(empresa.totalPesoFacturacion || 0) > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {parseFloat(empresa.totalPesoFacturacion || 0).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Información de paginación y controles */}
                    <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {datos.length === 0 ? 0 : ((paginaActual - 1) * filasPorPagina) + 1} a{' '}
                        {Math.min(paginaActual * filasPorPagina, totalResultados)} de {totalResultados} resultados
                      </div>
                      
                      {/* Controles de paginación */}
                      {totalPaginas > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                            disabled={paginaActual === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Anterior
                          </button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                              let pageNum;
                              if (totalPaginas <= 5) {
                                pageNum = i + 1;
                              } else {
                                const start = Math.max(1, paginaActual - 2);
                                const end = Math.min(totalPaginas, start + 4);
                                pageNum = start + i;
                                if (pageNum > end) return null;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setPaginaActual(pageNum)}
                                  className={`px-3 py-1 border text-sm rounded ${
                                    paginaActual === pageNum
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : reporte === 'facturacion' && literal === 'literal_b' ? (
              // Tabla de facturación por Grupo - Literal B
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 text-center">
                  Facturación por Grupo - Año {ano}
                </h3>
                {cargandoFacturacion ? (
                  <div className="text-center py-8">Procesando facturación...</div>
                ) : !datosFacturacion ? (
                  <div className="text-center py-8 text-red-600">Sin datos para mostrar</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Grupo</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Empresas</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Toneladas</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Valor Unitario</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Facturación Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datosFacturacion.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium">{item.grupo}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{item.empresas}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{Number(item.toneladas).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{Number(item.valor).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{Number(item.facturacion).toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-yellow-100 font-bold">
                          <td className="border border-gray-300 px-4 py-3">TOTAL</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{datosFacturacion.reduce((a,b)=>a+(b.empresas||0),0)}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{datosFacturacion.reduce((a,b)=>a+(b.toneladas||0),0).toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{datosFacturacion.reduce((a,b)=>a+(b.facturacion||0),0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : reporte === 'facturacion' && literal === 'linea_base' ? (
              // Tabla de facturación por Rango - Línea Base
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 text-center">
                  Facturación por Rango - Año {ano}
                </h3>
                {cargandoFacturacion ? (
                  <div className="text-center py-8">Procesando facturación...</div>
                ) : !datosFacturacion ? (
                  <div className="text-center py-8 text-red-600">Sin datos para mostrar</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Rango</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Empresas</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Toneladas</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Valor Unitario</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Facturación Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datosFacturacion.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium">{item.rango}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{item.empresas}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{Number(item.toneladas).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{Number(item.valor).toFixed(2)}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{Number(item.facturacion).toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-yellow-100 font-bold">
                          <td className="border border-gray-300 px-4 py-3">TOTAL</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{datosFacturacion.reduce((a,b)=>a+(b.empresas||0),0)}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{datosFacturacion.reduce((a,b)=>a+(b.toneladas||0),0).toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">-</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{datosFacturacion.reduce((a,b)=>a+(b.facturacion||0),0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : reporte === 'estado' && literal === 'literal_b' ? (
              // Tabla especializada para estado de Literal B (similar a línea base)
              (() => {
                const { datos, totalResultados, totalPaginas } = filtrarYPaginarDatosEstado(datosReporte);
                
                // Calcular porcentaje de empresas aprobadas
                const empresasAprobadas = datosReporte.filter(empresa => 
                  empresa.estado?.toLowerCase().includes('aprobado')
                ).length;
                const totalEmpresas = datosReporte.length;
                const porcentajeAprobado = totalEmpresas > 0 ? ((empresasAprobadas / totalEmpresas) * 100).toFixed(1) : 0;
                
                return (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-6 text-center">
                      Estado de Literal B
                    </h3>
                    
                    {/* Progress Bar de Empresas Aprobadas */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progreso de Aprobación
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {empresasAprobadas} de {totalEmpresas} empresas ({porcentajeAprobado}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${porcentajeAprobado}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Controles de la tabla */}
                    <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Mostrar:</label>
                        <select
                          value={filasPorPagina}
                          onChange={(e) => {setFilasPorPagina(Number(e.target.value)); setPaginaActual(1);}}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="text-sm">resultados</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Buscar:</label>
                        <input
                          type="text"
                          value={busquedaTabla}
                          onChange={handleBusquedaChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm"
                          placeholder="Empresa, NIT, Correo o Estado..."
                        />
                      </div>
                    </div>
                
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-blue-100">
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Empresa</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">NIT</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Correo Facturación</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datos.map((empresa, index) => {
                            // Función para obtener el color del estado
                            const getEstadoColor = (estado) => {
                              if (!estado) return 'bg-gray-100 text-gray-600';
                              const estadoLower = estado.toLowerCase();
                              if (estadoLower.includes('aprobado')) return 'bg-green-100 text-green-800';
                              if (estadoLower.includes('guardado')) return 'bg-blue-100 text-blue-800';
                              if (estadoLower.includes('pendiente')) return 'bg-yellow-100 text-yellow-800';
                              if (estadoLower.includes('rechazado')) return 'bg-red-100 text-red-800';
                              if (estadoLower.includes('iniciado')) return 'bg-gray-100 text-gray-800';
                              return 'bg-gray-100 text-gray-600';
                            };

                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-3 font-medium">
                                  {empresa.nombre || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {empresa.nit || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {empresa.correo_facturacion || empresa.correoFacturacion || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(empresa.estado)}`}>
                                    {empresa.estado || 'Sin estado'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Información de paginación y controles */}
                    <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {datos.length === 0 ? 0 : ((paginaActual - 1) * filasPorPagina) + 1} a{' '}
                        {Math.min(paginaActual * filasPorPagina, totalResultados)} de {totalResultados} resultados
                        {busquedaTabla && ` (filtrado de ${totalEmpresas} total)`}
                      </div>
                      
                      {/* Controles de paginación */}
                      {totalPaginas > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                            disabled={paginaActual === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Anterior
                          </button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                              let pageNum;
                              if (totalPaginas <= 5) {
                                pageNum = i + 1;
                              } else {
                                const start = Math.max(1, paginaActual - 2);
                                const end = Math.min(totalPaginas, start + 4);
                                pageNum = start + i;
                                if (pageNum > end) return null;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setPaginaActual(pageNum)}
                                  className={`px-3 py-1 border text-sm rounded ${
                                    paginaActual === pageNum
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : reporte === 'estado' && literal === 'linea_base' ? (
              // Tabla especializada para estado de línea base
              (() => {
                const { datos, totalResultados, totalPaginas } = filtrarYPaginarDatosEstado(datosReporte);
                
                // Calcular porcentaje de empresas finalizadas
                const empresasFinalizadas = datosReporte.filter(empresa => 
                  empresa.estado?.toLowerCase().includes('finalizado')
                ).length;
                const totalEmpresas = datosReporte.length;
                const porcentajeFinalizado = totalEmpresas > 0 ? ((empresasFinalizadas / totalEmpresas) * 100).toFixed(1) : 0;
                
                return (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-6 text-center">
                      Estado de Línea Base
                    </h3>
                    
                    {/* Progress Bar de Empresas Finalizadas */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progreso de Finalización
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {empresasFinalizadas} de {totalEmpresas} empresas ({porcentajeFinalizado}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${porcentajeFinalizado}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Controles de la tabla */}
                    <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Mostrar:</label>
                        <select
                          value={filasPorPagina}
                          onChange={(e) => {setFilasPorPagina(Number(e.target.value)); setPaginaActual(1);}}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="text-sm">resultados</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Buscar:</label>
                        <input
                          type="text"
                          value={busquedaTabla}
                          onChange={handleBusquedaChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm"
                          placeholder="Empresa, NIT, Correo o Estado..."
                        />
                      </div>
                    </div>
                
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-blue-100">
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Empresa</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">NIT</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Correo Facturación</th>
                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datos.map((empresa, index) => {
                            // Función para obtener el color del estado
                            const getEstadoColor = (estado) => {
                              if (!estado) return 'bg-gray-100 text-gray-600';
                              const estadoLower = estado.toLowerCase();
                              if (estadoLower.includes('finalizado')) return 'bg-green-100 text-green-800';
                              if (estadoLower.includes('firmado')) return 'bg-green-100 text-green-800';
                              if (estadoLower.includes('guardado')) return 'bg-blue-100 text-blue-800';
                              if (estadoLower.includes('pendiente')) return 'bg-yellow-100 text-yellow-800';
                              if (estadoLower.includes('aprobado')) return 'bg-emerald-100 text-emerald-800';
                              if (estadoLower.includes('rechazado')) return 'bg-red-100 text-red-800';
                              return 'bg-gray-100 text-gray-600';
                            };

                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-3 font-medium">
                                  {empresa.nombre || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {empresa.nit || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  {empresa.correo_facturacion || empresa.correoFacturacion || 'N/A'}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(empresa.estado)}`}>
                                    {empresa.estado || 'Sin estado'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Información de paginación y controles */}
                    <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Mostrando {datos.length === 0 ? 0 : ((paginaActual - 1) * filasPorPagina) + 1} a{' '}
                        {Math.min(paginaActual * filasPorPagina, totalResultados)} de {totalResultados} resultados
                        {busquedaTabla && ` (filtrado de ${totalEmpresas} total)`}
                      </div>
                      
                      {/* Controles de paginación */}
                      {totalPaginas > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                            disabled={paginaActual === 1}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Anterior
                          </button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                              let pageNum;
                              if (totalPaginas <= 5) {
                                pageNum = i + 1;
                              } else {
                                const start = Math.max(1, paginaActual - 2);
                                const end = Math.min(totalPaginas, start + 4);
                                pageNum = start + i;
                                if (pageNum > end) return null;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setPaginaActual(pageNum)}
                                  className={`px-3 py-1 border text-sm rounded ${
                                    paginaActual === pageNum
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : 'border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                            disabled={paginaActual === totalPaginas}
                            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              // Tabla genérica para otros reportes
              <div className="mt-8 overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 text-center">
                      <th className="px-4 py-2 border">ID</th>
                      <th className="px-4 py-2 border">Cliente</th>
                      <th className="px-4 py-2 border">Datos</th>
                      <th className="px-4 py-2 border">Año</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosReporte.map((fila, index) => (
                      <tr key={index} className="text-center">
                        <td className="px-4 py-2 border">{index + 1}</td>
                        <td className="px-4 py-2 border">{fila.cliente || 'N/A'}</td>
                        <td className="px-4 py-2 border">{JSON.stringify(fila).substring(0, 50)}...</td>
                        <td className="px-4 py-2 border">{fila.ano || ano}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Gráficos específicos para cada tipo de reporte */}
            <div id="chart-container" className="chart-container">
              {generateChart()}
            </div>
            
            {/* Gráfico dinámico debajo de la tabla */}
            <div id="dynamic-chart-container" className="chart-container">
              {(() => {
                const chart = getChartData();
                if (!chart) return null;
                
                // Gráficos duales para rangos
                if (chart.type === 'dual' && chart.charts) {
                  return (
                    <div className="mt-8 space-y-8">
                      {chart.charts.map((chartConfig, index) => (
                        <div key={index} className="flex justify-center">
                          <div style={{ maxWidth: 600, width: '100%' }}>
                            <h4 className="text-center font-semibold mb-4 text-gray-700">
                              {chartConfig.title}
                            </h4>
                            {chartConfig.type === 'bar' ? (
                              <Bar data={chartConfig.data} options={chartConfig.options} height={120} />
                            ) : chartConfig.type === 'line' ? (
                              <Line data={chartConfig.data} options={chartConfig.options} height={120} />
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
              
              if (chart.type === 'bar') {
                return (
                  <div className="mt-8 flex justify-center">
                    <div style={{ maxWidth: 350, width: '100%' }}>
                      <Bar data={chart.data} options={chart.options} height={180} />
                    </div>
                  </div>
                );
              }
              
              // Para otros tipos de gráficos (pie, bar, etc.)
              if (chart.type === 'pie') {
                return (
                  <div className="mt-8 flex justify-center">
                    <div style={{ maxWidth: 350, width: '100%' }}>
                      <Pie data={chart.data} options={chart.options} height={180} />
                    </div>
                  </div>
                );
              }
              
              // Progress bar para meta
              if (reporte === 'meta') {
                // Ejemplo de datos de avance
                const metas = [
                  { nombre: 'Meta 1', avance: 80 },
                  { nombre: 'Meta 2', avance: 60 },
                  { nombre: 'Meta 3', avance: 95 },
                ];
                return (
                  <div className="mt-8 space-y-4">
                    {metas.map((meta, idx) => (
                      <div key={meta.nombre}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-blueGray-700">{meta.nombre}</span>
                          <span className="text-sm font-medium text-blueGray-700">{meta.avance}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${meta.avance}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              
              return null;
            })()}
            </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

Reportes.layout = Admin;