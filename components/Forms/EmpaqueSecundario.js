import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/config";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Oval } from 'react-loader-spinner';
import Backdrop from '@mui/material/Backdrop';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
export default function FormularioAfiliado({ color, readonly = false, idInformacionF: propIdInformacionF, estado: propEstado }) {
  const [isLoading, setIsLoading] = useState(false);
  let idInformacionF = propIdInformacionF || localStorage.getItem("idInformacionF");
  let estadoInformacionF = propEstado || localStorage.getItem("estadoInformacionF");
  let tipoReporte = localStorage.getItem("tipoReporte");
  // Solo editable si estado es Guardado o Rechazado Y no está en modo readonly
  const esEditable = !readonly && (estadoInformacionF === "Guardado" || estadoInformacionF === "Rechazado");
  const [productos, setProductos] = useState([]);
  // Paginación
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [toneladasAcumuladasGlobal, setToneladasAcumuladasGlobal] = useState(0);
  const [erroresCampos, setErroresCampos] = useState({});
  // Descarga un archivo .txt con el detalle de errores del cargue
  const descargarErroresTXT = (errores = [], nombreArchivoOriginal = "") => {
    try {
      const encabezado = [
        "Errores de carga - Empaque Secundario (Línea Base)",
        `Archivo: ${nombreArchivoOriginal || "(sin nombre)"}`,
        `Fecha: ${new Date().toLocaleString()}`,
        "",
      ];
      const lineas = errores.length > 0 ? errores.map((e) => `- ${e}`) : ["(Sin detalles adicionales)"];
      const contenido = [...encabezado, ...lineas].join("\r\n");
      const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = nombreArchivoOriginal ? nombreArchivoOriginal.replace(/\.[^/.]+$/, "") : "errores_carga_empaque_secundario";
      a.href = url;
      a.download = `${base}_errores.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("No se pudo descargar el archivo de errores:", e);
    }
  };
  const data = [
    [ "Empresa titular del Producto", "Texto", "Razón social/Nombre de cada persona natural o jurídica (titular de registro) representada por la empresa vinculada a Soluciones Ambientales Sostenibles Punto Azul"],
    [ "Nombre del Producto", "Texto", "Nombre del producto que esta reportando"],
    [ "Papel (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de PAPEL. Colocar cifra en gramos."],
    [ "Metal (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de METAL. Colocar cifra en gramos."],
    [ "Cartón (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de CARTÓN. Colocar cifra en gramos. De igual manera se debe reportar el material corrugado como material de cartón."],
    [ "Vidrio (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de VIDRIO. Colocar cifra en gramos."],
    [ "Multimaterial", "Texto", "Es un producto o empaque hecho de dos o más materiales diferentes combinados, como plástico y metal, en una sola estructura."],
    [ "Unidades del Producto puestas en el mercado durante el año reportado", "Número", "Total de empaques puestos en el mercado del Producto indicado en la fila correspondiente, durante el año reportado. En la cuantificación se debe tener en cuenta la relación con el producto (Ej.: una unidad de empaque contiene 24 unidades de producto, el reporte que se debe hacer es la unidad de empaque que se puso en el mercado."],
  ];

  useEffect(() => {
  const fetchProductos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesSecundarios/${idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron empaques secundarios para este idInformacionF.");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const normalizarSiNo = (v) => {
          if (!v && v !== 0) return "";
          const s = v.toString().trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
          if (s === 'si') return 'Si';
          if (s === 'no') return 'No';
          return v;
        };
        const productosFormateados = data.map(producto => ({
          id: producto.idEmpaque,
          idInformacionF: producto.idInformacionF,
          empresaTitular: producto.empresa || "",
          nombreProducto: producto.nombre_producto || "",
          papel: producto.papel || "",
          metalFerrosos: producto.metal_ferrosos || "",
          metalNoFerrosos: producto.metal_no_ferrososs || "",
          carton: producto.carton || "",
          vidrio: producto.vidrios || "",
          multimaterial: typeof producto.multimaterial === 'string'
            ? (() => { try { return JSON.parse(producto.multimaterial); } catch { return { multimaterial: "", tipo: "", otro: "" }; } })()
            : (producto.multimaterial && typeof producto.multimaterial === 'object' ? producto.multimaterial : { multimaterial: "", tipo: "", otro: "" }),
          unidades: tipoReporte === "totalizado" ? "1" : (producto.unidades || ""),
        }));
        productosFormateados.forEach(p => {
          if (p.multimaterial && typeof p.multimaterial === 'object') {
            p.multimaterial.multimaterial = normalizarSiNo(p.multimaterial.multimaterial);
          }
        });
  setProductos(productosFormateados);
  setCurrentPage(1);
      } catch (error) {
        console.error("Error al obtener los empaques secundarios:", error);
      }
    };
    if (idInformacionF) {
      fetchProductos();
    }
  }, [idInformacionF, tipoReporte]);
  // Obtener productos y toneladas acumuladas globales desde el backend al cargar el componente
  // --- Toneladas acumuladas globales ---
  // Definir la función fuera del useEffect para poder reutilizarla
  const fetchToneladasAcumuladas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/getToneladasAcumuladas/${idInformacionF}`);
      if (!response.ok) throw new Error("No se pudo obtener toneladas acumuladas");
      const data = await response.json();
      setToneladasAcumuladasGlobal(Number(data.toneladas) || 0);
    } catch {
      setToneladasAcumuladasGlobal(0);
    }
  };
  useEffect(() => {
    if (idInformacionF) {
      fetchToneladasAcumuladas();
    }
  }, [idInformacionF]);

  // Mantener currentPage dentro de rango cuando cambian productos o pageSize
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((productos?.length || 0) / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [productos, pageSize]);

  const agregarProducto = () => {
    setProductos([
      ...productos,
      {
        id: productos.length + 1,
        idInformacionF,
        empresaTitular: "",
        nombreProducto: "",
        papel: 0,
        metalFerrosos: 0,
        metalNoFerrosos: 0,
        carton: 0,
        vidrio: 0,
        multimaterial: { multimaterial: "", tipo: "", otro: "" },
        unidades: tipoReporte === "totalizado" ? "1" : "",
      },
    ]);
  };

  // Helper formato dos decimales con coma
  const format2 = (v) => {
    if (v === null || v === undefined || v === "") return "";
    const num = parseFloat(v.toString().replace(',', '.'));
    if (isNaN(num)) return v;
    return num.toFixed(2).replace('.', ',');
  };

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];
    if (field.startsWith("multimaterial.")) {
            const subField = field.split(".")[1]; // Fixing the condition to check for multimaterial
      nuevosProductos[index].multimaterial = {
        ...nuevosProductos[index].multimaterial,
        [subField]: value
      };
    } else {
      let inputValue = value.trim();
      const camposNumericos = ["papel", "metalFerrosos", "metalNoFerrosos", "carton", "vidrio", "unidades"];
      const keyError = `${index}-${field}`;
      const nuevoErrores = { ...erroresCampos };
      if (camposNumericos.includes(field)) {
        if (inputValue.includes('.')) {
          nuevoErrores[keyError] = "Use coma (,) como separador decimal";
        } else {
          const regex = field === 'unidades' ? /^\d*$/ : /^\d+(,\d{0,2})?$/;
            if (inputValue === "") {
              delete nuevoErrores[keyError];
            } else if (!regex.test(inputValue)) {
              nuevoErrores[keyError] = field === 'unidades' ? 'Solo dígitos' : 'Máx 2 decimales con coma';
            } else {
              delete nuevoErrores[keyError];
            }
        }
        setErroresCampos(nuevoErrores);
      }
      nuevosProductos[index][field] = inputValue;
    }
    if (tipoReporte === 'totalizado') {
      nuevosProductos[index].unidades = '1';
    }
    setProductos(nuevosProductos);
  };

  // Post por lotes para evitar cargas masivas en una sola petición
  const postInBatches = async (url, payloadArray, chunkSize = 1000) => {
    let okCount = 0;
    for (let i = 0; i < payloadArray.length; i += chunkSize) {
      const chunk = payloadArray.slice(i, i + chunkSize);
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(chunk),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Lote ${Math.floor(i / chunkSize) + 1}: ${resp.status} ${errText}`);
      }
      okCount += chunk.length;
    }
    return okCount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Validaciones requeridas
  const camposNumericos = ["papel", "metalFerrosos", "metalNoFerrosos", "carton", "vidrio"];
  const decimalRegexComa = /^\d+(,\d{1,2})?$/;
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      // 1. empresaTitular y nombreProducto requeridos
      if (!producto.empresaTitular || !producto.nombreProducto) {
        alert(`En la fila ${i + 1}, 'Empresa titular' y 'Nombre Producto' son obligatorios.`);
        setIsLoading(false);
        return;
      }
      // 2. Al menos un material debe ser mayor a 0 (con coma)
      const toNum = (v) => {
        if (v === null || v === undefined || v === "") return 0;
        const n = parseFloat(v.toString().replace(',', '.'));
        return isNaN(n) ? 0 : n;
      };
      const sumaMateriales = [
        toNum(producto.papel),
        toNum(producto.metalFerrosos),
        toNum(producto.metalNoFerrosos),
        toNum(producto.carton),
        toNum(producto.vidrio)
      ];
      if (sumaMateriales.every(val => val === 0)) {
        alert(`En la fila ${i + 1}, al menos uno de los materiales (Papel, Metal Ferrosos, Metal No Ferrosos, Cartón, Vidrio) debe ser mayor a 0.`);
        setIsLoading(false);
        return;
      }
      // 3. Validar campos numéricos (coma, máx 2 decimales, sin punto)
      for (const campo of camposNumericos) {
        const rawValor = producto[campo];
        let valorStr = (rawValor === null || rawValor === undefined) ? "" : rawValor.toString();
        if (valorStr.includes('.')) {
          alert(`Fila ${i + 1} campo '${campo}': No use punto. Use coma (,) para decimales.`);
          setIsLoading(false);
          return;
        }
        if (valorStr !== "") {
          if (!decimalRegexComa.test(valorStr)) {
            alert(`Fila ${i + 1} campo '${campo}': Formato inválido. Use hasta 2 decimales con coma.`);
            setIsLoading(false);
            return;
          }
        }
      }
      // 4. Multimaterial validaciones
      if (!producto.multimaterial.multimaterial) {
        alert(`En la fila ${i + 1}, debe seleccionar una opción para 'Multimaterial'.`);
        setIsLoading(false);
        return;
      }
      if (!['Si','No'].includes(producto.multimaterial.multimaterial)) {
        alert(`En la fila ${i + 1}, 'Multimaterial' debe ser 'Si' o 'No'.`);
        setIsLoading(false);
        return;
      }
      if (producto.multimaterial.multimaterial === 'Si') {
        if (!producto.multimaterial.tipo) {
          alert(`En la fila ${i + 1}, debe seleccionar 'Tipo Multimaterial'.`);
          setIsLoading(false);
          return;
        }
        if (producto.multimaterial.tipo === 'Otro' && !producto.multimaterial.otro.trim()) {
          alert(`En la fila ${i + 1}, debe diligenciar 'Otro Multimaterial'.`);
          setIsLoading(false);
          return;
        }
        if (producto.multimaterial.tipo !== 'Otro' && producto.multimaterial.otro.trim()) {
          alert(`En la fila ${i + 1}, 'Otro Multimaterial' debe estar vacío porque el tipo seleccionado no es 'Otro'.`);
          setIsLoading(false);
          return;
        }
      } else {
        if (producto.multimaterial.tipo.trim() || producto.multimaterial.otro.trim()) {
          alert(`En la fila ${i + 1}, los campos de tipo/otro multimaterial deben estar vacíos cuando 'Multimaterial' es 'No'.`);
          setIsLoading(false);
          return;
        }
      }
      // 5. Unidades debe tener un valor (entero)
      if (!producto.unidades || producto.unidades === "") {
        alert(`En la fila ${i + 1}, el campo 'Unidades' es obligatorio.`);
        setIsLoading(false);
        return;
      }
      if (/[,\.]/.test(producto.unidades)) {
        alert(`En la fila ${i + 1}, 'Unidades' debe ser un número entero sin separadores.`);
        setIsLoading(false);
        return;
      }
    }
    try {
      const productosSerializados = productos.map(p => {
        const normalizar = v => {
          if (v === null || v === undefined || v === "") return "0";
          if (typeof v === 'string') {
            if (v.includes('.')) throw new Error('Formato con punto detectado en números (no permitido).');
            return v.replace(',', '.');
          }
          return String(v);
        };
        return {
          ...p,
          papel: normalizar(p.papel),
          metalFerrosos: normalizar(p.metalFerrosos),
          metalNoFerrosos: normalizar(p.metalNoFerrosos),
          carton: normalizar(p.carton),
          vidrio: normalizar(p.vidrio),
          unidades: p.unidades ? String(p.unidades) : '0',
          multimaterial: JSON.stringify({
            multimaterial: p.multimaterial.multimaterial,
            tipo: p.multimaterial.tipo,
            otro: p.multimaterial.otro
          })
        };
      });
      const total = await postInBatches(`${API_BASE_URL}/informacion-f/crearEmpaqueSec`, productosSerializados, 1000);
      alert(`Se guardaron ${total} registros de Empaque Secundario en lotes.`);
      await fetchToneladasAcumuladas();
      // No recargar la página
    } catch (error) {
      console.error("Error al enviar los empaques secundarios:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Excel download functionality
  const descargarPlantilla = async () => {
    const headers = [
      'Empresa titular',
      'Nombre Producto',
      'Papel (g)',
      'Metal Ferrosos (g)',
      'Metal No Ferrosos (g)',
      'Cartón (g)',
      'Vidrio (g)',
      'Multimaterial',
      'Tipo Multimaterial',
      'Otro Multimaterial',
      'Unidades'
    ];
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PuntoAzul';
    workbook.created = new Date();
    const sheetEntrada = workbook.addWorksheet('Empaques');
    sheetEntrada.addRow(headers);
    sheetEntrada.getRow(1).font = { bold: true };
    sheetEntrada.columns.forEach(c => c.width = 24);
    const sheetEjemplos = workbook.addWorksheet('Ejemplos_Instrucciones');
    const unidadesEjemplo = tipoReporte === 'totalizado' ? '1' : '1500';
    const datosEjemplo = [
      ['Ejemplo Empresa A', 'Producto Ejemplo 1', '3,80', '1,50', '0', '12,40', '0', 'No', '', '', unidadesEjemplo],
      ['Ejemplo Empresa B', 'Producto Ejemplo 2', '0', '6,75', '2,80', '0', '9,60', 'Si', 'Papel multimaterial o laminado', '', (tipoReporte === 'totalizado' ? '1' : '2300')],
      ['Ejemplo Empresa C', 'Producto Ejemplo 3', '0,80', '0', '0', '18,20', '0', 'Si', 'Otro', 'Material compuesto especial', (tipoReporte === 'totalizado' ? '1' : '800')],
    ];
    sheetEjemplos.addRow(headers).font = { bold: true };
    datosEjemplo.forEach(r => sheetEjemplos.addRow(r));
    sheetEjemplos.columns.forEach(c => c.width = 26);
    sheetEjemplos.addRow([]);
    const instrucciones = [
      'INSTRUCCIONES IMPORTANTES:',
      '',
      "Campo 'Multimaterial': Debe ser exactamente 'Si' o 'No' (sin tilde).",
      "Si Multimaterial = 'No': Dejar 'Tipo Multimaterial' y 'Otro Multimaterial' VACIOS.",
      "Si Multimaterial = 'Si', opciones válidas para 'Tipo Multimaterial':",
      '• Papel multimaterial o laminado',
      '• Polyboard - papel para bebidas',
      '• Carton multimaterial o laminado',
      '• Carton para bebidas',
      '• Otro',
      "Si 'Tipo Multimaterial' = 'Otro': Completar 'Otro Multimaterial'.",
      "Si 'Tipo Multimaterial' != 'Otro': Dejar 'Otro Multimaterial' VACIO.",
      'Los pesos deben estar en gramos, usar coma para decimales (máx 2 en la interfaz).'
    ];
    if (tipoReporte === 'totalizado') instrucciones.unshift('IMPORTANTE: Las unidades deben ser 1 para reportes totalizados.', '');
    instrucciones.forEach(t => {
      const row = sheetEjemplos.addRow([t]);
      sheetEjemplos.mergeCells(`A${row.number}:K${row.number}`);
      if (/INSTRUCCIONES|IMPORTANTE/.test(t)) row.font = { bold: true };
    });
    const nombreArchivo = tipoReporte === 'totalizado' ? 'plantilla_empaques_secundarios_totalizado.xlsx' : 'plantilla_empaques_secundarios.xlsx';
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = nombreArchivo; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generando Excel:', e);
      alert('No se pudo generar la plantilla Excel.');
    }
  };

  // Excel upload functionality
  const cargarDesdeExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!rawRows || rawRows.length === 0) {
          descargarErroresTXT(["El archivo Excel está vacío."], file?.name);
          alert('El archivo Excel está vacío. Se descargó un .txt con el detalle.');
          if (event && event.target) event.target.value = '';
          return;
        }
        let headerIndex = rawRows.findIndex(r => Array.isArray(r) && r.some(c => typeof c === 'string' && c.toLowerCase().includes('empresa')) && r.some(c => typeof c === 'string' && c.toLowerCase().includes('nombre')));
        if (headerIndex === -1) {
          descargarErroresTXT(['No se encontraron encabezados válidos.'], file?.name);
          alert('No se encontraron encabezados válidos. Se descargó un .txt con el detalle.');
          if (event && event.target) event.target.value = '';
          return;
        }
        const headers = rawRows[headerIndex].map(h => (h || '').toString().trim());
        const dataMatrix = rawRows.slice(headerIndex + 1).filter(r => r.some(c => c !== null && c !== undefined && c !== ''));
        const jsonData = dataMatrix.map(r => { const o = {}; headers.forEach((h,i)=> o[h]=r[i]); return o; });
        if (jsonData.length === 0) {
          descargarErroresTXT(['No hay filas de datos después de los encabezados.'], file?.name);
          alert('No hay filas de datos después de los encabezados. Se descargó un .txt con el detalle.');
          if (event && event.target) event.target.value = '';
          return;
        }
        const normalizarSiNo = (v) => { if (v === null || v === undefined) return ""; const s = v.toString().trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,''); if (s==='si') return 'Si'; if (s==='no') return 'No'; return v.toString().trim(); };
        const mapearColumnas = (row) => {
          const keys = Object.keys(row); const lower = keys.map(k=>k.toLowerCase()); const findKey = (pred)=> { const i = lower.findIndex(pred); return i>=0? keys[i]: null; };
          return {
            empresaTitular: row[findKey(k=> k.includes('empresa') || k.includes('titular'))] || "",
            nombreProducto: row[findKey(k=> k.includes('nombre') && k.includes('producto'))] || "",
            papel: row[findKey(k=> k.includes('papel'))] || "0",
            metalFerrosos: row[findKey(k=> k.includes('metal') && k.includes('ferr') && !k.includes('no'))] || "0",
            metalNoFerrosos: row[findKey(k=> k.includes('metal') && k.includes('no') && k.includes('ferr'))] || "0",
            carton: row[findKey(k=> k.includes('cart'))] || "0",
            vidrio: row[findKey(k=> k.includes('vidrio'))] || "0",
            multimaterial: normalizarSiNo(row[findKey(k=> k.includes('multimaterial') && !k.includes('tipo') && !k.includes('otro'))] || ""),
            tipoMultimaterial: row[findKey(k=> k.includes('tipo') && k.includes('multimaterial'))] || "",
            otroMultimaterial: row[findKey(k=> k.includes('otro') && k.includes('multimaterial'))] || "",
            unidades: row[findKey(k=> k.includes('unidades'))] || ""
          };
        };

        // Validar y procesar datos
  const productosValidados = [];
  const errores = [];
  const camposNumericos = ["papel", "metalFerrosos", "metalNoFerrosos", "carton", "vidrio"];
  // Aceptar números con coma o punto (hasta 10 decimales en archivo) para luego normalizar a coma con 2 decimales
  const decimalRegexFlexible = /^\d+(?:[\.,]\d{1,10})?$/;

        jsonData.forEach((row, index) => {
          const producto = mapearColumnas(row);
            const numeroFila = headerIndex + 2 + index;

          // 1. Validar campos requeridos
          if (!producto.empresaTitular.trim()) {
            errores.push(`Fila ${numeroFila}: 'Empresa titular' es obligatorio`);
          }
          if (!producto.nombreProducto.trim()) {
            errores.push(`Fila ${numeroFila}: 'Nombre Producto' es obligatorio`);
          }
          if (!producto.unidades.toString().trim()) {
            errores.push(`Fila ${numeroFila}: 'Unidades' es obligatorio`);
          }

          // 2. Validar multimaterial
          if (!producto.multimaterial || !["Si", "No"].includes(producto.multimaterial)) {
            errores.push(`Fila ${numeroFila}: 'Multimaterial' debe ser 'Si' o 'No'`);
          }

          // 3. Validar y normalizar campos numéricos (acepta punto o coma, guarda con coma y dos decimales)
          for (const campo of camposNumericos) {
            let valor = producto[campo];
            if (valor === null || valor === undefined || valor === "") {
              producto[campo] = "0,00";
              continue;
            }
            valor = valor.toString().trim();
            if (!decimalRegexFlexible.test(valor)) {
              errores.push(`Fila ${numeroFila}: '${campo}' debe ser un número válido (usar punto o coma). Valor: ${producto[campo]}`);
              continue;
            }
            // Reemplazar coma por punto para parsear, luego formatear a 2 decimales y devolver con coma
            const num = parseFloat(valor.replace(',', '.'));
            if (isNaN(num)) {
              errores.push(`Fila ${numeroFila}: '${campo}' no se pudo interpretar como número. Valor: ${producto[campo]}`);
              continue;
            }
            producto[campo] = num.toFixed(2).replace('.', ',');
          }

          // 4. Validar que al menos un material sea mayor a 0
          const sumaMateriales = camposNumericos.map(campo => {
            const n = parseFloat(producto[campo].toString().replace(',', '.'));
            return isNaN(n) ? 0 : n;
          });
          if (sumaMateriales.every(val => val === 0)) {
            errores.push(`Fila ${numeroFila}: Al menos uno de los materiales debe ser mayor a 0`);
          }

          // 5. Validar tipo multimaterial si es necesario
      if (producto.multimaterial === "Si") {
            const tiposValidos = [
              "Papel multimaterial o laminado",
              "Polyboard - papel para bebidas", 
              "Carton multimaterial o laminado",
              "Carton para bebidas",
              "Otro"
            ];
            if (!tiposValidos.includes(producto.tipoMultimaterial)) {
        errores.push(`Fila ${numeroFila}: 'Tipo Multimaterial' debe ser una opción válida cuando Multimaterial es 'Si'. Opciones: ${tiposValidos.join(', ')}`);
            }
            if (producto.tipoMultimaterial === "Otro" && !producto.otroMultimaterial.trim()) {
              errores.push(`Fila ${numeroFila}: 'Otro Multimaterial' es requerido cuando el tipo es 'Otro'`);
            }
            // Si no es "Otro", el campo otro debe estar vacío
            if (producto.tipoMultimaterial !== "Otro" && producto.otroMultimaterial.trim()) {
              errores.push(`Fila ${numeroFila}: 'Otro Multimaterial' debe estar vacío cuando el tipo no es 'Otro'`);
            }
      } else if (producto.multimaterial === "No") {
            // Si multimaterial es "No", tanto tipo como otro deben estar vacíos
            if (producto.tipoMultimaterial.trim()) {
              errores.push(`Fila ${numeroFila}: 'Tipo Multimaterial' debe estar vacío cuando Multimaterial es 'No'`);
            }
            if (producto.otroMultimaterial.trim()) {
              errores.push(`Fila ${numeroFila}: 'Otro Multimaterial' debe estar vacío cuando Multimaterial es 'No'`);
            }
          }

          // 6. Validar unidades según tipoReporte
          if (tipoReporte === "totalizado") {
            // Si es totalizado, forzar unidades a 1 y avisar si era diferente
            if (producto.unidades.toString() !== "1") {
              console.warn(`Fila ${numeroFila}: Las unidades fueron ajustadas a 1 porque el tipo de reporte es totalizado. Valor original: ${producto.unidades}`);
            }
            producto.unidades = "1";
          }

          // Formatear producto para el estado
          const productoFormateado = {
            id: productosValidados.length + 1,
            idInformacionF,
            empresaTitular: producto.empresaTitular,
            nombreProducto: producto.nombreProducto,
            papel: producto.papel,
            metalFerrosos: producto.metalFerrosos,
            metalNoFerrosos: producto.metalNoFerrosos,
            carton: producto.carton,
            vidrio: producto.vidrio,
            multimaterial: {
              multimaterial: producto.multimaterial,
              tipo: producto.tipoMultimaterial,
              otro: producto.otroMultimaterial
            },
            unidades: producto.unidades.toString()
          };

          productosValidados.push(productoFormateado);
        });

        if (errores.length > 0) {
          descargarErroresTXT(errores, file?.name);
          alert(`Se encontraron ${errores.length} errores. Se descargó un .txt con el detalle para su corrección.`);
          if (event && event.target) event.target.value = '';
          return;
        }

  // Actualizar estado con productos validados y reiniciar a la primera página
  setProductos(productosValidados);
  setCurrentPage(1);
        
        // Mensaje informativo según el tipo de reporte
        let mensaje = `Se cargaron exitosamente ${productosValidados.length} productos desde Excel.`;
        if (tipoReporte === "totalizado") {
          mensaje += "\n\nNota: Las unidades fueron ajustadas automáticamente a 1 porque el tipo de reporte es totalizado.";
        }
        alert(mensaje);

      } catch (error) {
        console.error('Error al procesar archivo Excel:', error);
        descargarErroresTXT([
          `Error al procesar el archivo Excel: ${error.message}`,
          'Verifique que el formato sea correcto.'
        ], file?.name);
        alert('Ocurrió un error al procesar el archivo Excel. Se descargó un .txt con el detalle.');
        if (event && event.target) event.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Limpiar input
  };

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      {/* Loader Backdrop Overlay */}
      <Backdrop
        sx={{ color: '#2563eb', zIndex: (theme) => theme.zIndex.modal + 1000 }}
        open={isLoading}
      >
        <div className="flex flex-col items-center">
          <Oval
            height={60}
            width={60}
            color="#2563eb"
            secondaryColor="#60a5fa"
            strokeWidth={5}
            ariaLabel="oval-loading"
            visible={true}
          />
          <span className="text-blue-700 font-semibold mt-4 bg-white px-4 py-2 rounded-lg shadow">Guardando información...</span>
        </div>
      </Backdrop>
      
      {/* SECCIÓN II */}
      <div className="p-4">
        <h3 className="text-lg font-semibold flex items-center">
          Información General de Productos&nbsp;
          <i 
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer" 
            onClick={() => setIsOpen(true)}
          ></i>
        </h3>
        <div className="mt-2 mb-2 text-blue-700 font-bold text-lg">
          Toneladas acumuladas (Base): {Number(toneladasAcumuladasGlobal).toFixed(10)}
        </div>
        {!readonly && (
          <div className="flex justify-between mt-3">
            <button className="bg-lightBlue-600 text-white px-4 py-2 rounded" onClick={agregarProducto}>
              Agregar Producto
            </button>
            <div className="flex space-x-2">
              <label className="bg-lightBlue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-lightBlue-700">
                Cargar desde Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={cargarDesdeExcel}
                  className="hidden"
                />
              </label>
            </div>
              <button
                className="bg-lightBlue-600 text-white px-4 py-2 rounded hover:bg-lightBlue-700"
                onClick={descargarPlantilla}
              >
                Descargar Plantilla Excel
              </button>
          </div>
        )}
        {/* Controles de paginación: tamaño de página */}
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-gray-600">Filas por página:</label>
          <select
            className="border px-2 py-1 rounded"
            value={pageSize}
            onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">Total: {productos.length}</span>
        </div>
        <div className="text-red-500 text-center mt-3 font-semibold">
          Todos los pesos de la tabla deben estar en gramos y sin separador de miles.
        </div>
        <form onSubmit={handleSubmit}>
          <div className="w-full overflow-x-auto p-4">
            <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">No.</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Empresa Titular</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Nombre Producto</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Papel (g)</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Metal Ferrosos(g)</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Metal No Ferrosos(g)</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Cartón (g)</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Vidrio (g)</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Multimaterial</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Unidades puestas en el mercado</th>
                  {!readonly && <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalItems = productos.length;
                  const startIdx = (currentPage - 1) * pageSize;
                  const endIdx = Math.min(totalItems, startIdx + pageSize);
                  return productos.slice(startIdx, endIdx).map((producto, idx) => {
                    const gIdx = startIdx + idx;
                    return (
                  <tr key={producto.id || gIdx} className="border-t text-center">
                    <td className="p-2">{gIdx + 1}</td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {esEditable ? (
                        <div
                          contentEditable
                          onBlur={e => handleChange(gIdx, "empresaTitular", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {producto.empresaTitular}
                        </div>
                      ) : (
                        <div className="p-1">{producto.empresaTitular}</div>
                      )}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {esEditable ? (
                        <div
                          contentEditable
                          onBlur={e => handleChange(gIdx, "nombreProducto", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {producto.nombreProducto}
                        </div>
                      ) : (
                        <div className="p-1">{producto.nombreProducto}</div>
                      )}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {esEditable ? (
                        <div
                          contentEditable
                          onBlur={e => handleChange(gIdx, "papel", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {format2(producto.papel)}
                        </div>
                      ) : (
                        <div className="p-1">{format2(producto.papel)}</div>
                      )}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {esEditable ? (
                        <div
                          contentEditable
                          onBlur={e => handleChange(gIdx, "metalFerrosos", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {format2(producto.metalFerrosos)}
                        </div>
                      ) : (
                        <div className="p-1">{format2(producto.metalFerrosos)}</div>
                      )}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {esEditable ? (
                        <div
                          contentEditable
                          onBlur={e => handleChange(gIdx, "metalNoFerrosos", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {format2(producto.metalNoFerrosos)}
                        </div>
                      ) : (
                        <div className="p-1">{format2(producto.metalNoFerrosos)}</div>
                      )}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {esEditable ? (
                        <div
                          contentEditable
                          onBlur={e => handleChange(gIdx, "carton", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {format2(producto.carton)}
                        </div>
                      ) : (
                        <div className="p-1">{format2(producto.carton)}</div>
                      )}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {esEditable ? (
                        <div
                          contentEditable
                          onBlur={e => handleChange(gIdx, "vidrio", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {format2(producto.vidrio)}
                        </div>
                      ) : (
                        <div className="p-1">{format2(producto.vidrio)}</div>
                      )}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {esEditable ? (
                        <>
                          <select
                            value={producto.multimaterial.multimaterial}
                            onChange={e => handleChange(gIdx, "multimaterial.multimaterial", e.target.value)}
                            className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!esEditable}
                          >
                            <option value="">Seleccione...</option>
                            <option value="Si">Si</option>
                            <option value="No">No</option>
                          </select>
                          {producto.multimaterial.multimaterial === "Si" && (
                            <select
                              value={producto.multimaterial.tipo}
                              onChange={e => handleChange(gIdx, "multimaterial.tipo", e.target.value)}
                              className="w-full mt-1 p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={!esEditable}
                            >
                              <option value="">Seleccione tipo...</option>
                              <option value="Papel multimaterial o laminado">Papel multimaterial o laminado</option>
                              <option value="Polyboard - papel para bebidas">Polyboard - papel para bebidas</option>
                              <option value="Carton multimaterial o laminado">Cartón multimaterial o laminado</option>
                              <option value="Carton para bebidas">Cartón para bebidas</option>
                              <option value="Otro">Otro</option>
                            </select>
                          )}
                          {producto.multimaterial.multimaterial === "Si" && producto.multimaterial.tipo === "Otro" && (
                            <input
                              type="text"
                              className="w-full mt-1 p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Especifique otro tipo"
                              value={producto.multimaterial.otro}
                              onChange={e => handleChange(gIdx, "multimaterial.otro", e.target.value)}
                              disabled={!esEditable}
                            />
                          )}
                        </>
                      ) : (
                        <div className="p-1">
                          {producto.multimaterial && typeof producto.multimaterial === 'object'
                            ? `${producto.multimaterial.multimaterial || ''} ${producto.multimaterial.tipo || ''} ${producto.multimaterial.otro || ''}`
                            : ''}
                        </div>
                      )}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {tipoReporte === "totalizado" ? (
                        <div className="w-fit max-w-full p-1 border border-gray-300 bg-gray-100 text-center">1</div>
                      ) : esEditable ? (
                        <div
                          contentEditable
                          onBlur={e => handleChange(gIdx, "unidades", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {producto.unidades}
                        </div>
                      ) : (
                        <div className="p-1">{producto.unidades}</div>
                      )}
                    </td>
                    {!readonly && (
                      <td>
                        <button 
                          className="bg-red-500 text-white px-4 py-1 rounded" 
                          onClick={e => { e.preventDefault(); setProductos(productos.filter((_, i) => i !== gIdx)); }}
                          disabled={!esEditable}
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                )});
                })()}
              </tbody>
            </table>
          </div>
          {/* Paginación inferior */}
          {productos.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2">
              {(() => {
                const totalItems = productos.length;
                const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
                return (
                  <>
                    <div className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages} — Mostrando {Math.min(pageSize, totalItems - (currentPage - 1) * pageSize)} de {totalItems}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        onClick={() => setCurrentPage(p => {
                          const tp = Math.max(1, Math.ceil(totalItems / pageSize));
                          return Math.min(tp, p + 1);
                        })}
                        disabled={currentPage >= Math.ceil(totalItems / pageSize)}
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          {!readonly && (
            <button
              type="submit"
              className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
              disabled={!esEditable}
            >
              Guardar
            </button>
          )}
        </form>
      </div>
      {/* Modal con react-modal y estilos de Informacion.js */}
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        className="mx-auto my-32 bg-white p-5 rounded-lg shadow-lg max-w-xl z-40 max-h-460-px overflow-y-auto outline-none"
        overlayClassName=""
        contentLabel="Instructivo de la sección"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="text-xl font-bold mb-4">Instructivo de la sección</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">Campo</th>
                <th className="border border-gray-300 px-4 py-2">Tipo</th>
                <th className="border border-gray-300 px-4 py-2">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 px-4 py-2">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          className="bg-blueGray-600 text-white px-4 py-2 rounded mt-3"
          onClick={() => setIsOpen(false)}
        >
          Cerrar
        </button>
      </Modal>
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};
