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
  const [erroresCampos, setErroresCampos] = useState({}); // {`${index}-campo`: "mensaje"}
  const [uploadProgress, setUploadProgress] = useState({ total: 0, done: 0 });

  // Descarga un archivo .txt con el detalle de errores del cargue
  const descargarErroresTXT = (errores = [], nombreArchivoOriginal = "") => {
    try {
      const encabezado = [
        "Errores de carga - Empaque Primario (Línea Base)",
        `Archivo: ${nombreArchivoOriginal || "(sin nombre)"}`,
        `Fecha: ${new Date().toLocaleString()}`,
        "",
      ];
      const lineas = errores.length > 0 ? errores.map((e) => `- ${e}`) : ["(Sin detalles adicionales)"];
      const contenido = [...encabezado, ...lineas].join("\r\n");
      const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = nombreArchivoOriginal ? nombreArchivoOriginal.replace(/\.[^/.]+$/, "") : "errores_carga_empaque_primario";
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

  // Helper para mostrar siempre con máximo dos decimales (sin afectar almacenamiento interno)
  const format2 = (v) => {
    if (v === null || v === undefined || v === "") return "";
    // Aceptar valores con coma o punto, convertir a número
    const num = parseFloat(v.toString().replace(',', '.'));
    if (isNaN(num)) return v; // si no es número, devolver original
    return num.toFixed(2).replace('.', ',');
  };

  // Mover fetchToneladasAcumuladas fuera de los hooks para que esté disponible globalmente
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
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesPrimarios/${idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron empaques primarios para este idInformacion.");
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
            return v; // dejar original si no coincide
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
        // Normalizar Si/No en objetos multimaterial
        productosFormateados.forEach(p => {
          if (p.multimaterial && typeof p.multimaterial === 'object') {
            p.multimaterial.multimaterial = normalizarSiNo(p.multimaterial.multimaterial);
          }
        });
  setProductos(productosFormateados);
  setCurrentPage(1);
      } catch (error) {
        console.error("Error al obtener los empaques primarios:", error);
      }
    };
    if (idInformacionF) {
      fetchProductos();
    }
  }, [idInformacionF, tipoReporte]);

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
    const nuevo = {
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
    };
    setProductos(prev => [...prev, nuevo]);
  };

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];
    if (field.startsWith("multimaterial.")) {
      const subField = field.split(".")[1];
      nuevosProductos[index].multimaterial = {
        ...nuevosProductos[index].multimaterial,
        [subField]: value
      };
    } else {
      let inputValue = value.trim();
      // Validaciones para campos numéricos
      const camposNumericos = ["papel", "metalFerrosos", "metalNoFerrosos", "carton", "vidrio", "unidades"]; // unidades numérica (entera)
      const keyError = `${index}-${field}`;
      const nuevoErrores = { ...erroresCampos };
      if (camposNumericos.includes(field)) {
        // Prohibir punto
        if (inputValue.includes(".")) {
          nuevoErrores[keyError] = "Use coma (,) como separador decimal";
        } else {
          // Regex: enteros o con coma y hasta 2 decimales
          const regex = field === "unidades" ? /^\d*$/ : /^\d+(,\d{0,2})?$/;
          if (inputValue === "") {
            // permitir vacío temporalmente
            delete nuevoErrores[keyError];
          } else if (!regex.test(inputValue)) {
            nuevoErrores[keyError] = field === "unidades" ? "Solo dígitos" : "Máx 2 decimales con coma";
          } else {
            delete nuevoErrores[keyError];
          }
        }
        setErroresCampos(nuevoErrores);
      }
      nuevosProductos[index][field] = inputValue;
    }
    // Si tipoReporte es totalizado y se intenta cambiar unidades, forzar a 1
    if (tipoReporte === "totalizado") {
      nuevosProductos[index].unidades = "1";
    }
    setProductos(nuevosProductos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Validaciones requeridas
  const camposNumericos = ["papel", "metalFerrosos", "metalNoFerrosos", "carton", "vidrio"];
  const decimalRegexComa = /^\d+(,\d{1,2})?$/; // hasta 2 decimales con coma
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      // 1. empresaTitular y nombreProducto requeridos
      if (!producto.empresaTitular || !producto.nombreProducto) {
        alert(`En la fila ${i + 1}, 'Empresa titular' y 'Nombre Producto' son obligatorios.`);
        setIsLoading(false);
        return;
      }
      // 2. Al menos un material debe ser mayor a 0 (aceptando coma como separador)
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
      // 4. Multimaterial validaciones + dependientes
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
      } else { // No
        if (producto.multimaterial.tipo.trim() || producto.multimaterial.otro.trim()) {
          alert(`En la fila ${i + 1}, los campos de tipo/otro multimaterial deben estar vacíos cuando 'Multimaterial' es 'No'.`);
          setIsLoading(false);
          return;
        }
      }
      // 5. Unidades debe tener un valor (entero y sin coma/punto)
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
      // Serializar multimaterial y normalizar números (convertir coma a punto para backend)
      const productosSerializados = productos.map(p => {
        const normalizar = v => {
          if (v === null || v === undefined || v === "") return "0";
            if (typeof v === 'string') {
              if (v.includes('.')) throw new Error('Formato con punto detectado en números (no permitido).');
              return v.replace(',', '.');
            }
          return String(v);
        };
        // No incluir 'id' para evitar conflictos en INSERT; mantener orden y claves estables
        return {
          idInformacionF: p.idInformacionF,
          empresa: p.empresaTitular,
          nombre_producto: p.nombreProducto,
          papel: normalizar(p.papel),
          metal_ferrosos: normalizar(p.metalFerrosos),
          metal_no_ferrososs: normalizar(p.metalNoFerrosos),
          carton: normalizar(p.carton),
          vidrios: normalizar(p.vidrio),
          multimaterial: JSON.stringify({
            multimaterial: p.multimaterial.multimaterial,
            tipo: p.multimaterial.tipo,
            otro: p.multimaterial.otro
          }),
          unidades: p.unidades ? String(p.unidades) : '0'
        };
      });
      // Enviar en lotes con paralelismo limitado y metadatos para evitar reemplazos
  const chunkSize = 200; // reducido para evitar 413
      const chunks = [];
      for (let i = 0; i < productosSerializados.length; i += chunkSize) {
        chunks.push(productosSerializados.slice(i, i + chunkSize));
      }
      const importId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const totalChunks = chunks.length;
  const concurrency = 2; // menor paralelismo para reducir presión
      setUploadProgress({ total: totalChunks, done: 0 });

      let enviados = 0;
      let nextIndex = 0;
      const uploadChunk = async (index) => {
        const chunk = chunks[index];
        const isFirst = index === 0;
        const url = `${API_BASE_URL}/informacion-f/crearEmpaquePri?importId=${encodeURIComponent(importId)}&batchIndex=${index}&batchCount=${totalChunks}&mode=${isFirst ? 'replace' : 'append'}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(chunk),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Lote ${index + 1}/${totalChunks}: Error ${response.status}: ${errorText}`);
        }
        enviados += chunk.length;
        setUploadProgress((p) => ({ total: p.total, done: p.done + 1 }));
      };
      // Subir el primer lote de forma secuencial para garantizar el 'replace'
      if (totalChunks > 0) {
        await uploadChunk(0);
        nextIndex = 1;
      }
      const workers = Array.from({ length: Math.min(concurrency, totalChunks) }, async () => {
        while (true) {
          const current = nextIndex++;
          if (current >= totalChunks) break;
          await uploadChunk(current);
        }
      });
      await Promise.all(workers);
      alert(`Se guardaron ${enviados} registros correctamente en ${totalChunks} lote(s).`);
      await fetchToneladasAcumuladas();
      // No recargar la página
    } catch (error) {
      console.error("Error al enviar los empaques primarios:", error);
      alert(`Error: ${error.message}`);
    } finally {
  setIsLoading(false);
  setUploadProgress({ total: 0, done: 0 });
    }
  };

  // Excel download functionality
  const descargarPlantilla = async () => {
    // Encabezados estándar
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

  // Hoja 1 (solo encabezados estrictamente)
  const sheetEntrada = workbook.addWorksheet('Empaques');
  sheetEntrada.addRow(headers);
  sheetEntrada.getRow(1).font = { bold: true };
  sheetEntrada.columns.forEach(col => { col.width = 24; });

    // Hoja 2 (ejemplos + instrucciones)
    const sheetEjemplos = workbook.addWorksheet('Ejemplos_Instrucciones');
    const unidadesEjemplo = tipoReporte === 'totalizado' ? '1' : '1500';
    const datosEjemplo = [
      ['Ejemplo Empresa A', 'Producto Ejemplo 1', '5,50', '2,30', '0', '15,70', '0', 'No', '', '', unidadesEjemplo],
      ['Ejemplo Empresa B', 'Producto Ejemplo 2', '0', '8,25', '3,10', '0', '12,80', 'Si', 'Papel multimaterial o laminado', '', (tipoReporte === 'totalizado' ? '1' : '2300')],
      ['Ejemplo Empresa C', 'Producto Ejemplo 3', '1,20', '0', '0', '25,50', '0', 'Si', 'Otro', 'Material compuesto especial', (tipoReporte === 'totalizado' ? '1' : '800')],
    ];
    sheetEjemplos.addRow(headers).font = { bold: true };
    datosEjemplo.forEach(r => sheetEjemplos.addRow(r));
    sheetEjemplos.columns.forEach(col => { col.width = 26; });

    let fila = sheetEjemplos.addRow([]).number; // fila en blanco
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
      'Los pesos deben estar en gramos, usar coma para decimales (máx 2 en la interfaz).',
    ];
    if (tipoReporte === 'totalizado') {
      instrucciones.unshift('IMPORTANTE: Las unidades deben ser 1 para reportes totalizados.', '');
    }
    instrucciones.forEach(texto => {
      const row = sheetEjemplos.addRow([texto]);
      sheetEjemplos.mergeCells(`A${row.number}:K${row.number}`);
      if (/INSTRUCCIONES/.test(texto) || /IMPORTANTE/.test(texto)) {
        row.font = { bold: true };
      }
    });

    // Descargar
    const nombreArchivo = tipoReporte === 'totalizado'
      ? 'plantilla_empaques_primarios_totalizado.xlsx'
      : 'plantilla_empaques_primarios.xlsx';
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando Excel:', err);
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
        // Leer como matriz para detectar si hay fila de nota previa a encabezados
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!rawRows || rawRows.length === 0) {
          descargarErroresTXT(["El archivo Excel está vacío."], file?.name);
          alert('El archivo Excel está vacío. Se descargó un .txt con el detalle.');
          if (event && event.target) event.target.value = '';
          return;
        }
        // Buscar fila que contenga los encabezados (que incluya 'Empresa' y 'Nombre')
        let headerIndex = rawRows.findIndex(r => Array.isArray(r) && r.some(c => typeof c === 'string' && c.toLowerCase().includes('empresa')) && r.some(c => typeof c === 'string' && c.toLowerCase().includes('nombre')));
        if (headerIndex === -1) {
          descargarErroresTXT([
            'No se encontraron encabezados válidos en el Excel (faltan columnas como Empresa titular, Nombre Producto).'
          ], file?.name);
          alert('Encabezados inválidos. Se descargó un .txt con el detalle.');
          if (event && event.target) event.target.value = '';
          return;
        }
        const headers = rawRows[headerIndex].map(h => (h || '').toString().trim());
        const dataMatrix = rawRows.slice(headerIndex + 1).filter(r => r.some(c => c !== null && c !== undefined && c !== ''));
        const jsonData = dataMatrix.map(rowArr => {
          const obj = {};
            headers.forEach((h, i) => { obj[h] = rowArr[i]; });
          return obj;
        });
        if (jsonData.length === 0) {
          descargarErroresTXT(['No hay filas de datos después de los encabezados.'], file?.name);
          alert('No hay filas de datos. Se descargó un .txt con el detalle.');
          if (event && event.target) event.target.value = '';
          return;
        }

        // Mapeo de columnas con flexibilidad
        const normalizarSiNo = (v) => {
          if (v === null || v === undefined) return "";
          const s = v.toString().trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
          if (s === 'si') return 'Si';
          if (s === 'no') return 'No';
          return v.toString().trim();
        };
        const mapearColumnas = (row) => {
          const keys = Object.keys(row);
          const lower = keys.map(k => k.toLowerCase());
          const findKey = (predicate) => {
            const idx = lower.findIndex(predicate);
            return idx >= 0 ? keys[idx] : null;
          };
          return {
            empresaTitular: row[findKey(k => k.includes('empresa') || k.includes('titular'))] || "",
            nombreProducto: row[findKey(k => k.includes('nombre') && k.includes('producto'))] || "",
            papel: row[findKey(k => k.includes('papel'))] || "0",
            metalFerrosos: row[findKey(k => k.includes('metal') && k.includes('ferr') && !k.includes('no'))] || "0",
            metalNoFerrosos: row[findKey(k => k.includes('metal') && k.includes('no') && k.includes('ferr'))] || "0",
            carton: row[findKey(k => k.includes('cart'))] || "0",
            vidrio: row[findKey(k => k.includes('vidrio'))] || "0",
            multimaterial: normalizarSiNo(row[findKey(k => k.includes('multimaterial') && !k.includes('tipo') && !k.includes('otro'))] || ""),
            tipoMultimaterial: row[findKey(k => k.includes('tipo') && k.includes('multimaterial'))] || "",
            otroMultimaterial: row[findKey(k => k.includes('otro') && k.includes('multimaterial'))] || "",
            unidades: row[findKey(k => k.includes('unidades'))] || ""
          };
        };

        // Validar y procesar datos
  const productosValidados = [];
        const errores = [];
        const camposNumericos = ["papel", "metalFerrosos", "metalNoFerrosos", "carton", "vidrio"];
        const decimalRegex = /^\d+(\.\d{1,10})?$/;

        jsonData.forEach((row, index) => {
          const producto = mapearColumnas(row);
          const numeroFila = headerIndex + 2 + index; // fila real en Excel considerando encabezados y base 1

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

          // 3. Validar campos numéricos
          for (const campo of camposNumericos) {
            let valor = producto[campo];
            if (valor !== "" && valor !== null && valor !== undefined) {
              valor = valor.toString().replace(/,/g, ".");
              if (!decimalRegex.test(valor)) {
                errores.push(`Fila ${numeroFila}: '${campo}' debe ser un número decimal válido (máx 10 decimales). Valor: ${producto[campo]}`);
              } else {
                producto[campo] = valor;
              }
            } else {
              producto[campo] = "0";
            }
          }

          // 4. Validar que al menos un material sea mayor a 0
          const sumaMateriales = camposNumericos.map(campo => Number(producto[campo]) || 0);
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
          } else {
            // No totalizado: unidades deben ser enteras (sin coma ni punto)
            const unidadesStr = producto.unidades != null ? producto.unidades.toString().trim() : "";
            if (!/^\d+$/.test(unidadesStr)) {
              errores.push(`Fila ${numeroFila}: 'Unidades' debe ser un número entero sin separadores ni decimales. Valor: ${producto.unidades}`);
            } else {
              producto.unidades = unidadesStr;
            }
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

  // Actualizar estado con productos validados y volver a la primera página
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
        alert('Ocurrió un error al procesar el Excel. Se descargó un .txt con el detalle.');
        if (event && event.target) event.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Limpiar input
  };

  return (
    <div
      className={
        "flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded relative " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
      style={{ minHeight: '100vh' }}
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
          <span className="text-blue-700 font-semibold mt-4 bg-white px-4 py-2 rounded-lg shadow">
            Guardando información... {uploadProgress.total > 0 ? `(${uploadProgress.done}/${uploadProgress.total} lotes)` : ''}
          </span>
        </div>
      </Backdrop>
      
      {/* Modal usando react-modal, igual que Informacion.js */}
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
              {[
                ["Empresa titular del Producto", "Texto", "Razón social/Nombre de cada persona natural o jurídica (titular de registro) representada por la empresa vinculada a Soluciones Ambientales Sostenibles Punto Azul"],
                ["Nombre del Producto", "Texto", "Nombre del producto que está reportando"],
                ["Papel (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de PAPEL."],
                ["Metal Ferrosos(g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de METAL."],
                ["Metal No Ferrosos(g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de METAL NO FERROSO."],
                ["Cartón (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de CARTÓN."],
                ["Vidrio (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de VIDRIO."],
                ["Multimaterial", "Texto", "Producto o empaque hecho de dos o más materiales diferentes combinados, como plástico y metal, en una sola estructura."],
                ["Unidades del Producto puestas en el mercado", "Número", "Total de empaques puestos en el mercado del Producto indicado durante el año reportado."],
              ].map((row, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                      {cell}
                    </td>
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
      {/* SECCIÓN II */}
      <div className="p-4 border-b">
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
        {/* ...existing code for the form and table... */}
        <form onSubmit={handleSubmit}>
          <div className="w-full overflow-x-auto p-4">
            <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-2 py-1">No.</th>
                  <th className="border border-gray-300 px-2 py-1">Empresa titular</th>
                  <th className="border border-gray-300 px-2 py-1">Nombre Producto</th>
                  <th className="border border-gray-300 px-2 py-1">Papel (g)</th>
                  <th className="border border-gray-300 px-2 py-1">Metal Ferrosos (g)</th>
                  <th className="border border-gray-300 px-2 py-1">Metal No Ferrosos (g)</th>
                  <th className="border border-gray-300 px-2 py-1">Cartón (g)</th>
                  <th className="border border-gray-300 px-2 py-1">Vidrio (g)</th>
                  <th className="border border-gray-300 px-2 py-1">Multimaterial</th>
                  <th className="border border-gray-300 px-2 py-1">Unidades</th>
                  {!readonly && <th className="border border-gray-300 px-2 py-1">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan={readonly ? 10 : 11} className="text-center py-2">No hay productos guardados.</td>
                  </tr>
                ) : (
                  // Renderizar solo la página actual
                  (() => {
                    const totalItems = productos.length;
                    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
                    const startIdx = (currentPage - 1) * pageSize;
                    const endIdx = Math.min(totalItems, startIdx + pageSize);
                    return productos.slice(startIdx, endIdx).map((producto, idx) => {
                      const gIdx = startIdx + idx;
                      return (
                        <tr key={producto.id || gIdx} className="hover:bg-gray-100 text-center">
                          <td className="border border-gray-300 px-2 py-1">{gIdx + 1}</td>
                      <td className="border border-gray-300 px-2 py-1">
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
                      <td className="border border-gray-300 px-2 py-1">
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
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(gIdx, "papel", e.target.textContent || "")}
                            className={`w-fit max-w-full p-1 border ${erroresCampos[`${gIdx}-papel`] ? 'border-red-500' : 'border-transparent'} hover:border-gray-400 focus:border-blue-500 focus:outline-none`}
                            title={erroresCampos[`${gIdx}-papel`] || ''}
                          >
                            {format2(producto.papel)}
                          </div>
                        ) : (
                          <div className="p-1">{format2(producto.papel)}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(gIdx, "metalFerrosos", e.target.textContent || "")}
                            className={`w-fit max-w-full p-1 border ${erroresCampos[`${gIdx}-metalFerrosos`] ? 'border-red-500' : 'border-transparent'} hover:border-gray-400 focus:border-blue-500 focus:outline-none`}
                            title={erroresCampos[`${gIdx}-metalFerrosos`] || ''}
                          >
                            {format2(producto.metalFerrosos)}
                          </div>
                        ) : (
                          <div className="p-1">{format2(producto.metalFerrosos)}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(gIdx, "metalNoFerrosos", e.target.textContent || "")}
                            className={`w-fit max-w-full p-1 border ${erroresCampos[`${gIdx}-metalNoFerrosos`] ? 'border-red-500' : 'border-transparent'} hover:border-gray-400 focus:border-blue-500 focus:outline-none`}
                            title={erroresCampos[`${gIdx}-metalNoFerrosos`] || ''}
                          >
                            {format2(producto.metalNoFerrosos)}
                          </div>
                        ) : (
                          <div className="p-1">{format2(producto.metalNoFerrosos)}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(gIdx, "carton", e.target.textContent || "")}
                            className={`w-fit max-w-full p-1 border ${erroresCampos[`${gIdx}-carton`] ? 'border-red-500' : 'border-transparent'} hover:border-gray-400 focus:border-blue-500 focus:outline-none`}
                            title={erroresCampos[`${gIdx}-carton`] || ''}
                          >
                            {format2(producto.carton)}
                          </div>
                        ) : (
                          <div className="p-1">{format2(producto.carton)}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(gIdx, "vidrio", e.target.textContent || "")}
                            className={`w-fit max-w-full p-1 border ${erroresCampos[`${gIdx}-vidrio`] ? 'border-red-500' : 'border-transparent'} hover:border-gray-400 focus:border-blue-500 focus:outline-none`}
                            title={erroresCampos[`${gIdx}-vidrio`] || ''}
                          >
                            {format2(producto.vidrio)}
                          </div>
                        ) : (
                          <div className="p-1">{format2(producto.vidrio)}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
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
                      <td className="border border-gray-300 px-2 py-1">
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
                        <td className="border border-gray-300 px-2 py-1">
                          <button
                            className="bg-red-500 text-white px-4 py-1 rounded"
                            onClick={e => {
                              e.preventDefault();
                              setProductos(prev => {
                                const next = prev.filter((_, i) => i !== gIdx);
                                return next;
                              });
                            }}
                            disabled={!esEditable}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                        </tr>
                      );
                    });
                  })()
                )}
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
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};
