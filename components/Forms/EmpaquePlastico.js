import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../utils/config";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Oval } from 'react-loader-spinner';
import Backdrop from '@mui/material/Backdrop';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
export default function FormularioAfiliado({ color, readonly = false, idInformacionF: propIdInformacionF }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Cargando...");
  let idInformacionF = propIdInformacionF || localStorage.getItem("idInformacionF");
  let estadoInformacionF = localStorage.getItem("estadoInformacionF");
  // Solo editable si estado es Guardado o Rechazado Y no está en modo readonly
  const esEditable = !readonly && (estadoInformacionF === "Guardado" || estadoInformacionF === "Rechazado");
  const [productos, setProductos] = useState([]);
  // Paginación
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [toneladasAcumuladasGlobal, setToneladasAcumuladasGlobal] = useState(0);
  const [erroresCampos, setErroresCampos] = useState({});
  const [uploadProgress, setUploadProgress] = useState({ total: 0, done: 0 });

  // Helper: descarga un TXT con el resumen de errores de carga Excel
  const descargarErroresTXT = (errores = [], nombreArchivoOriginal = "archivo.xlsx") => {
    try {
      const ahora = new Date();
      const encabezado = [
        `Archivo procesado: ${nombreArchivoOriginal}`,
        `Fecha: ${ahora.toLocaleString()}`,
        `Total de errores: ${errores.length}`,
        "",
        "DETALLE:"
      ].join("\n");
      const contenido = `${encabezado}\n${errores.join("\n")}`;
      const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `errores_empaques_plasticos_${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("No se pudo generar el archivo TXT de errores:", e);
      alert("No se pudo generar el archivo TXT de errores.");
    }
  };

  // Obtener productos desde el backend al cargar el componente
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dependencia intencionalmente limitada a idInformacionF
  useEffect(() => {
    const fetchProductos = async () => {
      if (!idInformacionF) {
        console.log("Sin idInformacionF, no se pueden cargar productos");
        return;
      }
      
      setIsLoading(true);
      setLoadingMessage("Cargando empaques plásticos...");
      
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesPlasticos/${idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron empaques plásticos para este idInformacionF.");
            setIsLoading(false);
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        setLoadingMessage("Procesando datos...");
        const data = await response.json();
        console.log("Empaques plásticos obtenidos:", data);
        // Mapear los datos recibidos al formato esperado por el componente
        const productosFormateados = data.map(producto => ({
          id: producto.idEmpaque,
          idInformacionF: producto.idInformacionF,
          empresaTitular: producto.empresa || "",
          nombreProducto: producto.nombre_producto || "",
          pet: producto.pet || "",
          unidades: producto.unidades || "",
          liquidos: JSON.parse(producto.liquidos || "{}"),
          otrosProductos: JSON.parse(producto.otros || "{}"),
          construccion: JSON.parse(producto.construccion || "{}"),
          excepciones: producto.excepciones || "",
          prohibiciones: producto.prohibiciones || "",
        }));
        setProductos(productosFormateados);
        setCurrentPage(1);
        setLoadingMessage(`${productosFormateados.length} empaques cargados correctamente`);
      } catch (error) {
        console.error("Error al obtener los empaques plásticos:", error);
        setLoadingMessage("Error al cargar empaques plásticos");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (idInformacionF) {
      fetchProductos();
    }
  }, [idInformacionF]);

  // --- Toneladas acumuladas globales ---
  // Definir la función fuera del useEffect para poder reutilizarla
  const fetchToneladasAcumuladas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/getToneladasAcumuladasPlasticos/${idInformacionF}`);
      if (!response.ok) throw new Error("No se pudo obtener toneladas acumuladas");
      const data = await response.json();
      setToneladasAcumuladasGlobal(Number(data.toneladas) || 0);
    } catch {
      setToneladasAcumuladasGlobal(0);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- dependencia intencional a idInformacionF
  useEffect(() => {
    if (idInformacionF) {
      fetchToneladasAcumuladas();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idInformacionF]);

  // Mantener currentPage dentro de rango cuando cambian productos o pageSize
  // eslint-disable-next-line react-hooks/exhaustive-deps -- recalcular páginas solo cuando cambian productos o pageSize
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((productos?.length || 0) / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [productos, pageSize, currentPage]);

  const agregarProducto = () => {
    setProductos([
      ...productos,
      {
        id: productos.length + 1,
        idInformacionF,
        empresaTitular: "",
        nombreProducto: "",
        liquidos: {
          "PET Agua": '0,00',
          "PET Otros": '0,00',
          "PET": '0,00',
          HDPE: '0,00',
          PVC: '0,00',
          LDPE: '0,00',
          PP: '0,00',
          PS: '0,00',
          Otros: '0,00'
        },
        otrosProductos: {
          PET: '0,00',
          HDPE: '0,00',
          PVC: '0,00',
          LDPE: '0,00',
          PP: '0,00',
          PS: '0,00',
          Otros: '0,00'
        },
        construccion: {
          PET: '0,00',
          HDPE: '0,00',
          PVC: '0,00',
          LDPE: '0,00',
          PP: '0,00',
          PS: '0,00',
          Otros: '0,00'
        },
        excepciones: "",
        prohibiciones: "",
        unidades: localStorage.getItem("tipoReporte") === "totalizado" ? "1" : ""
      },
    ]);
  };

  // (format2 eliminado para reducir peso y porque no se usa en render ahora)

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];
    const tipoReporteLocal = localStorage.getItem('tipoReporte');
    const registrar = (objRef, subField, raw) => {
      let val = raw.trim();
      const keyErr = `${index}-${field}`;
      const nuevoErr = { ...erroresCampos };
      if (val.includes('.')) {
        nuevoErr[keyErr] = 'Use coma (,) para decimales';
      } else if (val !== '' && !/^\d+(,\d{0,10})?$/.test(val)) {
        nuevoErr[keyErr] = 'Máx 10 decimales con coma';
      } else {
        delete nuevoErr[keyErr];
      }
      setErroresCampos(nuevoErr);
      objRef[subField] = val === '' ? '' : val; // mantener tal cual; formateo visual con format2
    };
    if (field.startsWith('liquidos.')) {
      const sub = field.split('.')[1];
      if (typeof nuevosProductos[index].liquidos === 'string') {
        try { nuevosProductos[index].liquidos = JSON.parse(nuevosProductos[index].liquidos); } catch { nuevosProductos[index].liquidos = {}; }
      }
      registrar(nuevosProductos[index].liquidos, sub, value);
    } else if (field.startsWith('otrosProductos.')) {
      const sub = field.split('.')[1];
      if (typeof nuevosProductos[index].otrosProductos === 'string') {
        try { nuevosProductos[index].otrosProductos = JSON.parse(nuevosProductos[index].otrosProductos); } catch { nuevosProductos[index].otrosProductos = {}; }
      }
      registrar(nuevosProductos[index].otrosProductos, sub, value);
    } else if (field.startsWith('construccion.')) {
      const sub = field.split('.')[1];
      if (typeof nuevosProductos[index].construccion === 'string') {
        try { nuevosProductos[index].construccion = JSON.parse(nuevosProductos[index].construccion); } catch { nuevosProductos[index].construccion = {}; }
      }
      registrar(nuevosProductos[index].construccion, sub, value);
    } else if (field === 'excepciones' || field === 'prohibiciones') {
      nuevosProductos[index][field] = value;
    } else if (field === 'unidades') {
      if (tipoReporteLocal === 'totalizado') {
        nuevosProductos[index].unidades = '1';
      } else {
        const val = value.trim();
        const keyErr = `${index}-unidades`;
        const nuevoErr = { ...erroresCampos };
        if (val.includes('.') || val.includes(',')) {
          nuevoErr[keyErr] = 'Solo enteros';
        } else if (val !== '' && !/^\d+$/.test(val)) {
          nuevoErr[keyErr] = 'Solo dígitos';
        } else {
          delete nuevoErr[keyErr];
        }
        setErroresCampos(nuevoErr);
        nuevosProductos[index].unidades = val;
      }
    } else {
      nuevosProductos[index][field] = value;
    }
    setProductos(nuevosProductos);
  };

  // sin postInBatches: usaremos importId/batchIndex/batchCount para reemplazo+append

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  const camposLiquidos = ["PET Agua", "PET Otros", "PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"];
  const camposOtros = ["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"];
  const decimalRegexComa = /^\d+(,\d{1,10})?$/;
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      // Validación de empresaTitular, nombreProducto y unidades
      if (!producto.empresaTitular || producto.empresaTitular.trim() === "") {
        alert(`El campo 'Empresa Titular' no puede estar vacío en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      if (!producto.nombreProducto || producto.nombreProducto.trim() === "") {
        alert(`El campo 'Nombre Producto' no puede estar vacío en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      if (!producto.unidades || producto.unidades.toString().trim() === "") {
        alert(`El campo 'Unidades Puestas en el mercado' no puede estar vacío en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      // Validación de excepciones y prohibiciones
      const excepcion = producto.excepciones;
      const prohibicion = producto.prohibiciones;
      // Ambos deben tener una opción válida seleccionada
      if (!excepcion || excepcion === "" || excepcion === "Seleccionar...") {
        alert(`Debe seleccionar una opción válida en el campo 'Excepciones Ley 2232' en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      if (!prohibicion || prohibicion === "" || prohibicion === "Seleccionar...") {
        alert(`Debe seleccionar una opción válida en el campo 'Prohibiciones Ley 2232' en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      // Uno de los dos debe ser 'no_aplica'
      if (excepcion !== "no_aplica" && prohibicion !== "no_aplica") {
        alert(`En la fila ${i + 1}, uno de los campos 'Excepciones Ley 2232' o 'Prohibiciones Ley 2232' debe ser 'No Aplica'.`);
        setIsLoading(false);
        return;
      }
      const validarGrupo = (grupo, nombreGrupo) => {
        let datosGrupo = producto[nombreGrupo];
        if (typeof datosGrupo === 'string') {
          try {
            datosGrupo = JSON.parse(datosGrupo);
          } catch {
            datosGrupo = {};
          }
        }
        datosGrupo = datosGrupo || {};
        producto[nombreGrupo] = datosGrupo;
        for (const campo of grupo) {
          let valor = datosGrupo[campo];
          if (valor === null || valor === undefined || valor === '') {
            datosGrupo[campo] = '0';
            continue;
          }
          const strOriginal = valor.toString().trim();
          let str = strOriginal;
          if (strOriginal.includes('.') && !strOriginal.includes(',')) {
            str = strOriginal.replace('.', ',');
            datosGrupo[campo] = str;
          }
          if (str.includes('.')) { alert(`Fila ${i+1} ${nombreGrupo}.${campo}: No use punto, use coma.`); setIsLoading(false); return false; }
          if (str !== '' && !decimalRegexComa.test(str)) { alert(`Fila ${i+1} ${nombreGrupo}.${campo}: Formato inválido (máx 10 decimales con coma).`); setIsLoading(false); return false; }
        }
        return true;
      };
      if (!validarGrupo(camposLiquidos, 'liquidos')) return;
      if (!validarGrupo(camposOtros, 'otrosProductos')) return;
      if (!validarGrupo(camposOtros, 'construccion')) return;
    }
    // Serializar los campos de plásticos solo una vez antes de enviar
    const convertir = v => {
      if (v === null || v === undefined || v === '') return '0';
      if (typeof v === 'string') {
        if (v.includes('.')) throw new Error('Formato con punto detectado en números (no permitido).');
        return v.replace(',', '.');
      }
      return String(v);
    };
    const productosSerializados = productos.map((producto, idx) => {
      const liq = typeof producto.liquidos === 'string' ? JSON.parse(producto.liquidos) : producto.liquidos;
      const otr = typeof producto.otrosProductos === 'string' ? JSON.parse(producto.otrosProductos) : producto.otrosProductos;
      const cons = typeof producto.construccion === 'string' ? JSON.parse(producto.construccion) : producto.construccion;
      const normGrupo = (g) => Object.fromEntries(Object.entries(g).map(([k,v]) => [k, convertir(v)]));
      // CRÍTICO: Serializar objetos JSON como strings (igual que EmpaquePrimario con multimaterial)
      // Esto reduce drásticamente el tamaño del payload HTTP
      const fila = {
        idInformacionF: producto.idInformacionF,
        empresa: producto.empresaTitular,
        nombre_producto: producto.nombreProducto,
        liquidos: JSON.stringify(normGrupo(liq)),
        otrosProductos: JSON.stringify(normGrupo(otr)),
        construccion: JSON.stringify(normGrupo(cons)),
        excepciones: producto.excepciones,
        prohibiciones: producto.prohibiciones,
        unidades: producto.unidades ? String(producto.unidades) : '0'
      };
      if (idx === 0) {
        console.log('[EmpaquePlastico] Serialización aplicada (ejemplo primera fila):', fila);
      }
      return fila;
    });
    try {
      // --- Chunking dinámico basado en tamaño promedio de fila y límite de paquete del servidor ---
      // Permite override del límite del servidor colocando en consola:
      // localStorage.setItem('serverMaxPacketBytes', '8192'); // Ejemplo si necesita ajustar
      const resolveServerPacketLimit = () => {
        const stored = parseInt(localStorage.getItem('serverMaxPacketBytes'), 10);
        if (!isNaN(stored) && stored > 0) {
          console.info('[EmpaquePlastico] Usando serverMaxPacketBytes de localStorage =', stored);
          return stored;
        }
        console.warn('[EmpaquePlastico] Usando límite por defecto 536870912 bytes (512MB). Si cambió max_allowed_packet ejecute localStorage.setItem("serverMaxPacketBytes", "NUEVO_VALOR") para usar valor personalizado.');
        return 536870912; // 512MB - mismo valor que EmpaquePrimario
      };
      const SERVER_MAX_PACKET_BYTES = resolveServerPacketLimit();
      // CRÍTICO: Plásticos tiene objetos JSON más pesados, usar margen más conservador
      const SAFE_TARGET = Math.floor(SERVER_MAX_PACKET_BYTES * 0.30); // 30% en lugar de 70% para mayor seguridad
      const TARGET_MAX_BYTES = Math.max(SAFE_TARGET, 1000); // garantizar mínimo razonable

      // Calcular tamaño promedio por fila (sample hasta 20)
      const SAMPLE_COUNT = Math.min(20, productosSerializados.length);
      let avgBytesPorFila = 0;
      if (SAMPLE_COUNT > 0) {
        let total = 0;
        for (let i = 0; i < SAMPLE_COUNT; i++) {
          total += new TextEncoder().encode(JSON.stringify(productosSerializados[i])).length;
        }
        avgBytesPorFila = total / SAMPLE_COUNT;
      }
      let rowsPerChunk = 50; // REDUCIDO: plásticos tiene objetos JSON más pesados que primario/secundario
      if (avgBytesPorFila > 0) {
        rowsPerChunk = Math.floor(TARGET_MAX_BYTES / avgBytesPorFila);
        // Límites MÁS CONSERVADORES para datos pesados de plásticos
        if (SERVER_MAX_PACKET_BYTES <= 4096) {
          rowsPerChunk = Math.max(1, Math.min(20, rowsPerChunk));
        } else {
          rowsPerChunk = Math.max(20, Math.min(150, rowsPerChunk)); // Máximo 150 en lugar de 300
        }
      }
      // Fallback adicional: si una sola fila ya excede el SAFE_TARGET, forzar 1 por chunk
      if (avgBytesPorFila > SAFE_TARGET) {
        console.warn('[EmpaquePlastico] Una fila ('+avgBytesPorFila+' bytes) excede SAFE_TARGET='+SAFE_TARGET+' -> forzando micro-chunks de 1 fila');
        rowsPerChunk = 1;
      }
      // Construir chunks preliminares
      const preliminaryChunks = [];
      for (let i = 0; i < productosSerializados.length; i += rowsPerChunk) {
        preliminaryChunks.push(productosSerializados.slice(i, i + rowsPerChunk));
      }
      // Refinar: si algún chunk supera el umbral duro (TARGET_MAX_BYTES), subdividirlo dinámicamente
      const refinedChunks = [];
      for (const ch of preliminaryChunks) {
        let json = JSON.stringify(ch);
        let size = new TextEncoder().encode(json).length;
        if (size <= TARGET_MAX_BYTES) {
          refinedChunks.push(ch);
        } else {
          // Subdividir adaptativamente hasta cumplir límite
            let subStart = 0;
            // Estimar subChunkSize inicial proporcional
            let estimatedSubSize = Math.max(1, Math.floor(ch.length * (TARGET_MAX_BYTES / size)));
            while (subStart < ch.length) {
              let subChunkSize = Math.min(estimatedSubSize, ch.length - subStart);
              // Reducir hasta que entre
              while (subChunkSize > 0) {
                const tentative = ch.slice(subStart, subStart + subChunkSize);
                const tJson = JSON.stringify(tentative);
                const tBytes = new TextEncoder().encode(tJson).length;
                if (tBytes <= TARGET_MAX_BYTES || tentative.length === 1) {
                  refinedChunks.push(tentative);
                  subStart += tentative.length;
                  break;
                }
                subChunkSize = Math.floor(subChunkSize / 2);
              }
              if (subChunkSize === 0) {
                // fallback de seguridad
                refinedChunks.push([ch[subStart]]);
                subStart += 1;
              }
            }
        }
      }
      const chunks = refinedChunks;
      // Log detallado de tamaños de cada chunk
      console.log('[EmpaquePlastico] avgBytesPorFila=', avgBytesPorFila.toFixed(2), 'rowsPerChunkEstimado=', rowsPerChunk, 'chunksPreSplit=', preliminaryChunks.length, 'chunksFinal=', chunks.length, 'TARGET_MAX_BYTES=', TARGET_MAX_BYTES, 'SERVER_MAX_PACKET_BYTES=', SERVER_MAX_PACKET_BYTES);
      chunks.forEach((c,i)=>{
        const b = new TextEncoder().encode(JSON.stringify(c)).length;
        console.log(`[EmpaquePlastico] Chunk ${i+1}/${chunks.length} bytes=${b}`);
      });

      const importId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const totalChunks = chunks.length;
      const concurrency = 1; // REDUCIDO A 1: plásticos genera chunks más pesados, enviar de uno en uno
      setUploadProgress({ total: totalChunks, done: 0 });
      
      let enviados = 0;
      let nextIndex = 0;
      const uploadChunk = async (index) => {
        const chunk = chunks[index];
        const isFirst = index === 0;
        const url = `${API_BASE_URL}/informacion-f/crearEmpaquePlastico?importId=${encodeURIComponent(importId)}&batchIndex=${index}&batchCount=${totalChunks}&mode=${isFirst ? 'replace' : 'append'}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(chunk)
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Lote ${index + 1}/${totalChunks}: Error ${response.status}: ${errorText}`);
        }
        enviados += chunk.length;
        setUploadProgress(p => ({ total: p.total, done: p.done + 1 }));
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
      alert(`Se guardaron ${enviados} registros de Empaque Plástico en ${totalChunks} lote(s).`);
      await fetchToneladasAcumuladas();
      if (SERVER_MAX_PACKET_BYTES === 536870912 && productosSerializados.length > 10000) {
        console.info("[EmpaquePlastico] Rendimiento óptimo: Con max_allowed_packet=512MB puede procesar lotes grandes eficientemente.");
      }
    } catch (error) {
      console.error("Error al enviar los empaques plásticos:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setUploadProgress({ total: 0, done: 0 });
    }
  };

  // Excel download functionality
  const descargarPlantilla = async () => {
    const tipoReporte = localStorage.getItem('tipoReporte');
    const headers = [
      'Empresa titular','Nombre Producto',
      'Liquidos PET Agua (g)','Liquidos PET Otros (g)','Liquidos PET (g)','Liquidos HDPE (g)','Liquidos PVC (g)','Liquidos LDPE (g)','Liquidos PP (g)','Liquidos PS (g)','Liquidos Otros (g)',
      'OtrosProductos PET (g)','OtrosProductos HDPE (g)','OtrosProductos PVC (g)','OtrosProductos LDPE (g)','OtrosProductos PP (g)','OtrosProductos PS (g)','OtrosProductos Otros (g)',
      'Construccion PET (g)','Construccion HDPE (g)','Construccion PVC (g)','Construccion LDPE (g)','Construccion PP (g)','Construccion PS (g)','Construccion Otros (g)',
      'Excepciones','Prohibiciones','Unidades'
    ];
    const workbook = new ExcelJS.Workbook();
    workbook.creator='PuntoAzul'; workbook.created=new Date();
    const sheetEntrada = workbook.addWorksheet('Empaques');
    sheetEntrada.addRow(headers); sheetEntrada.getRow(1).font={bold:true}; sheetEntrada.columns.forEach(c=> c.width=20);
    const sheetEjemplos = workbook.addWorksheet('Ejemplos_Instrucciones');
    sheetEjemplos.addRow(headers).font={bold:true};
    const unidadesEj = tipoReporte==='totalizado'?'1':'500';
    const ejemplo2U = tipoReporte==='totalizado'?'1':'750';
    const ejemplos = [
      ['Ejemplo Empresa A','Envase Plástico 1','2,50','0','1,80','0','0','0,50','0','0','0','3,20','0','0','0','1,10','0','0','0','0','0','0','0','0','0','no_aplica','bolsas_pago',unidadesEj],
      ['Ejemplo Empresa B','Envase Plástico 2','0','3,70','0','2,10','0','0','0','0','0','0','4,50','0','0','0','0','1,80','0','0','0','0','0','0','0','medicos','no_aplica',ejemplo2U]
    ];
    ejemplos.forEach(r=> sheetEjemplos.addRow(r));
    sheetEjemplos.columns.forEach(c=> c.width=22);
    sheetEjemplos.addRow([]);
    const instrucciones = [
      'INSTRUCCIONES IMPORTANTES PARA EMPAQUES PLÁSTICOS:',
      '',
      'Campos obligatorios: Empresa titular, Nombre Producto, Unidades, Excepciones, Prohibiciones',
      "Regla: Uno de Excepciones o Prohibiciones debe ser 'no_aplica'",
      'Valores numéricos: coma (,) para decimales, máx 10. No usar punto.',
      'Campos vacíos se interpretan como 0,00',
      'Opciones Excepciones: medicos, quimicos, alimentos, higiene, asistencia, impacto, residuos, reciclado, pitillos, no_aplica',
      'Opciones Prohibiciones: bolsas_pago, bolsas_publicidad, rollos_bolsas, mezcladores_pitillos, soportes_bombas, soportes_copitos, envases_liquidos, platos_utensilios, confeti_manteles, empaques_alimentos, laminas_alimentos, empaques_frutas, adhesivos_etiquetas, no_aplica'
    ];
    if (tipoReporte==='totalizado') instrucciones.unshift('IMPORTANTE: Unidades deben ser 1 para reporte totalizado','');
    instrucciones.forEach(t=> { const row=sheetEjemplos.addRow([t]); sheetEjemplos.mergeCells(`A${row.number}:AC${row.number}`); if(/INSTRUCCIONES|IMPORTANTE/.test(t)) row.font={bold:true}; });
    const nombreArchivo = tipoReporte==='totalizado'?'plantilla_empaques_plasticos_totalizado.xlsx':'plantilla_empaques_plasticos.xlsx';
    try { const buf = await workbook.xlsx.writeBuffer(); const blob = new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=nombreArchivo; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);} catch(e){ console.error('Error generando Excel:',e); alert('No se pudo generar la plantilla Excel.'); }
  };

  // Excel upload functionality
  const cargarDesdeExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage("Analizando archivo Excel...");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setLoadingMessage("Procesando datos del archivo...");
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!rawRows || rawRows.length===0){
          const errores = ['El archivo Excel está vacío.'];
          descargarErroresTXT(errores, file.name);
          alert('Se generó un TXT con los errores encontrados.');
          event.target.value = '';
          setIsLoading(false);
          return;
        }
        let headerIndex = rawRows.findIndex(r => Array.isArray(r) && r.some(c=> typeof c==='string' && c.toLowerCase().includes('empresa')) && r.some(c=> typeof c==='string' && c.toLowerCase().includes('nombre')));
        if (headerIndex === -1){
          const errores = [
            'No se encontraron encabezados válidos.',
            'Asegúrese de incluir columnas como Empresa titular, Nombre Producto, Excepciones, Prohibiciones y Unidades, además de las columnas numéricas.'
          ];
          descargarErroresTXT(errores, file.name);
          alert('Se generó un TXT con los errores encontrados.');
          event.target.value = '';
          setIsLoading(false);
          return;
        }
  const headers = rawRows[headerIndex].map(h => (h||'').toString().trim());
  const headersLC = headers.map(h => h.toLowerCase());
        const dataMatrix = rawRows.slice(headerIndex+1).filter(r => r.some(c=> c!==null && c!==undefined && c!==''));
        const jsonData = dataMatrix.map(r => { const o={}; headers.forEach((h,i)=> o[h]=r[i]); return o; });
        if (jsonData.length===0){
          const errores = ['No hay filas de datos después de encabezados.'];
          descargarErroresTXT(errores, file.name);
          alert('Se generó un TXT con los errores encontrado.');
          event.target.value = '';
          setIsLoading(false);
          return;
        }
        
        setLoadingMessage(`Validando ${jsonData.length} registros...`);
        const getExact = (row, labelLC) => {
          const idx = headersLC.findIndex(h => h === labelLC);
          return idx >= 0 ? row[headers[idx]] : undefined;
        };
        const getApprox = (row, pred) => {
          const idx = headersLC.findIndex(pred);
          return idx >= 0 ? row[headers[idx]] : undefined;
        };
        const val = (row, label, approxPred) => {
          const exact = getExact(row, label.toLowerCase());
          if (exact !== undefined) return exact;
          const approx = getApprox(row, approxPred);
          return approx !== undefined ? approx : '0';
        };
        const resinNames = ['pet','hdpe','pvc','ldpe','pp','ps'];
        const hasAnyResin = (h) => resinNames.some(r => h.includes(r));
        const mapearColumnas = (row) => {
          const empresa = val(row, 'Empresa titular', h => h.includes('empresa') && !h.includes('producto'));
          const nombre = val(row, 'Nombre Producto', h => h.includes('nombre') && h.includes('producto'));
          // Líquidos (evitar colisiones entre "PET Otros" y "Otros")
          const liq_pet_agua = val(row, 'Liquidos PET Agua (g)', h => h.includes('liquidos') && h.includes('pet') && h.includes('agua'));
          const liq_pet_otros_bebidas = val(row, 'Liquidos PET Otros (g)', h => h.includes('liquidos') && h.includes('pet') && (h.includes('otro') && (h.includes('beb') || h.includes('bebidas'))));
          const liq_pet_otros_liquidos = val(row, 'Liquidos PET (g)', h => h.includes('liquidos') && h.includes('pet') && !h.includes('agua') && !h.includes('otro'));
          const liq_hdpe = val(row, 'Liquidos HDPE (g)', h => h.includes('liquidos') && h.includes('hdpe'));
          const liq_pvc = val(row, 'Liquidos PVC (g)', h => h.includes('liquidos') && h.includes('pvc'));
          const liq_ldpe = val(row, 'Liquidos LDPE (g)', h => h.includes('liquidos') && h.includes('ldpe'));
          const liq_pp = val(row, 'Liquidos PP (g)', h => h.includes('liquidos') && h.includes(' pp'));
          const liq_ps = val(row, 'Liquidos PS (g)', h => h.includes('liquidos') && h.includes(' ps'));
          const liq_otros = val(row, 'Liquidos Otros (g)', h => h.includes('liquidos') && h.includes('otros') && !hasAnyResin(h));

          // Otros Productos
          const op_pet = val(row, 'OtrosProductos PET (g)', h => h.includes('otrosproductos') && h.includes(' pet'));
          const op_hdpe = val(row, 'OtrosProductos HDPE (g)', h => h.includes('otrosproductos') && h.includes('hdpe'));
          const op_pvc = val(row, 'OtrosProductos PVC (g)', h => h.includes('otrosproductos') && h.includes('pvc'));
          const op_ldpe = val(row, 'OtrosProductos LDPE (g)', h => h.includes('otrosproductos') && h.includes('ldpe'));
          const op_pp = val(row, 'OtrosProductos PP (g)', h => h.includes('otrosproductos') && h.includes(' pp'));
          const op_ps = val(row, 'OtrosProductos PS (g)', h => h.includes('otrosproductos') && h.includes(' ps'));
          const op_otros = val(row, 'OtrosProductos Otros (g)', h => h.includes('otrosproductos') && h.includes('otros') && !hasAnyResin(h));

          // Construcción
          const cons_pet = val(row, 'Construccion PET (g)', h => h.includes('construccion') && h.includes(' pet'));
          const cons_hdpe = val(row, 'Construccion HDPE (g)', h => h.includes('construccion') && h.includes('hdpe'));
          const cons_pvc = val(row, 'Construccion PVC (g)', h => h.includes('construccion') && h.includes('pvc'));
          const cons_ldpe = val(row, 'Construccion LDPE (g)', h => h.includes('construccion') && h.includes('ldpe'));
          const cons_pp = val(row, 'Construccion PP (g)', h => h.includes('construccion') && h.includes(' pp'));
          const cons_ps = val(row, 'Construccion PS (g)', h => h.includes('construccion') && h.includes(' ps'));
          const cons_otros = val(row, 'Construccion Otros (g)', h => h.includes('construccion') && h.includes('otros') && !hasAnyResin(h));

          return {
            empresaTitular: empresa || '',
            nombreProducto: nombre || '',
            liquidos: {
              'PET Agua': liq_pet_agua || '0',
              'PET Otros': liq_pet_otros_bebidas || '0',
              'PET': liq_pet_otros_liquidos || '0',
              'HDPE': liq_hdpe || '0',
              'PVC': liq_pvc || '0',
              'LDPE': liq_ldpe || '0',
              'PP': liq_pp || '0',
              'PS': liq_ps || '0',
              'Otros': liq_otros || '0'
            },
            otrosProductos: {
              'PET': op_pet || '0',
              'HDPE': op_hdpe || '0',
              'PVC': op_pvc || '0',
              'LDPE': op_ldpe || '0',
              'PP': op_pp || '0',
              'PS': op_ps || '0',
              'Otros': op_otros || '0'
            },
            construccion: {
              'PET': cons_pet || '0',
              'HDPE': cons_hdpe || '0',
              'PVC': cons_pvc || '0',
              'LDPE': cons_ldpe || '0',
              'PP': cons_pp || '0',
              'PS': cons_ps || '0',
              'Otros': cons_otros || '0'
            },
            excepciones: val(row, 'Excepciones', h => h.includes('excepciones')) || '',
            prohibiciones: val(row, 'Prohibiciones', h => h.includes('prohibiciones')) || '',
            unidades: val(row, 'Unidades', h => h.includes('unidades')) || ''
          };
        };
        const productosValidados = []; const errores = [];
    const formatTo10 = (n) => {
      if (!Number.isFinite(n)) return '0,00';
      const s = n.toFixed(10); // fijo 10 decimales
      const trimmed = s.replace(/\.?0+$/, ''); // quitar ceros a la derecha
      const withComma = trimmed.replace('.', ',');
      return withComma.replace(/,$/, ''); // si quedó coma al final, quitarla
    };
        const tipoReporte = localStorage.getItem('tipoReporte');

        // Opciones válidas
        const opcionesExcepciones = ["medicos", "quimicos", "alimentos", "higiene", "asistencia", "impacto", "residuos", "reciclado", "pitillos", "no_aplica"];
        const opcionesProhibiciones = ["bolsas_pago", "bolsas_publicidad", "rollos_bolsas", "mezcladores_pitillos", "soportes_bombas", "soportes_copitos", "envases_liquidos", "platos_utensilios", "confeti_manteles", "empaques_alimentos", "laminas_alimentos", "empaques_frutas", "adhesivos_etiquetas", "no_aplica"];

        jsonData.forEach((row, index) => {
          const producto = mapearColumnas(row);
          const numeroFila = headerIndex + 2 + index;

          // 1. Validar campos obligatorios
          if (!producto.empresaTitular.trim()) {
            errores.push(`Fila ${numeroFila}: 'Empresa titular' es obligatorio`);
          }
          if (!producto.nombreProducto.trim()) {
            errores.push(`Fila ${numeroFila}: 'Nombre Producto' es obligatorio`);
          }
          if (!producto.unidades.toString().trim()) {
            errores.push(`Fila ${numeroFila}: 'Unidades' es obligatorio`);
          }

          // 2. Validar excepciones y prohibiciones
          if (!opcionesExcepciones.includes(producto.excepciones)) {
            errores.push(`Fila ${numeroFila}: 'Excepciones' debe ser una opción válida. Opciones: ${opcionesExcepciones.join(', ')}`);
          }
          if (!opcionesProhibiciones.includes(producto.prohibiciones)) {
            errores.push(`Fila ${numeroFila}: 'Prohibiciones' debe ser una opción válida. Opciones: ${opcionesProhibiciones.join(', ')}`);
          }

          // 3. Validar regla mutua exclusión
          if (producto.excepciones !== "no_aplica" && producto.prohibiciones !== "no_aplica") {
            errores.push(`Fila ${numeroFila}: Uno de 'Excepciones' o 'Prohibiciones' debe ser 'no_aplica'`);
          }

          const normalizarGrupo = (grp, nombre) => {
            Object.keys(grp).forEach(k => {
              let v = grp[k];
              if (v === null || v === undefined || v === '') { grp[k] = '0,00'; return; }
              const s = v.toString().trim();
              // Intentar convertir SIEMPRE a número; si falla, marcar error.
              let num = parseFloat(s.replace(',', '.'));
              if (!Number.isFinite(num)) {
                errores.push(`Fila ${numeroFila}: '${nombre}.${k}' número inválido (${v})`);
                return;
              }
              // Aproximar automáticamente a 10 decimales
              grp[k] = formatTo10(num);
            });
          };
          normalizarGrupo(producto.liquidos, 'Líquidos');
          normalizarGrupo(producto.otrosProductos, 'OtrosProductos');
          normalizarGrupo(producto.construccion, 'Construccion');

          // 5. Validar unidades según tipoReporte
          if (tipoReporte === "totalizado") {
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
            liquidos: producto.liquidos,
            otrosProductos: producto.otrosProductos,
            construccion: producto.construccion,
            excepciones: producto.excepciones,
            prohibiciones: producto.prohibiciones,
            unidades: producto.unidades.toString()
          };

          productosValidados.push(productoFormateado);
        });

        if (errores.length > 0) {
          descargarErroresTXT(errores, file.name);
          alert('Se generó un TXT con los errores encontrados.');
          event.target.value = '';
          setIsLoading(false);
          return;
        }

        setLoadingMessage("Cargando datos en la tabla...");
        // Actualizar estado con productos validados y reiniciar a la primera página
        setProductos(productosValidados);
        setCurrentPage(1);
        
        // Mensaje informativo según el tipo de reporte
        let mensaje = `Se cargaron exitosamente ${productosValidados.length} productos desde Excel.`;
        if (tipoReporte === "totalizado") {
          mensaje += "\n\nNota: Las unidades fueron ajustadas automáticamente a 1 porque el tipo de reporte es totalizado.";
        }
        
        setLoadingMessage(`${productosValidados.length} productos cargados correctamente`);
        setTimeout(() => {
          setIsLoading(false);
          alert(mensaje);
        }, 500);

      } catch (error) {
        console.error('Error al procesar archivo Excel:', error);
        const errores = [
          'Error al procesar el archivo Excel. Verifique que el formato sea correcto.',
          `Detalle: ${error?.message || error}`
        ];
        descargarErroresTXT(errores, file?.name || 'archivo.xlsx');
        alert('Se generó un TXT con el detalle del error.');
        event.target.value = '';
        setIsLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const plasticsData = [
    {  type: "PET", unit: "Gramos", description: "(Polietilentereftalato) Es un plástico transparente y ligero, común en botellas de agua y bebidas. Se puede reconocer porque es claro, rígido y suele llevar el número 1 dentro del símbolo de reciclaje." },
    {  type: "HDPE", unit: "Gramos", description: "(Polietileno de alta densidad) Es más opaco y resistente, común en envases de detergentes y productos de limpieza. Se puede identificar por su textura rígida y generalmente lleva el número 2 en el símbolo de reciclaje." },
    {  type: "PVC", unit: "Gramos", description: "(Policloruro de vinilo) Es un plástico rígido o flexible, usado en tuberías y algunos envases de alimentos. Suele ser más difícil de doblar y lleva el número 3 en el símbolo de reciclaje." },
    {  type: "LDPE", unit: "Gramos", description: "(Polietileno de baja densidad) es un plástico flexible y ligero, común en bolsas de plástico, envolturas y algunos tipos de envases. Se puede reconocer por su textura suave y flexible, y generalmente lleva el número 4 en el símbolo de reciclaje." },
    {  type: "PP", unit: "Gramos", description: "(Polipropileno) es un plástico resistente al calor, común en tapas de botellas, envases de alimentos y productos médicos. Se puede reconocer porque es rígido pero ligero, y generalmente lleva el número 5 en el símbolo de reciclaje." },
    {  type: "PS", unit: "Gramos", description: "(Poliestireno) es un plástico ligero y frágil, utilizado en vasos desechables, envases de comida y materiales de embalaje. Se puede reconocer por su textura rígida o espumosa y suele llevar el número 6 en el símbolo de reciclaje." },
    {  type: "OTROS", unit: "Gramos", description: "(Otros) se refiere a plásticos que no entran en las categorías comunes (1 a 6), como mezclas de diferentes tipos de plásticos o plásticos menos frecuentes. Se pueden reconocer por llevar el número 7 en el símbolo de reciclaje y suelen ser más difíciles de reciclar." }
  ];

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

          {/* Texto del progreso */}
          {(() => {
            const percentage = uploadProgress.total > 0
              ? Math.round((uploadProgress.done / uploadProgress.total) * 100)
              : 0;
            return (
              <>
                <span className="text-blue-700 font-semibold mt-4 bg-white px-4 py-2 rounded-lg shadow">
                  {uploadProgress.total > 0 ? `Guardando información... ${percentage}%` : loadingMessage}
                </span>

                {/* Barra de progreso - solo mostrar durante guardado */}
                {uploadProgress.total > 0 && (
                  <div className="w-64 h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-2 bg-blue-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </Backdrop>

      {/* SECCIÓN II */}
      <div className="p-4">
        <h3 className="text-lg font-semibold flex items-center">
          Empaques Plasticos&nbsp;
          <i 
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer" 
            onClick={() => setIsOpen(true)}
          ></i>
        </h3>
        <div className="mt-2 mb-2 text-blue-700 font-bold text-lg">
          Toneladas acumuladas (Plasticos): {Number(toneladasAcumuladasGlobal).toFixed(10)}
        </div>
        {!readonly && (
          <div className="flex justify-between mt-3 gap-2">
            <button 
              type="button"
              className="bg-lightBlue-600 text-white px-4 py-2 rounded hover:bg-lightBlue-700" 
              onClick={agregarProducto}
            >
              Agregar Producto
            </button>
            
            <label className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded cursor-pointer inline-flex items-center">
              Cargar Excel
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={cargarDesdeExcel}
                className="hidden"
              />
            </label>
            <button 
                type="button"
                className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded"
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
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">No.</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Empresa Titular</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Nombre Producto</th>
                  <th colSpan="9" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Líquidos</th>
                  <th colSpan="7" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Otros Productos Plásticos</th>
                  <th colSpan="7" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Plásticos de Construcción</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total (g)</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Excepciones Ley 2232</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Prohibiciones Ley 2232</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Unidades Puestas en el mercado</th>
                  {!readonly && <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Acciones</th>}
                </tr>
                <tr className="bg-gray-200">
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de botellas PET de agua (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de botellas PET de otro tipo de bebidas (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PET para otros líquidos (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">HDPE (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PVC (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">LDPE (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PP (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PS (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Otros (g)</th>
                  {['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'Otros'].map((item) => (
                    <th key={`otros-${item}`} className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{item} (g)</th>
                  ))}
                  {['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'Otros'].map((item) => (
                    <th key={`construccion-${item}`} className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{item} (g)</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={readonly ? "26" : "27"} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center">
                        <i className="fas fa-recycle text-4xl text-gray-400 mb-3"></i>
                        <p className="text-lg font-medium">No hay empaques plásticos registrados</p>
                        <p className="text-sm">Agregue productos manualmente o cargue un archivo Excel</p>
                      </div>
                    </td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td colSpan={readonly ? "26" : "27"} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        <span className="text-gray-600">{loadingMessage}</span>
                      </div>
                    </td>
                  </tr>
                ) : (() => {
                  const totalItems = productos.length;
                  const startIdx = (currentPage - 1) * pageSize;
                  const endIdx = Math.min(totalItems, startIdx + pageSize);
                  return productos.slice(startIdx, endIdx).map((producto, idx) => {
                    const index = startIdx + idx;
                  // Parsear los campos que vienen como string JSON
                  // Usar siempre el valor local (mayúsculas) si existe, si no, fallback al backend
                  const liquidos = typeof producto.liquidos === "string" ? JSON.parse(producto.liquidos || "{}") : (producto.liquidos || {});
                  const otrosProductos = typeof producto.otrosProductos === "string" ? JSON.parse(producto.otrosProductos || "{}") : (producto.otrosProductos || {});
                  const construccion = typeof producto.construccion === "string" ? JSON.parse(producto.construccion || "{}") : (producto.construccion || {});

                  return (
                    <tr key={producto.idEmpaque || index} className="border-t text-center">
                      <td className="p-2 border border-gray-300">{index + 1}</td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(index, "empresaTitular", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.empresaTitular !== undefined ? producto.empresaTitular : (producto.empresa || "")}
                          </div>
                        ) : (
                          <div className="p-1">{producto.empresaTitular !== undefined ? producto.empresaTitular : (producto.empresa || "")}</div>
                        )}
                      </td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(index, "nombreProducto", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.nombreProducto !== undefined ? producto.nombreProducto : (producto.nombre_producto || "")}
                          </div>
                        ) : (
                          <div className="p-1">{producto.nombreProducto !== undefined ? producto.nombreProducto : (producto.nombre_producto || "")}</div>
                        )}
                      </td>
                      {/* Líquidos */}
                      {["PET Agua", "PET Otros", "PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`liquidos-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          {esEditable ? (
                            <div
                              contentEditable
                              onBlur={e => handleChange(index, `liquidos.${key}`, e.target.textContent || "")}
                              className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                            >
                              {liquidos[key] !== undefined ? liquidos[key] : 0}
                            </div>
                          ) : (
                            <div className="p-1">{liquidos[key] !== undefined ? liquidos[key] : 0}</div>
                          )}
                        </td>
                      ))}
                      {/* Otros Productos */}
                      {["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`otrosProductos-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          {esEditable ? (
                            <div
                              contentEditable
                              onBlur={e => handleChange(index, `otrosProductos.${key}`, e.target.textContent || "")}
                              className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                            >
                              {otrosProductos[key] !== undefined ? otrosProductos[key] : 0}
                            </div>
                          ) : (
                            <div className="p-1">{otrosProductos[key] !== undefined ? otrosProductos[key] : 0}</div>
                          )}
                        </td>
                      ))}
                      {/* Construcción */}
                      {["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`construccion-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          {esEditable ? (
                            <div
                              contentEditable
                              onBlur={e => handleChange(index, `construccion.${key}`, e.target.textContent || "")}
                              className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                            >
                              {construccion[key] !== undefined ? construccion[key] : 0}
                            </div>
                          ) : (
                            <div className="p-1">{construccion[key] !== undefined ? construccion[key] : 0}</div>
                          )}
                        </td>
                      ))}
                      {/* Total fila (g) */}
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        {(() => {
                          const toNum = (v) => {
                            if (v === null || v === undefined || v === '') return 0;
                            const n = parseFloat(v.toString().replace(',', '.'));
                            return isNaN(n) ? 0 : n;
                          };
                          const sumObj = (obj) => Object.values(obj || {}).reduce((a, val) => a + toNum(val), 0);
                          const liq = typeof producto.liquidos === 'string' ? JSON.parse(producto.liquidos || '{}') : (producto.liquidos || {});
                          const otr = typeof producto.otrosProductos === 'string' ? JSON.parse(producto.otrosProductos || '{}') : (producto.otrosProductos || {});
                          const cons = typeof producto.construccion === 'string' ? JSON.parse(producto.construccion || '{}') : (producto.construccion || {});
                          const totalFila = sumObj(liq) + sumObj(otr) + sumObj(cons);
                          const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '0,00');
                          return fmt(totalFila);
                        })()}
                      </td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <select
                          className="border p-1 w-full"
                          value={producto.excepciones}
                          onChange={e => handleChange(index, "excepciones", e.target.value)}
                          disabled={!esEditable}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="medicos">Propósitos médicos</option>
                          <option value="quimicos">Químicos con riesgo a la salud humana o al medio ambiente</option>
                          <option value="alimentos">Alimentos, líquidos y bebidas de origen animal, por razones de asepsia o inocuidad</option>
                          <option value="higiene">Fines específicos que por razones de higiene o salud requieren bolsa</option>
                          <option value="asistencia">Uso del plástico en los establecimientos que brindan asistencia médica</option>
                          <option value="impacto">Los plásticos de un solo uso cuyos sustitutos tengan un impacto ambiental y humano mayor</option>
                          <option value="residuos">Empacar o envasar residuos peligrosos</option>
                          <option value="reciclado">Aquellos productos fabricados con 100% de materia reciclada</option>
                          <option value="pitillos">Pitillos adheridos a envases de hasta 300 ml con sistema de retención</option>
                          <option value="no_aplica">No Aplica</option>
                        </select>
                      </td>
                      {/* Prohibiciones */}
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <select
                          className="border p-1 w-full"
                          value={producto.prohibiciones}
                          onChange={e => handleChange(index, "prohibiciones", e.target.value)}
                          disabled={!esEditable}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="bolsas_pago">Bolsas de punto de pago (2024)</option>
                          <option value="bolsas_publicidad">Bolsas para publicidad, facturas y lavanderías (2024)</option>
                          <option value="rollos_bolsas">Rollos de bolsas vacías en comercios (2024)</option>
                          <option value="mezcladores_pitillos">Mezcladores y pitillos para bebidas (2024)</option>
                          <option value="soportes_bombas">Soportes plásticos para bombas de inflar (2024)</option>
                          <option value="soportes_copitos">Soportes plásticos de los hisopos flexibles (2024)</option>
                          <option value="envases_liquidos">Envases y bolsas para líquidos no preenvasados (2030)</option>
                          <option value="platos_utensilios">Platos, bandejas, cubiertos, vasos y guantes para comer (2030)</option>
                          <option value="confeti_manteles">Confeti, manteles y serpentinas (2030)</option>
                          <option value="empaques_alimentos">Empaques para comidas no preenvasadas (2030)</option>
                          <option value="laminas_alimentos">Láminas para servir o envolver alimentos (2030)</option>
                          <option value="empaques_frutas">Empaques para frutas, verduras y tubérculos frescos (2030)</option>
                          <option value="adhesivos_etiquetas">Adhesivos, etiquetas o distintivos en vegetales (2030)</option>
                          <option value="no_aplica">No Aplica</option>
                        </select>
                      </td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        {localStorage.getItem("tipoReporte") === "totalizado" ? (
                          <div className="w-fit max-w-full p-1 border border-gray-300 bg-gray-100 text-center">1</div>
                        ) : esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(index, "unidades", e.target.textContent || "")}
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
                            onClick={e => { e.preventDefault(); setProductos(productos.filter((_, i) => i !== index)); }}
                            disabled={!esEditable}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                });
                })()}
                {/* Closing the ternary operator for the tbody content */}
                
              </tbody>
              {/* Totales sobre TODOS los registros (no por página) */}
              {productos.length > 0 && (
                (() => {
                  const liquidosKeys = ["PET Agua","PET Otros","PET","HDPE","PVC","LDPE","PP","PS","Otros"];
                  const otrosKeys = ["PET","HDPE","PVC","LDPE","PP","PS","Otros"];
                  const toNum = (v) => {
                    if (v === null || v === undefined || v === '') return 0;
                    const n = parseFloat(v.toString().replace(',', '.'));
                    return isNaN(n) ? 0 : n;
                  };
                  const totalUnidades = productos.reduce((acc, p) => {
                    const s = (p.unidades ?? '').toString().trim();
                    const n = parseInt(s, 10);
                    return acc + (isNaN(n) ? 0 : n);
                  }, 0);
                  const sumGrupo = (key, grupoName) => productos.reduce((acc, p) => {
                    const g = typeof p[grupoName] === 'string' ? (()=>{ try { return JSON.parse(p[grupoName]); } catch { return {}; } })() : (p[grupoName] || {});
                    return acc + toNum(g[key]);
                  }, 0);
                  const fmt = (n) => (Number.isFinite(n) ? n.toFixed(2).replace('.', ',') : '0,00');
                  return (
                    <tr className="bg-gray-50 font-semibold text-center">
                      {/* No. + Empresa + Nombre */}
                      <td className="border border-gray-300 px-2 py-1 text-right" colSpan={3}>Totales</td>
                      {/* Líquidos */}
                      {liquidosKeys.map(k => (
                        <td key={`t-liq-${k}`} className="border border-gray-300 px-2 py-1">{fmt(sumGrupo(k,'liquidos'))}</td>
                      ))}
                      {/* Otros Productos */}
                      {otrosKeys.map(k => (
                        <td key={`t-otros-${k}`} className="border border-gray-300 px-2 py-1">{fmt(sumGrupo(k,'otrosProductos'))}</td>
                      ))}
                      {/* Construcción */}
                      {otrosKeys.map(k => (
                        <td key={`t-cons-${k}`} className="border border-gray-300 px-2 py-1">{fmt(sumGrupo(k,'construccion'))}</td>
                      ))}
                      {/* Total (g) de materiales */}
                      {(() => {
                        const totalLiquidos = ["PET Agua","PET Otros","PET","HDPE","PVC","LDPE","PP","PS","Otros"].reduce((acc,k)=> acc + sumGrupo(k,'liquidos'), 0);
                        const totalOtros = ["PET","HDPE","PVC","LDPE","PP","PS","Otros"].reduce((acc,k)=> acc + sumGrupo(k,'otrosProductos'), 0);
                        const totalConstruccion = ["PET","HDPE","PVC","LDPE","PP","PS","Otros"].reduce((acc,k)=> acc + sumGrupo(k,'construccion'), 0);
                        const grand = totalLiquidos + totalOtros + totalConstruccion;
                        return (<td className="border border-gray-300 px-2 py-1">{fmt(grand)}</td>);
                      })()}
                      {/* Excepciones / Prohibiciones / Unidades */}
                      <td className="border border-gray-300 px-2 py-1"></td>
                      <td className="border border-gray-300 px-2 py-1"></td>
                      <td className="border border-gray-300 px-2 py-1">{totalUnidades}</td>
                      {/* Acciones (si aplica) */}
                      {!readonly && <td className="border border-gray-300 px-2 py-1"></td>}
                    </tr>
                  );
                })()
              )}
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
            <div className="flex items-center justify-between mt-3">
              <button
                type="submit"
                className={`px-4 py-2 rounded ${
                  esEditable
                    ? "bg-lightBlue-600 hover:bg-lightBlue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!esEditable}
              >
                Guardar
              </button>

              <button
                type="button"
                onClick={agregarProducto}
                className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded"
              >
                Agregar Producto
              </button>
            </div>
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
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border px-4 py-2">Tipo</th>
                <th className="border px-4 py-2">Unidad</th>
                <th className="border px-4 py-2">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {plasticsData.map((plastic) => (
                <tr key={plastic.code} className="border">
                  <td className="border px-4 py-2 text-center">{plastic.type}</td>
                  <td className="border px-4 py-2 text-center">{plastic.unit}</td>
                  <td className="border px-4 py-2">{plastic.description}</td>
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